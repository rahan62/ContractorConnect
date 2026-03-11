import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface Params {
  params: { id: string };
}

export async function POST(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, userType: true }
  });

  if (!user || user.userType !== "CONTRACTOR") {
    return NextResponse.json({ message: "Only contractors can comment" }, { status: 403 });
  }

  const body = await request.json();
  const { body: commentBody } = body as { body: string };

  if (!commentBody) {
    return NextResponse.json({ message: "Comment body is required" }, { status: 400 });
  }

  const contract = await prisma.contract.findUnique({ where: { id: params.id } });
  if (!contract) {
    return NextResponse.json({ message: "Contract not found" }, { status: 404 });
  }

  const comment = await prisma.comment.create({
    data: {
      contractId: params.id,
      authorId: user.id,
      content: commentBody
    }
  });

  return NextResponse.json(
    {
      id: comment.id,
      body: comment.content
    },
    { status: 201 }
  );
}

