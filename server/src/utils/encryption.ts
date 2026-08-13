import crypto from 'node:crypto';

// Encryption key from environment or fallback dev key (32 bytes = 256 bits)
const MASTER_KEY_HEX = process.env.PAYOUT_ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  if (process.env.NODE_ENV === 'production' && !process.env.PAYOUT_ENCRYPTION_KEY) {
    throw new Error('PAYOUT_ENCRYPTION_KEY must be set in production');
  }
  const keyBuf = Buffer.from(MASTER_KEY_HEX, 'hex');
  if (keyBuf.length === 32) return keyBuf;
  return crypto.createHash('sha256').update(MASTER_KEY_HEX).digest();
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
  const key = getEncryptionKey();
  const iv = Buffer.from(payload.iv, 'base64');
  const authTag = Buffer.from(payload.authTag, 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(payload.ciphertext, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
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
    if (parsed && typeof parsed === 'object' && parsed.__enc === true) {
      const decryptedStr = decryptField({
        iv: parsed.iv,
        ciphertext: parsed.ciphertext,
        authTag: parsed.authTag,
      });
      return JSON.parse(decryptedStr);
    }
    return parsed;
  } catch (err) {
    console.error('Failed to decrypt payout details:', err);
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
