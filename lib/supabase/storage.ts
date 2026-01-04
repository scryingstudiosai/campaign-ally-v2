// Storage bucket name for campaign images
export const CAMPAIGN_IMAGES_BUCKET = 'campaign-images';

// Helper to get public URL for a storage path
export function getStorageUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${CAMPAIGN_IMAGES_BUCKET}/${path}`;
}

// Helper to extract path from a full storage URL
export function extractStoragePath(url: string): string | null {
  const bucketPattern = `/storage/v1/object/public/${CAMPAIGN_IMAGES_BUCKET}/`;
  const index = url.indexOf(bucketPattern);
  if (index === -1) return null;
  return url.substring(index + bucketPattern.length);
}

// Check if URL is from our storage
export function isStorageUrl(url: string): boolean {
  return url.includes('supabase.co') && url.includes(CAMPAIGN_IMAGES_BUCKET);
}
