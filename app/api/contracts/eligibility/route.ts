import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      userType: true,
      signatureAuthDocUrl: true,
      taxCertificateDocUrl: true,
      tradeRegistryGazetteDocUrl: true
    }
  });

  if (!user || user.userType !== "CONTRACTOR") {
    return NextResponse.json({ message: "Only contractors can create contracts" }, { status: 403 });
  }

  if (
    !user.signatureAuthDocUrl ||
    !user.taxCertificateDocUrl ||
    !user.tradeRegistryGazetteDocUrl
  ) {
    return NextResponse.json(
      {
        message:
          "Company documents are missing. Please upload signature authorization, tax certificate and trade registry gazette before creating contracts."
      },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}

