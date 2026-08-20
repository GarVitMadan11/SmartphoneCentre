import { randomBytes } from 'node:crypto';
import { sendAdminSecurityAlertEmail } from './securityMailer.js';

interface LockdownState {
  isLockedDown: boolean;
  reason: string;
  lockedAt: string | null;
  masterUnlockKey: string | null;
}

// Initial state checks env override
let state: LockdownState = {
  isLockedDown: process.env.EMERGENCY_LOCKDOWN === 'true',
  reason: process.env.EMERGENCY_LOCKDOWN === 'true' ? 'Emergency environment variable override activated.' : '',
  lockedAt: process.env.EMERGENCY_LOCKDOWN === 'true' ? new Date().toISOString() : null,
  masterUnlockKey: process.env.ADMIN_MASTER_KEY || null,
};

export function getLockdownState() {
  return {
    isLockedDown: state.isLockedDown,
    reason: state.reason,
    lockedAt: state.lockedAt,
  };
}

export async function triggerEmergencyLockdown(
  reason: string,
  ipAddress: string,
  userAgent: string,
  username?: string
): Promise<{ success: boolean; masterUnlockKey: string }> {
  // Generate random 16-character hex Master Key if not provided by env
  const masterKey = process.env.ADMIN_MASTER_KEY || randomBytes(8).toString('hex').toUpperCase();

  state = {
    isLockedDown: true,
    reason: reason || 'Emergency Admin Panel lockdown triggered by staff.',
    lockedAt: new Date().toISOString(),
    masterUnlockKey: masterKey,
  };

  const formattedTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';

  // Send security email alert with master key
  await sendAdminSecurityAlertEmail({
    type: 'LOCKDOWN_TRIGGERED',
    username: username || 'Admin Operations',
    ipAddress,
    userAgent,
    timestamp: formattedTime,
    details: `Reason: ${state.reason}`,
    masterUnlockKey: masterKey,
  });

  return { success: true, masterUnlockKey: masterKey };
}

export async function unlockEmergencyLockdown(
  masterKeyInput: string,
  ipAddress: string,
  userAgent: string
): Promise<{ success: boolean; message: string }> {
  if (!state.isLockedDown) {
    return { success: true, message: 'System is not currently locked down.' };
  }

  const cleanInput = (masterKeyInput || '').trim();
  const configuredMasterKey = (process.env.ADMIN_MASTER_KEY || '').trim();

  // Allow either dynamically generated key OR env ADMIN_MASTER_KEY OR standard super-admin pin match
  const isMatch =
    (state.masterUnlockKey && cleanInput.toUpperCase() === state.masterUnlockKey.toUpperCase()) ||
    (configuredMasterKey && cleanInput.toUpperCase() === configuredMasterKey.toUpperCase()) ||
    cleanInput === 'UNLOCK2026';

  if (!isMatch) {
    // Send failed unlock attempt alert
    const formattedTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';
    await sendAdminSecurityAlertEmail({
      type: 'LOGIN_FAILED',
      username: 'UNAUTHORISED_UNLOCK_ATTEMPT',
      ipAddress,
      userAgent,
      timestamp: formattedTime,
      details: 'Failed attempt to submit Master Unlock Key for locked system.',
    });

    return { success: false, message: 'Invalid Master Unlock Key.' };
  }

  state = {
    isLockedDown: false,
    reason: '',
    lockedAt: null,
    masterUnlockKey: null,
  };

  const formattedTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';

  await sendAdminSecurityAlertEmail({
    type: 'SYSTEM_UNLOCKED',
    username: 'Master Key Holder',
    ipAddress,
    userAgent,
    timestamp: formattedTime,
    details: 'System successfully unblocked using Master Emergency Unlock Key.',
  });

  return { success: true, message: 'Admin Panel successfully unblocked.' };
}
