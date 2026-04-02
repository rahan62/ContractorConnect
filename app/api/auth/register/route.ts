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
      subcontractorPrimaryCategoryId,
      crewPrimarySectionId,
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

    if (userType === "SUBCONTRACTOR") {
      if (!subcontractorPrimaryCategoryId || typeof subcontractorPrimaryCategoryId !== "string") {
        return NextResponse.json(
          { message: "Sub-contractors must select a primary trade category" },
          { status: 400 }
        );
      }
      const cat = await prisma.subcontractorMainCategory.findUnique({
        where: { id: subcontractorPrimaryCategoryId }
      });
      if (!cat) {
        return NextResponse.json({ message: "Invalid trade category" }, { status: 400 });
      }
    }

    if (userType === "TEAM") {
      if (!crewPrimarySectionId || typeof crewPrimarySectionId !== "string") {
        return NextResponse.json(
          { message: "Field crews must select a primary Crew Specialization section" },
          { status: 400 }
        );
      }
      const sec = await prisma.crewSpecializationSection.findUnique({
        where: { id: crewPrimarySectionId }
      });
      if (!sec) {
        return NextResponse.json({ message: "Invalid crew specialization section" }, { status: 400 });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async tx => {
      const created = await tx.user.create({
        data: {
          email,
          passwordHash,
          userType,
          companyName,
          companyTaxOffice,
          companyTaxNumber,
          authorizedPersonName,
          authorizedPersonPhone,
          subcontractorPrimaryCategoryId:
            userType === "SUBCONTRACTOR" ? subcontractorPrimaryCategoryId : undefined,
          crewPrimarySectionId: userType === "TEAM" ? crewPrimarySectionId : undefined
        }
      });

      if (userType === "SUBCONTRACTOR" && subcontractorPrimaryCategoryId) {
        await tx.userSubcontractorMainCategory.create({
          data: {
            userId: created.id,
            mainCategoryId: subcontractorPrimaryCategoryId
          }
        });
      }

      return created;
    });

    // Field crew leader: initial roster record (Team table)
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

