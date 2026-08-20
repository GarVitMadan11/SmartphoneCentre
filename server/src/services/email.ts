/**
 * Email Service -- Rephonix
 * Nodemailer transporter + typed helper methods for transactional emails.
 */

import nodemailer from 'nodemailer';

function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.hostinger.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE !== 'false';
  return nodemailer.createTransport({
    host, port, secure,
    auth: {
      user: process.env.SMTP_USER || 'support@rephonix.in',
      pass: process.env.SMTP_PASS || '',
    },
    tls: { rejectUnauthorized: process.env.NODE_ENV === 'production' },
  });
}

const transporter = createTransporter();
const FROM_ADDRESS = process.env.EMAIL_FROM || 'Rephonix <support@rephonix.in>';
const FRONTEND_URL = (process.env.FRONTEND_URL || 'https://www.rephonix.in').replace(/\/$/, '');

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}

function buildEmailHtml(title: string, bodyHtml: string): string {
  const year = new Date().getFullYear();
  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>' + title + '</title>'
    + '<style>*{box-sizing:border-box;margin:0;padding:0}body{background:#f0f2f5;font-family:Arial,sans-serif;color:#1a2035}.wrapper{max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden}.header{background:linear-gradient(135deg,#1a2035,#1e3a6e);padding:32px 40px;text-align:center}.header h1{color:#fff;font-size:22px;font-weight:700}.header p{color:rgba(255,255,255,.65);font-size:13px;margin-top:4px}.body{padding:36px 40px}.greeting{font-size:16px;font-weight:600;color:#1a2035;margin-bottom:12px}.text{font-size:14px;line-height:1.7;color:#4a5568;margin-bottom:16px}.btn-wrap{text-align:center;margin:28px 0}.btn{display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#1e3a6e,#2563eb);color:#fff!important;text-decoration:none;border-radius:8px;font-size:15px;font-weight:700}.token-box{background:#f0f4ff;border:1px solid #c7d7fa;border-radius:8px;padding:16px 20px;font-family:monospace;font-size:13px;word-break:break-all;color:#1e3a6e;margin:16px 0}.divider{border:none;border-top:1px solid #edf2f7;margin:24px 0}.note{font-size:12px;color:#718096;line-height:1.6}.footer{background:#f7fafc;padding:20px 40px;text-align:center;border-top:1px solid #edf2f7}.footer p{font-size:12px;color:#a0aec0}.footer a{color:#2563eb;text-decoration:none}</style>'
    + '</head><body><div class="wrapper"><div class="header"><h1>Rephonix</h1><p>India\'s Trusted Device Trade-In Platform</p></div>'
    + '<div class="body">' + bodyHtml + '</div>'
    + '<div class="footer"><p>&copy; ' + year + ' Rephonix. All rights reserved.<br/>'
    + '<a href="' + FRONTEND_URL + '">www.rephonix.in</a> &middot; <a href="mailto:support@rephonix.in">support@rephonix.in</a></p>'
    + '<p style="margin-top:8px;">This is an automated message. Please do not reply.</p></div>'
    + '</div></body></html>';
}

export async function verifySmtpConnection(): Promise<void> {
  await transporter.verify();
  console.log('SMTP connection verified');
}

export async function sendVerificationEmail(to: string, name: string, rawToken: string): Promise<void> {
  const link = FRONTEND_URL + '/verify-email?token=' + encodeURIComponent(rawToken);
  const safeLink = link.replace(/$('&')/g, '&amp;');
  const body = '<p class="greeting">Hi ' + escapeHtml(name) + ',</p>'
    + '<p class="text">Thank you for creating a Rephonix account! Please verify your email address to unlock full access.</p>'
    + '<div class="btn-wrap"><a href="' + safeLink + '" class="btn">Verify Email Address</a></div>'
    + '<p class="text">Or copy this link:</p>'
    + '<div class="token-box">' + link + '</div>'
    + '<hr class="divider" />'
    + '<p class="note">Expires in <strong>24 hours</strong>. If you did not create this account, ignore this email.</p>';
  const html = buildEmailHtml('Verify your Rephonix email address', body);
  const text = 'Hi ' + name + ',\n\nVerify your email:\n' + link + '\n\nExpires in 24 hours.\n\n-- The Rephonix Team';
  await transporter.sendMail({ from: FROM_ADDRESS, to, subject: 'Verify your Rephonix email address', html, text });
}

