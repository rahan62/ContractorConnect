import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ message: "Token is required" }, { status: 400 });
  }

  try {
    const record = await prisma.emailVerificationToken.findUnique({
      where: { token }
    });

    if (!record) {
      return NextResponse.json({ message: "Token not found" }, { status: 400 });
    }

    if (record.expires < new Date()) {
      return NextResponse.json({ message: "Token expired" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: new Date() }
    });

    await prisma.emailVerificationToken.delete({ where: { id: record.id } });

    const redirectUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/en/auth/signin?verified=1`
      : "/en/auth/signin?verified=1";

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("[verify-email] error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

