export function getPresignedUrlForDownload(key: string): string {
  return `${process.env.R2_BUCKET_URL ?? ''}/${process.env.R2_BUCKET_NAME ?? ''}/${key}`;
}
