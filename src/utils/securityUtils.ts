/**
 * Security & Hashing utilities for OZI Admin Authentication
 */

export async function hashPassword(password: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback below
    }
  }
  // Simple fallback hash if crypto.subtle is unavailable
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `fb_${Math.abs(hash).toString(16)}`;
}

export async function verifyPassword(inputPassword: string, storedHashOrPlain: string): Promise<boolean> {
  if (!inputPassword || !storedHashOrPlain) return false;
  
  // Direct match check (supports plaintext default or initial migration)
  if (inputPassword === storedHashOrPlain) {
    return true;
  }

  // SHA-256 Hash check
  const inputHash = await hashPassword(inputPassword);
  if (inputHash.toLowerCase() === storedHashOrPlain.toLowerCase()) {
    return true;
  }

  return false;
}
