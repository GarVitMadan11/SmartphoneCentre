export const PHONE_RE = /^[6-9]\d{9}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const ALLOWED_STORAGE_GB = new Set([64, 128, 256, 512, 1024]);
export const ALLOWED_PAYOUT_METHODS = new Set([
  'doorstep',
  'upi',
  'bank',
  'amazon',
  'flipkart',
  'myntra',
  'googleplay',
  'apple',
  'steam',
  'swiggy',
  'zomato',
]);

export const ALLOWED_PICKUP_SLOTS = new Set([
  'Morning (09:00 AM - 01:00 PM)',
  'Evening (03:00 PM - 07:00 PM)',
  '09:00 AM - 12:00 PM (Morning)',
  '12:00 PM - 03:00 PM (Afternoon)',
  '03:00 PM - 06:00 PM (Evening)',
  '06:00 PM - 09:00 PM (Night)',
]);

export const UPI_RE = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{1,63}$/;
export const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const BANK_ACCOUNT_RE = /^\d{9,18}$/;

export function isValidImageUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim();
  if (trimmed === '') return true;
  if (/^data:image\//i.test(trimmed)) return true;
  if (/^https?:\/\//i.test(trimmed)) return true;
  if (/^\/\//.test(trimmed)) return true;
  if (/^[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+\//.test(trimmed)) return true;
  return false;
}

export function formatImageUrl(url?: string): string {
  if (!url || typeof url !== 'string') return '';
  let trimmed = url.trim();
  if (trimmed === '') return '';
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:')) {
    if (/^[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+\//.test(trimmed)) {
      return `https://${trimmed}`;
    }
  }
  return trimmed;
}

export function validateBookingBody(b: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (!b.customerName || typeof b.customerName !== 'string' || b.customerName.trim().length < 2 || b.customerName.trim().length > 100)
    errors.push('customerName: must be between 2 and 100 characters');
  if (!b.customerPhone || typeof b.customerPhone !== 'string' || !PHONE_RE.test(b.customerPhone.trim()))
    errors.push('customerPhone: must be a valid 10-digit Indian mobile number');
  if (!b.customerEmail || typeof b.customerEmail !== 'string' || b.customerEmail.trim().length > 100 || !EMAIL_RE.test(b.customerEmail.trim()))
    errors.push('customerEmail: must be a valid email address under 100 characters');
  if (!b.imei || typeof b.imei !== 'string' || b.imei.trim().length !== 15 || !/^\d{15}$/.test(b.imei.trim()))
    errors.push('imei: must be a valid 15-digit IMEI number');
  if (!b.address || typeof b.address !== 'string' || b.address.trim().length < 10 || b.address.trim().length > 500)
    errors.push('address: must be between 10 and 500 characters');
  if (!b.pickupDate || typeof b.pickupDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(b.pickupDate) || Number.isNaN(Date.parse(`${b.pickupDate}T00:00:00.000Z`)))
    errors.push('pickupDate: must be a valid ISO date');
  else if (b.pickupDate < new Date().toISOString().slice(0, 10))
    errors.push('pickupDate: cannot be in the past');
  if (!b.pickupTimeSlot || typeof b.pickupTimeSlot !== 'string' || !ALLOWED_PICKUP_SLOTS.has(b.pickupTimeSlot))
    errors.push('pickupTimeSlot: must be an available pickup slot');
  if (!b.modelId && !b.modelLegacyId)
    errors.push('modelId: required');
  if (!ALLOWED_STORAGE_GB.has(Number(b.storageGb)))
    errors.push('storageGb: must be a supported capacity');
  if (!b.payoutMethod || typeof b.payoutMethod !== 'string' || !ALLOWED_PAYOUT_METHODS.has(b.payoutMethod))
    errors.push('payoutMethod: must be a supported method');
  const payoutDetails = b.payoutDetails;
  if ((b.payoutMethod === 'upi' || b.payoutMethod === 'bank') && (!payoutDetails || typeof payoutDetails !== 'object' || Array.isArray(payoutDetails))) {
    errors.push('payoutDetails: required for the selected payout method');
  } else if (payoutDetails && typeof payoutDetails === 'object' && !Array.isArray(payoutDetails)) {
    const details = payoutDetails as Record<string, unknown>;
    if (b.payoutMethod === 'upi' && (typeof details.upiId !== 'string' || !UPI_RE.test(details.upiId.trim())))
      errors.push('payoutDetails.upiId: must be a valid UPI ID');
    if (b.payoutMethod === 'bank') {
      if (typeof details.accountHolderName !== 'string' || details.accountHolderName.trim().length < 2 || details.accountHolderName.trim().length > 100)
        errors.push('payoutDetails.accountHolderName: must be between 2 and 100 characters');
      if (typeof details.accountNumber !== 'string' || !BANK_ACCOUNT_RE.test(details.accountNumber.trim()))
        errors.push('payoutDetails.accountNumber: must contain 9 to 18 digits');
      if (typeof details.ifscCode !== 'string' || !IFSC_RE.test(details.ifscCode.trim().toUpperCase()))
        errors.push('payoutDetails.ifscCode: must be a valid IFSC code');
    }
  }
  if (!Array.isArray(b.defectIds) || !b.defectIds.every(id => typeof id === 'string'))
    errors.push('defectIds: must be an array of defect identifiers');
  return errors;
}

export function payoutBonusFor(method: string, estimatedPrice: number): { percentage: number; amount: number } {
  const percentage = method === 'amazon' || method === 'flipkart' || method === 'voucher' ? 0.03 : 0;
  return { percentage, amount: Math.round(estimatedPrice * percentage) };
}
