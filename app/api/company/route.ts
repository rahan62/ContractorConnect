import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      userType: true,
      companyName: true,
      bio: true,
      logoUrl: true,
      bannerUrl: true,
      companyTaxOffice: true,
      companyTaxNumber: true,
      authorizedPersonName: true,
      authorizedPersonPhone: true,
      signatureAuthDocUrl: true,
      taxCertificateDocUrl: true,
      tradeRegistryGazetteDocUrl: true,
      contractsCreated: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          startsAt: true,
          totalDays: true,
          imageUrls: true,
          createdAt: true
        }
      }
    }
  });

  if (!user) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    companyName,
    bio,
    logoUrl,
    bannerUrl,
    companyTaxOffice,
    companyTaxNumber,
    authorizedPersonName,
    authorizedPersonPhone,
    signatureAuthDocUrl,
    taxCertificateDocUrl,
    tradeRegistryGazetteDocUrl
  } = body;

  const updated = await prisma.user.update({
    where: { email: session.user.email },
    data: {
      companyName,
      bio,
      logoUrl,
      bannerUrl,
      companyTaxOffice,
      companyTaxNumber,
      authorizedPersonName,
      authorizedPersonPhone,
      signatureAuthDocUrl,
      taxCertificateDocUrl,
      tradeRegistryGazetteDocUrl
    },
    select: {
      companyName: true,
      bio: true,
      logoUrl: true,
      bannerUrl: true,
      companyTaxOffice: true,
      companyTaxNumber: true,
      authorizedPersonName: true,
      authorizedPersonPhone: true,
      signatureAuthDocUrl: true,
      taxCertificateDocUrl: true,
      tradeRegistryGazetteDocUrl: true
    }
  });

  return NextResponse.json(updated);
}

