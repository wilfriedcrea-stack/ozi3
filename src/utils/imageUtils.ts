/**
 * Normalizes an image or asset URL to ensure it never breaks in the browser:
 * - If protocol-less domain like "ozibd.net/banner/ban1.png", prepends "https://"
 * - If "http://", upgrades to "https://" to prevent browser Mixed-Content blocking
 * - Preserves root-relative paths ("/assets/...", "/images/...", "./...") and data URLs ("data:...")
 */
export function normalizeImageUrl(url: string | undefined | null, fallback = ''): string {
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (!trimmed) return fallback;

  // Local assets, relative paths, SVG inline, or base64 data URLs
  if (
    trimmed.startsWith('data:') || 
    trimmed.startsWith('blob:') || 
    trimmed.startsWith('/') || 
    trimmed.startsWith('./') ||
    trimmed.startsWith('../')
  ) {
    return trimmed;
  }

  // Protocol-relative URL ("//ozibd.net/...")
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  // Upgrade http to https to avoid Mixed Content security blocks
  if (trimmed.startsWith('http://')) {
    return trimmed.replace('http://', 'https://');
  }

  // Standard https URL
  if (trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Domain without scheme (e.g. "ozibd.net/banner/ban4.png" or "images.unsplash.com/...")
  return `https://${trimmed}`;
}
