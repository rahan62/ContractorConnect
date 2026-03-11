import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTurnstile } from "@/lib/turnstile";
import { sendEmailVerification } from "@/lib/email";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      companyName,
      email,
      password,
      userType,
      companyTaxOffice,
      companyTaxNumber,
      authorizedPersonName,
      authorizedPersonPhone,
      turnstileToken
    } = body;

    const ok = await verifyTurnstile(turnstileToken);
    if (!ok) {
      return NextResponse.json({ message: "Turnstile verification failed" }, { status: 400 });
    }

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
    }

    const existingByEmail = await prisma.user.findUnique({ where: { email } });
    if (existingByEmail) {
      return NextResponse.json({ message: "Email already in use" }, { status: 400 });
    }

    if (companyTaxNumber) {
      const existingByTaxNumber = await prisma.user.findFirst({
        where: { companyTaxNumber }
      });
      if (existingByTaxNumber) {
        return NextResponse.json(
          { message: "A company with this tax number already exists" },
          { status: 400 }
        );
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        userType,
        companyName,
        companyTaxOffice,
        companyTaxNumber,
        authorizedPersonName,
        authorizedPersonPhone
      }
    });

    // If this is a team leader, create an initial Team record
    if (userType === "TEAM") {
      await prisma.team.create({
        data: {
          name: companyName || email,
          leaderId: user.id
        }
      });
    }

    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);

    await prisma.emailVerificationToken.create({
      data: {
        token,
        userId: user.id,
        expires
      }
    });

    await sendEmailVerification({ to: email, token });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[register] error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

