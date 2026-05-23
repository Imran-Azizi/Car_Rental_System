import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const UPLOADS_ROOT = path.resolve(__dirname, '..', 'uploads');

/**
 * Safely delete a file whose path is stored as "/uploads/subfolder/filename".
 * - Resolves the full path, guards against path traversal, then unlinks.
 * - Silent on missing files so callers don't need try/catch.
 */
export function deleteUploadedFile(storedPath) {
  if (!storedPath) return;
  try {
    const relative = storedPath.replace(/^\/+uploads\/+/, '');
    const full = path.resolve(UPLOADS_ROOT, relative);
    // Path-traversal guard: must remain inside the uploads folder
    if (!full.startsWith(UPLOADS_ROOT + path.sep) && full !== UPLOADS_ROOT) return;
    if (fs.existsSync(full)) fs.unlinkSync(full);
  } catch { /* already gone or unreadable — don't crash */ }
}

/** Delete multiple files in one call */
export function deleteUploadedFiles(...paths) {
  paths.forEach(deleteUploadedFile);
}
