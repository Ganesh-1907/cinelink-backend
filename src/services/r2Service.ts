import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { env } from '../config/env';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${env.r2.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.r2.accessKeyId,
    secretAccessKey: env.r2.secretAccessKey,
  },
});

export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array | Blob,
  contentType: string
): Promise<string> {
  await s3.send(new PutObjectCommand({
    Bucket: env.r2.bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
  return `${env.r2.publicUrl}/${key}`;
}

export async function deleteFromR2(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({
    Bucket: env.r2.bucket,
    Key: key,
  }));
}

export function getR2PublicUrl(key: string): string {
  return `${env.r2.publicUrl}/${key}`;
}
