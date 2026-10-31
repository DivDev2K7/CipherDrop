import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let s3Client: S3Client | null = null;

export function initS3(): S3Client | null {
  const region = process.env.AWS_REGION;
  if (!region) {
    console.log('⚠️  AWS not configured — using local disk storage');
    return null;
  }

  try {
    s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    console.log('✅ S3 client initialized');
    return s3Client;
  } catch (err) {
    console.error('Failed to initialize S3 client:', err);
    return null;
  }
}

export function getS3(): S3Client | null {
  return s3Client;
}

export function isS3Enabled(): boolean {
  return s3Client !== null && !!process.env.S3_BUCKET;
}

export const S3_BUCKET = process.env.S3_BUCKET || '';

/**
 * Generate a pre-signed PUT URL for direct client-to-S3 upload.
 * Valid for 300 seconds (5 minutes).
 */
export async function generatePresignedPutUrl(
  key: string,
  contentType: string,
  expiresIn = 300
): Promise<string> {
  const client = getS3();
  if (!client) throw new Error('S3 not configured');

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Generate a pre-signed GET URL for ephemeral downloads.
 * Valid for 60 seconds after password unlock.
 */
export async function generatePresignedGetUrl(
  key: string,
  expiresIn = 60
): Promise<string> {
  const client = getS3();
  if (!client) throw new Error('S3 not configured');

  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Delete an object from S3.
 */
export async function deleteS3Object(key: string): Promise<void> {
  const client = getS3();
  if (!client) return;

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      })
    );
  } catch {
    // Object may not exist — ignore
  }
}