export async function sendPasswordResetEmail(to: string, name: string, rawToken: string): Promise<void> {
  const link = FRONTEND_URL + '/reset-password?token=' + encodeURIComponent(rawToken);
  const safeLink = link.replace(/$('&')/g, '&amp;');
  const body = '<p class="greeting">Hi ' + escapeHtml(name) + ',</p>'
    + '<p class="text">We received a request to reset the password for your Rephonix account.</p>'
    + '<div class="btn-wrap"><a href="' + safeLink + '" class="btn">Reset My Password</a></div>'
    + '<p class="text">Or copy this link:</p>'
    + '<div class="token-box">' + link + '</div>'
    + '<hr class="divider" />'
    + '<p class="note">Expires in <strong>1 hour</strong>. If you did not request this, ignore this email -- your password remains unchanged.</p>';
  const html = buildEmailHtml('Reset your Rephonix password', body);
  const text = 'Hi ' + name + ',\n\nReset your password:\n' + link + '\n\nExpires in 1 hour.\n\n-- The Rephonix Team';
  await transporter.sendMail({ from: FROM_ADDRESS, to, subject: 'Reset your Rephonix password', html, text });
}

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const body = '<p class="greeting">Welcome aboard, ' + escapeHtml(name) + '!</p>'
    + '<p class="text">Your Rephonix account is ready. Get instant trade-in quotes, free doorstep pickup, and fast payouts.</p>'
    + '<div class="btn-wrap"><a href="' + FRONTEND_URL + '" class="btn">Get Your Trade-In Quote</a></div>'
    + '<hr class="divider" />'
    + '<p class="note">Questions? <a href="mailto:support@rephonix.in">support@rephonix.in</a></p>';
  const html = buildEmailHtml('Welcome to Rephonix!', body);
  const text = 'Welcome to Rephonix, ' + name + '!\n\nVisit ' + FRONTEND_URL + ' to get started.\n\n-- The Rephonix Team';
  await transporter.sendMail({ from: FROM_ADDRESS, to, subject: 'Welcome to Rephonix!', html, text });
}

export async function sendSecurityEmail(to: string, name: string, action: string): Promise<void> {
  const msgs: Record<string, { title: string; desc: string }> = {
    password_reset: { title: 'Your password was changed', desc: 'Your Rephonix account password was successfully changed.' },
    google_linked: { title: 'Google account linked', desc: 'A Google account was linked to your Rephonix account.' },
    google_unlinked: { title: 'Google account unlinked', desc: 'A Google account was unlinked from your Rephonix account.' },
  };
  const msg = msgs[action] ?? { title: 'Security notification', desc: 'An important change was made to your account.' };
  const body = '<p class="greeting">Hi ' + escapeHtml(name) + ',</p>'
    + '<p class="text">' + msg.desc + '</p>'
    + '<p class="text">If you did <strong>not</strong> make this change, contact us at <a href="mailto:support@rephonix.in">support@rephonix.in</a>.</p>';
  const html = buildEmailHtml('Security Alert: ' + msg.title, body);
  const text = 'Hi ' + name + ',\n\n' + msg.desc + '\n\nIf you did not do this, contact us at support@rephonix.in\n\n-- The Rephonix Team';
  await transporter.sendMail({ from: FROM_ADDRESS, to, subject: 'Security Alert: ' + msg.title, html, text });
}

export async function sendOtpEmail(to: string, name: string, otp: string): Promise<void> {
  const body = '<p class="greeting">Hi ' + escapeHtml(name) + ',</p>'
    + '<p class="text">Here is your verification code to complete your security check and proceed:</p>'
    + '<div class="btn-wrap"><span class="btn" style="font-size: 24px; letter-spacing: 4px; padding: 12px 24px; color: #fff;">' + escapeHtml(otp) + '</span></div>'
    + '<p class="text">This code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>'
    + '<hr class="divider" />'
    + '<p class="note">If you did not request this code, you can safely ignore this email.</p>';
  const html = buildEmailHtml('Your Rephonix Verification Code', body);
  const text = 'Hi ' + name + ',\n\nYour verification code is: ' + otp + '\n\nValid for 10 minutes.\n\n-- The Rephonix Team';
  await transporter.sendMail({ from: FROM_ADDRESS, to, subject: 'Your Rephonix Verification Code', html, text });
}
