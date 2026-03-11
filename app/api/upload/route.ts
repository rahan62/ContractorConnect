import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { uploadToS3 } from "@/lib/s3";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.startsWith("multipart/form-data")) {
    return NextResponse.json({ message: "Invalid content type" }, { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "File is required" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const folder = (formData.get("folder") as string) || "misc";
  const originalName = file.name || "file";
  const ext = originalName.includes(".") ? originalName.split(".").pop() : undefined;
  const key = `${folder}/${Date.now()}-${randomBytes(8).toString("hex")}${ext ? `.${ext}` : ""}`;

  try {
    const { key: storedKey, url } = await uploadToS3({
      key,
      body: buffer,
      contentType: file.type
    });

    return NextResponse.json({ key: storedKey, url });
  } catch (error) {
    console.error("[upload] S3 error", error);
    return NextResponse.json({ message: "Upload failed" }, { status: 500 });
  }
}

