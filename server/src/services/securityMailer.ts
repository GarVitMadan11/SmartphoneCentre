import nodemailer from 'nodemailer';

export interface SecurityEventData {
  type: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOCKDOWN_TRIGGERED' | 'SYSTEM_UNLOCKED' | 'PASSWORD_RESET';
  username?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  details?: string;
  masterUnlockKey?: string;
}

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getEnvValue(key: string): string {
  const envVal = process.env[key];
  if (envVal && envVal.trim()) {
    return envVal.trim().replace(/^["']|["']$/g, '').trim();
  }
  try {
    const candidates = [
      path.resolve(__dirname, '../../.env'),
      path.resolve(process.cwd(), 'server/.env'),
      path.resolve(process.cwd(), '.env'),
    ];
    for (const cand of candidates) {
      if (fs.existsSync(cand)) {
        const text = fs.readFileSync(cand, 'utf8');
        const re = new RegExp(`^\\s*${key}\\s*=\\s*(.*)$`, 'm');
        const m = text.match(re);
        if (m && m[1]) {
          const val = m[1].trim().replace(/^["']|["']$/g, '').trim();
          if (val) return val;
        }
      }
    }
  } catch {}
  return '';
}

function getTransporter() {
  const host = getEnvValue('SECURITY_SMTP_HOST') || getEnvValue('SMTP_HOST') || 'smtp.hostinger.com';
  const port = parseInt(getEnvValue('SECURITY_SMTP_PORT') || getEnvValue('SMTP_PORT') || '465', 10);
  const user = getEnvValue('SECURITY_SMTP_USER') || getEnvValue('SECURITY_EMAIL_USER') || getEnvValue('SMTP_USER') || getEnvValue('EMAIL_USER') || 'support@rephonix.in';
  const pass = getEnvValue('SECURITY_SMTP_PASS') || getEnvValue('SECURITY_EMAIL_PASS') || getEnvValue('SMTP_PASS') || getEnvValue('EMAIL_PASS') || getEnvValue('MAIL_PASS') || getEnvValue('EMAIL_PASSWORD');

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465 || getEnvValue('SMTP_SECURE') === 'true',
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });
}

export async function sendAdminSecurityAlertEmail(event: SecurityEventData): Promise<boolean> {
  const alertRecipient = process.env.ADMIN_ALERT_EMAIL || 'garvitmadan511@gmail.com';
  const transporter = getTransporter();
  let subject = '';
  let badgeColor = '#3b82f6';
  let badgeText = '';

  switch (event.type) {
    case 'LOGIN_SUCCESS':
      subject = `[SECURITY ALERT] Admin Panel Login: ${event.username || 'Admin'}`;
      badgeColor = '#10b981';
      badgeText = '🟢 ADMIN LOGIN SUCCESS';
      break;
    case 'LOGIN_FAILED':
      subject = `[SECURITY WARNING] Failed Admin Login Attempt from ${event.ipAddress}`;
      badgeColor = '#f59e0b';
      badgeText = '⚠️ FAILED LOGIN ATTEMPT';
      break;
    case 'LOCKDOWN_TRIGGERED':
      subject = `🚨 [EMERGENCY LOCKDOWN] Admin Panel Has Been Suspended!`;
      badgeColor = '#ef4444';
      badgeText = '🚨 EMERGENCY LOCKDOWN ACTIVE';
      break;
    case 'SYSTEM_UNLOCKED':
      subject = `[SECURITY NOTICE] Admin Panel Unlocked`;
      badgeColor = '#3b82f6';
      badgeText = '🔓 SYSTEM UNLOCKED';
      break;
    case 'PASSWORD_RESET':
      subject = `🔐 [SECURITY ALERT] Admin Password Changed for ${event.username || 'Admin'}`;
      badgeColor = '#8b5cf6';
      badgeText = '🔐 PASSWORD CHANGED';
      break;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 580px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; border: 1px solid #334155; overflow: hidden; }
        .header { background-color: #0f172a; padding: 24px; text-align: center; border-bottom: 1px solid #334155; }
        .badge { display: inline-block; padding: 6px 14px; background-color: ${badgeColor}; color: #ffffff; font-weight: bold; font-size: 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px; }
        .content { padding: 28px; }
        .field-group { margin-bottom: 16px; background-color: #0f172a; padding: 12px 16px; border-radius: 8px; border: 1px solid #1e293b; }
        .field-label { font-size: 11px; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .field-value { font-size: 14px; font-weight: 600; color: #f1f5f9; font-family: monospace; word-break: break-all; }
        .footer { padding: 18px; background-color: #0f172a; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b; }
        .unlock-box { margin-top: 20px; padding: 16px; background-color: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 8px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <span class="badge">${badgeText}</span>
          <h2 style="margin: 16px 0 0 0; font-size: 20px; color: #ffffff;">Rephonix Control Center Security Alert</h2>
        </div>
        <div class="content">
          <p style="font-size: 14px; color: #cbd5e1; margin-top: 0;">An administrative security event was recorded on your platform:</p>
          
          <div class="field-group">
            <div class="field-label">Timestamp</div>
            <div class="field-value">${event.timestamp}</div>
          </div>

          <div class="field-group">
            <div class="field-label">IP Address</div>
            <div class="field-value">${event.ipAddress}</div>
          </div>

          ${event.username ? `
          <div class="field-group">
            <div class="field-label">Account / Identity</div>
            <div class="field-value">${event.username}</div>
          </div>
          ` : ''}

          <div class="field-group">
            <div class="field-label">Device & Browser (User-Agent)</div>
            <div class="field-value">${event.userAgent}</div>
          </div>

          ${event.details ? `
          <div class="field-group">
            <div class="field-label">Additional Context</div>
            <div class="field-value">${event.details}</div>
          </div>
          ` : ''}

          ${event.masterUnlockKey ? `
          <div class="unlock-box">
            <div style="font-size: 12px; font-weight: bold; color: #fca5a5; text-transform: uppercase;">Master Emergency Unlock Key</div>
            <div style="font-size: 18px; font-weight: 900; color: #ffffff; font-family: monospace; letter-spacing: 2px; margin-top: 6px;">${event.masterUnlockKey}</div>
            <p style="font-size: 11px; color: #f87171; margin: 8px 0 0 0;">Use this Master Key on the Admin Shield interface to unblock access.</p>
          </div>
          ` : ''}
        </div>
        <div class="footer">
          Rephonix Automated Security Telemetry &bull; Confidential
        </div>
      </div>
    </body>
    </html>
  `;

  if (!transporter) {
    console.warn(`\n[SECURITY ALERT DISPATCHED (LOG FALLBACK)]`);
    console.warn(`Subject: ${subject}`);
    console.warn(`Recipient: ${alertRecipient}`);
    console.warn(`IP: ${event.ipAddress} | User: ${event.username || 'N/A'}`);
    if (event.masterUnlockKey) console.warn(`Master Unlock Key: ${event.masterUnlockKey}`);
    console.warn(`Note: Configure SMTP_USER and SMTP_PASS in .env to deliver real emails.\n`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: `"Rephonix Security Shield" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
      to: alertRecipient,
      subject,
      html: htmlContent,
    });
    console.log(`[Security Alert Email] Dispatched to ${alertRecipient} for event ${event.type}`);
    return true;
  } catch (error) {
    console.error(`[Security Alert Email Error] Failed to send email:`, error);
    return false;
  }
}
