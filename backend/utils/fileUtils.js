/**
 * File-deletion utility — Cloudinary only.
 *
 * Handles two URL shapes:
 *   • Cloudinary  https://res.cloudinary.com/…/upload/v123/afshar-car-rental/customers/file.jpg
 *   • Legacy      /uploads/customers/file.jpg  (old records before Cloudinary migration)
 *
 * Legacy local paths are silently ignored — the files no longer exist on disk
 * (Railway containers are ephemeral), so there is nothing to delete.
 */
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({ secure: true }); // auto-reads CLOUDINARY_URL

/**
 * Delete a stored asset URL from Cloudinary.
 * Non-Cloudinary URLs (legacy local paths) are silently skipped.
 * Safe to fire-and-forget — returns a Promise that never rejects.
 */
export async function deleteUploadedFile(storedUrl) {
  if (!storedUrl) return;

  // Only act on real Cloudinary URLs
  if (!storedUrl.startsWith('https://res.cloudinary.com')) return;

  try {
    // URL shape: .../upload/v<ver>/<public_id>.<ext>  OR  .../upload/<public_id>.<ext>
    const match = storedUrl.match(/\/upload\/(?:v\d+\/)?(.+?)\.\w+$/);
    if (match) await cloudinary.uploader.destroy(match[1]);
  } catch { /* already deleted or unreachable — ignore */ }
}

/** Delete multiple stored URLs in parallel. */
export async function deleteUploadedFiles(...urls) {
  await Promise.all(urls.map(deleteUploadedFile));
}
