const PBKDF2_ITERATIONS = 120_000;
const HASH_ALGORITHM = 'SHA-256';
const SALT_BYTES = 16;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array {
  if (!/^[0-9a-f]{2,}$/i.test(hex) || hex.length % 2 !== 0) throw new Error('Invalid PIN salt.');
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

export async function hashPin(pin: string, saltHex?: string): Promise<{ hash: string; salt: string }> {
  const salt = saltHex ? hexToBytes(saltHex) : crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: HASH_ALGORITHM },
    keyMaterial,
    256,
  );
  return { hash: `pbkdf2-sha256-${PBKDF2_ITERATIONS}$${bytesToHex(new Uint8Array(derivedBits))}`, salt: bytesToHex(salt) };
}

export async function verifyPin(enteredPin: string, storedHash: string, storedSalt: string): Promise<boolean> {
  if (!storedHash.startsWith('pbkdf2-sha256-')) return false;
  const { hash } = await hashPin(enteredPin, storedSalt);
  return hash === storedHash;
}

export async function verifyLegacyPin(enteredPin: string, storedHash: string, storedSalt: string): Promise<boolean> {
  const bytes = new TextEncoder().encode(`mom-haven-app-lock-v2:${storedSalt}:${enteredPin}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return bytesToHex(new Uint8Array(digest)) === storedHash;
}
