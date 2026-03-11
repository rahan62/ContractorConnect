import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const endpoint = process.env.S3_ENDPOINT;
const region = process.env.S3_REGION;
const accessKeyId = process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
const bucket = process.env.S3_BUCKET;

if (!endpoint || !region || !accessKeyId || !secretAccessKey || !bucket) {
  console.warn("[s3] Missing S3 configuration in environment variables");
}

export const s3BucketName = bucket!;

export const s3Client =
  endpoint && region && accessKeyId && secretAccessKey
    ? new S3Client({
        region,
        endpoint,
        forcePathStyle: true,
        credentials: { accessKeyId, secretAccessKey }
      })
    : null;

export async function uploadToS3(params: {
  key: string;
  body: Buffer;
  contentType?: string;
}) {
  if (!s3Client || !s3BucketName) {
    throw new Error("S3 client not configured");
  }

  const command = new PutObjectCommand({
    Bucket: s3BucketName,
    Key: params.key,
    Body: params.body,
    ContentType: params.contentType ?? "application/octet-stream"
  });

  await s3Client.send(command);

  // Public URL pattern for Supabase S3 endpoint
  const base = process.env.S3_PUBLIC_BASE_URL || endpoint?.replace(/\/storage\/v1\/s3$/, "");
  const url = `${base}/storage/v1/object/public/${s3BucketName}/${params.key}`;

  return { key: params.key, url };
}

