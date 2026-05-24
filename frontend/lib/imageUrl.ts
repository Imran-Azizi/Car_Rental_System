/**
 * Resolves a stored image path to a displayable URL.
 *
 * New records → Cloudinary returns a full https://res.cloudinary.com/… URL.
 *   resolveImgUrl("https://res.cloudinary.com/…") → "https://res.cloudinary.com/…"
 *
 * Legacy records → the DB still holds a local path like /uploads/customers/xxx.jpg.
 *   resolveImgUrl("/uploads/customers/xxx.jpg") → "https://api.railway.app/uploads/customers/xxx.jpg"
 *   (These images no longer exist on Railway but the fallback prevents crashes.)
 *
 * Returns null when no path is stored.
 */
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '');

export function resolveImgUrl(storedPath: string | null | undefined): string | null {
  if (!storedPath) return null;
  // Full URL already (Cloudinary or any external CDN) — use as-is
  if (storedPath.startsWith('http://') || storedPath.startsWith('https://')) {
    return storedPath;
  }
  // Legacy local path — prepend backend origin for backward compatibility
  return `${API_BASE}${storedPath}`;
}
