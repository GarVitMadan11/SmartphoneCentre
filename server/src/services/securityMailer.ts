import nodemailer from 'nodemailer';

export interface SecurityEventData {
  type: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOCKDOWN_TRIGGERED' | 'SYSTEM_UNLOCKED';
  username?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  details?: string;
  masterUnlockKey?: string;
}

function getTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendAdminSecurityAlertEmail(event: SecurityEventData): Promise<boolean> {
  const transporter = getTransporter();
  const alertRecipient = process.env.ADMIN_ALERT_EMAIL || 'garvitmadan511@gmail.com';

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
