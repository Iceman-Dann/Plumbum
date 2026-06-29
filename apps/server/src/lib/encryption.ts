/**
 * Email encryption using AES-256-GCM (Node.js built-in crypto).
 * Equivalent security to Python's cryptography Fernet.
 *
 * Key is a 64-char hex string (32 bytes) stored in ENCRYPTION_KEY env var.
 * If the env var is absent at startup we generate one and log it — copy it
 * into .env before restarting in production.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

// ── Key bootstrap ─────────────────────────────────────────────────────────────

function loadKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (raw && raw.trim().length === 64) {
    return Buffer.from(raw.trim(), "hex");
  }
  // Generate a fresh key and print it for the operator to persist.
  const generated = randomBytes(32);
  const hex = generated.toString("hex");
  console.warn(
    "\n⚠️  ENCRYPTION_KEY not set in .env. Generated a temporary key:\n" +
    `   ENCRYPTION_KEY=${hex}\n` +
    "   Add this to your .env file NOW — emails encrypted with this key\n" +
    "   cannot be decrypted after a server restart without it.\n",
  );
  return generated;
}

let _key: Buffer | null = null;
function getKey(): Buffer {
  if (!_key) {
    _key = loadKey();
  }
  return _key;
}

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;  // 96-bit IV recommended for GCM
const TAG_BYTES = 16; // 128-bit auth tag

// ── Encrypt / Decrypt ────────────────────────────────────────────────────────

/**
 * Encrypts a UTF-8 plaintext string.
 * Returns base64url-encoded "iv:ciphertext:tag" (no padding, URL-safe).
 */
export function encrypt(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const key = getKey();
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Pack as iv || ciphertext || tag, then base64url
  return Buffer.concat([iv, encrypted, tag]).toString("base64url");
}

/**
 * Decrypts a string produced by `encrypt()`.
 * Throws if the auth tag doesn't match (tampered data).
 */
export function decrypt(encoded: string): string {
  const buf = Buffer.from(encoded, "base64url");
  const iv          = buf.subarray(0, IV_BYTES);
  const tag         = buf.subarray(buf.length - TAG_BYTES);
  const ciphertext  = buf.subarray(IV_BYTES, buf.length - TAG_BYTES);

  const key = getKey();
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

// ── Address hashing ──────────────────────────────────────────────────────────

/**
 * Returns a deterministic SHA-256 hex digest of the normalised address.
 * Used as a privacy-preserving key — the raw address is never stored.
 */
export function hashAddress(address: string): string {
  return createHash("sha256")
    .update(address.trim().toLowerCase())
    .digest("hex");
}

// ── Unsubscribe token ────────────────────────────────────────────────────────

/**
 * Generates a random 32-byte unsubscribe token (URL-safe base64).
 */
export function generateUnsubToken(): string {
  return randomBytes(32).toString("base64url");
}
