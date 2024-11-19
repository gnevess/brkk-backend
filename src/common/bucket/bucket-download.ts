import { HttpException } from '@nestjs/common';

import { getPresignedUrlForDownload } from './presigned-urls';

export function bucketDownload(key: string) {
  try {
    const downloadUrl = getPresignedUrlForDownload(key);

    return { key, downloadUrl };
  } catch (error: unknown) {
    throw new HttpException(error instanceof Error ? error.message : 'An unknown error occurred', 500);
  }
}
