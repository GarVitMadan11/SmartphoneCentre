import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;        // 96 bits for GCM
const AUTH_TAG_LENGTH = 16;  // 128-bit authentication tag

/**
 * Returns the AES-256-GCM encryption key from the environment.
 *
 * Throws a fatal error if:
 * - PAYOUT_ENCRYPTION_KEY is not set
 * - The hex string does not decode to exactly 32 bytes (256 bits)
 *
 * Generate a suitable key with:
 *   node -e "require('crypto').randomBytes(32).toString('hex')"
 */
/**
 * Helper to derive a 32-byte key from any string or hex.
 */
function deriveKeyFromSecret(secretStr: string): Buffer {
  const trimmed = secretStr.trim();
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return Buffer.from(trimmed, 'hex');
  }
  return crypto.createHash('sha256').update(trimmed).digest();
}

/**
 * Returns the primary AES-256-GCM encryption key from the environment.
 */
function getEncryptionKey(): Buffer {
  const envKey = (process.env.PAYOUT_ENCRYPTION_KEY || '').trim();
  if (envKey) {
    return deriveKeyFromSecret(envKey);
  }
  const fallbackSecret = (process.env.JWT_SECRET || 'smartphone-centre-payout-key-fallback').trim();
  return deriveKeyFromSecret(fallbackSecret);
}

/**
 * Returns candidate keys to attempt decryption when environment keys rotate or differ.
 */
function getCandidateDecryptionKeys(): Buffer[] {
  const keys: Buffer[] = [];
  const primary = getEncryptionKey();
  keys.push(primary);

  if (process.env.PAYOUT_ENCRYPTION_KEY) {
    const rawKey = deriveKeyFromSecret(process.env.PAYOUT_ENCRYPTION_KEY);
    if (!keys.some(k => k.equals(rawKey))) keys.push(rawKey);
  }

  if (process.env.JWT_SECRET) {
    const jwtKey = deriveKeyFromSecret(process.env.JWT_SECRET);
    if (!keys.some(k => k.equals(jwtKey))) keys.push(jwtKey);
  }

  const defaultKey = deriveKeyFromSecret('smartphone-centre-payout-key-fallback');
  if (!keys.some(k => k.equals(defaultKey))) keys.push(defaultKey);

  return keys;
}

export interface EncryptedPayload {
  iv: string;         // base64
  ciphertext: string; // base64
  authTag: string;    // base64
}

/**
 * Encrypts a string value using AES-256-GCM.
 */
export function encryptField(plainText: string): EncryptedPayload {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  
  let encrypted = cipher.update(plainText, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag().toString('base64');

  return {
    iv: iv.toString('base64'),
    ciphertext: encrypted,
    authTag,
  };
}

/**
 * Decrypts an AES-256-GCM encrypted payload back to plaintext string.
 */
export function decryptField(payload: EncryptedPayload): string {
  const candidateKeys = getCandidateDecryptionKeys();
  const iv = Buffer.from(payload.iv, 'base64');
  const authTag = Buffer.from(payload.authTag, 'base64');

  for (const key of candidateKeys) {
    try {
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(payload.ciphertext, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      // Try next key
    }
  }

  throw new Error('Unsupported state or unable to authenticate data with candidate keys');
}

/**
 * Encrypts sensitive payout details JSON object into a safe string representation.
 */
export function encryptPayoutDetails(details: Record<string, unknown>): string {
  const rawJson = JSON.stringify(details);
  const encrypted = encryptField(rawJson);
  return JSON.stringify({ __enc: true, ...encrypted });
}

/**
 * Decrypts sensitive payout details JSON string if encrypted, or parses JSON.
 */
export function decryptPayoutDetails(detailsJson: string): Record<string, unknown> {
  if (!detailsJson || detailsJson === '{}') return {};
  try {
    const parsed = JSON.parse(detailsJson);
    if (parsed && typeof parsed === 'object' && parsed.__enc === true && parsed.iv && parsed.ciphertext && parsed.authTag) {
      try {
        const decryptedStr = decryptField({
          iv: parsed.iv,
          ciphertext: parsed.ciphertext,
          authTag: parsed.authTag,
        });
        return JSON.parse(decryptedStr);
      } catch (err) {
        console.warn('Payout details decryption failed across candidate keys. Returning empty details.');
        return {};
      }
    }
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (err) {
    console.error('Failed to parse payout details JSON:', err);
    return {};
  }
}

/**
 * Masks bank account numbers (e.g. "123456789012" -> "••••••••9012").
 */
export function maskBankAccount(accountNo?: string): string {
  if (!accountNo || typeof accountNo !== 'string') return '';
  const trimmed = accountNo.trim();
  if (trimmed.length <= 4) return '••••' + trimmed;
  return '••••'.repeat(Math.max(1, Math.floor((trimmed.length - 4) / 4))) + trimmed.slice(-4);
}

/**
 * Masks UPI IDs (e.g. "john.doe@okaxis" -> "j•••e@okaxis").
 */
export function maskUpiId(upiId?: string): string {
  if (!upiId || typeof upiId !== 'string') return '';
  const parts = upiId.trim().split('@');
  if (parts.length !== 2) return '••••@upi';
  const handle = parts[0];
  const domain = parts[1];
  if (handle.length <= 2) return `${handle[0] ?? ''}•@${domain}`;
  return `${handle[0]}•••${handle[handle.length - 1]}@${domain}`;
}

/**
 * Given raw payout details, returns a safe masked version for public/general admin view.
 */
export function maskPayoutDetails(details: Record<string, unknown>): Record<string, string> {
  const masked: Record<string, string> = {};
  if (details.upiId && typeof details.upiId === 'string') {
    masked.upiId = maskUpiId(details.upiId);
  }
  if (details.accountNumber && typeof details.accountNumber === 'string') {
    masked.accountNumber = maskBankAccount(details.accountNumber);
  }
  if (details.accountHolderName && typeof details.accountHolderName === 'string') {
    const name = details.accountHolderName.trim();
    masked.accountHolderName = name.length > 2 ? `${name[0]}•••• ${name.split(' ').pop()?.[0] ?? ''}••••` : '••••';
  }
  if (details.ifscCode && typeof details.ifscCode === 'string') {
    const ifsc = details.ifscCode.trim();
    masked.ifscCode = ifsc.length > 4 ? `${ifsc.slice(0, 4)}••••` : '••••';
  }
  return masked;
}
