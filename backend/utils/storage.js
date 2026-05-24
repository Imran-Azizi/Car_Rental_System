/**
 * Centralized file-upload utility — Cloudinary only.
 *
 * Every upload goes straight to Cloudinary (memory buffer → Cloudinary CDN).
 * No files are ever written to the local filesystem.
 * Requires CLOUDINARY_URL env var (set it on Railway and in .env for local dev).
 */
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({ secure: true }); // auto-reads CLOUDINARY_URL

// ── Image mime-type whitelist ────────────────────────────────────────────────
const IMAGE_FILTER = (req, file, cb) =>
  cb(null, ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.mimetype));

/**
 * Returns a multer instance that stores files in memory.
 * The `folder` argument is unused here — it is passed to cloudinaryMiddleware.
 * Keeping it in the signature makes call-sites uniform.
 */
export function createUpload(_folder) {
  return multer({
    storage: multer.memoryStorage(),
    fileFilter: IMAGE_FILTER,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  });
}

/**
 * Express middleware that must run directly after multer.
 * Uploads every buffered file to Cloudinary under `afshar-car-rental/<folder>/`
 * and attaches `file._cloudinaryUrl` + `file._publicId` to each file object.
 */
export function cloudinaryMiddleware(folder) {
  return async (req, res, next) => {
    const uploadOne = (file) =>
      new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { folder: `afshar-car-rental/${folder}`, resource_type: 'image' },
            (err, result) => (err ? reject(err) : resolve(result)),
          )
          .end(file.buffer);
      });

    try {
      if (req.file) {
        const r = await uploadOne(req.file);
        req.file._cloudinaryUrl = r.secure_url;
        req.file._publicId      = r.public_id;
      }

      if (req.files) {
        const allFiles = Array.isArray(req.files)
          ? req.files
          : Object.values(req.files).flat();
        for (const file of allFiles) {
          const r = await uploadOne(file);
          file._cloudinaryUrl = r.secure_url;
          file._publicId      = r.public_id;
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Returns the Cloudinary URL for a single-file upload (req.file).
 * The optional `_folder` param is accepted but unused — kept for backward-
 * compatible call-sites that pass it.
 */
export function getFileUrl(file, _folder) {
  return file?._cloudinaryUrl ?? undefined;
}

/**
 * Returns the Cloudinary URL for one field inside a multi-file upload (req.files).
 * The optional `_folder` param is accepted but unused.
 */
export function getFieldUrl(files, field, _folder) {
  return files?.[field]?.[0]?._cloudinaryUrl ?? undefined;
}

/**
 * Deletes an already-uploaded file from Cloudinary.
 * Call this when a validation error occurs after cloudinaryMiddleware has run.
 * Fire-and-forget — does not throw.
 */
export function cleanupFile(file) {
  if (file?._publicId) {
    cloudinary.uploader.destroy(file._publicId).catch(() => {});
  }
}
