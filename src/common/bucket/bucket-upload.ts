import { PutObjectCommand } from '@aws-sdk/client-s3';
import { HttpException, Logger } from '@nestjs/common';
import { r2Client } from './r2-client';

interface BucketUploadResponse {
  key: string;
}

export async function bucketUpload(file: Express.Multer.File): Promise<BucketUploadResponse> {
  const logger = new Logger('bucketUpload');
  if (!file) {
    throw new Error('File is required');
  }
  try {
    // Generate a more unique key using nanoid
    const key = `${Date.now()}-${file.originalname}`;

    let fileBuffer: Buffer;
    if (Buffer.isBuffer(file.buffer)) {
      fileBuffer = file.buffer;
    } else if (
      file.buffer &&
      typeof file.buffer === 'object' &&
      (file.buffer as any).type === 'Buffer' &&
      'data' in (file.buffer as object)
    ) {
      fileBuffer = Buffer.from((file.buffer as { data: number[] }).data);
    } else {
      throw new Error('Invalid file buffer format');
    }

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: file.mimetype,
    });

    await r2Client.send(command);
    logger.log(`File successfully uploaded with key: ${key}`);

    return { key };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to upload file: ${errorMessage}`);
    throw new HttpException(
      `Failed to upload file: ${errorMessage}`,
      500
    );
  }
}
