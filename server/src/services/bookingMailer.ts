import nodemailer from 'nodemailer';
import { generateBookingQuotationPDF, PDFBookingData } from './pdfGenerator.js';

export function escapeHtml(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
  const host = getEnvValue('SMTP_HOST') || 'smtp.hostinger.com';
  const port = parseInt(getEnvValue('SMTP_PORT') || '465', 10);
  const user = getEnvValue('SMTP_USER') || getEnvValue('SECURITY_SMTP_USER') || getEnvValue('EMAIL_USER') || getEnvValue('MAIL_USER') || 'support@rephonix.in';
  const pass = getEnvValue('SMTP_PASS') || getEnvValue('SECURITY_SMTP_PASS') || getEnvValue('EMAIL_PASS') || getEnvValue('MAIL_PASS') || getEnvValue('EMAIL_PASSWORD');

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

function getFromAddress(): string {
  const user = getEnvValue('SMTP_USER') || getEnvValue('SECURITY_SMTP_USER') || getEnvValue('EMAIL_USER') || 'support@rephonix.in';
  const rawFrom = getEnvValue('EMAIL_FROM');
  if (rawFrom) {
    if (rawFrom.includes('<') && rawFrom.includes('>')) {
      return rawFrom;
    }
    return `"Rephonix" <${rawFrom}>`;
  }
  return `"Rephonix" <${user}>`;
}

export async function sendAdminBookingNotificationEmail(booking: PDFBookingData, pdfBuffer: Buffer | null, baseUrl: string = 'http://localhost:4000'): Promise<boolean> {
  const adminRecipient = process.env.ADMIN_ALERT_EMAIL || 'garvitmadan511@gmail.com';
  const pdfDownloadUrl = `${baseUrl}/api/bookings/${encodeURIComponent(booking.id)}/pdf`;

  // Direct Nodemailer SMTP
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[Booking Mailer] SMTP credentials not set. Admin alert ready for ${adminRecipient}. Booking #${booking.id}`);
    return true;
  }

  const defectListHtml = booking.defectDescriptions && booking.defectDescriptions.length > 0
    ? booking.defectDescriptions.map(d => escapeHtml(d)).join(', ')
    : 'Perfect / No reported defects';

  const cleanPhone = String(booking.customerPhone || '').replace(/[^\d+]/g, '');

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #0f172a; border: 1px solid #334155; border-radius: 12px; overflow: hidden; color: #f8fafc;">
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 24px; text-align: center; border-bottom: 1px solid #334155;">
        <span style="display: inline-block; padding: 4px 14px; background-color: #10b981; color: #ffffff; font-weight: bold; font-size: 11px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">🔔 NEW BOOKING CONFIRMED</span>
        <h1 style="color: #ffffff; margin: 4px 0 0 0; font-size: 22px; font-weight: bold;">Rephonix Admin Booking Alert</h1>
        <p style="color: #93c5fd; margin: 4px 0 0 0; font-size: 13px;">Booking ID: #${escapeHtml(booking.id)}</p>
      </div>

      <div style="padding: 24px; background-color: #1e293b;">
        <p style="font-size: 14px; color: #cbd5e1; margin-top: 0;">A new device trade-in pickup booking has been successfully confirmed. Full details are below:</p>

        <!-- CUSTOMER DETAILS -->
        <div style="margin-bottom: 20px; background-color: #0f172a; padding: 16px; border-radius: 8px; border: 1px solid #334155;">
          <h3 style="margin: 0 0 12px 0; font-size: 13px; font-weight: bold; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px;">👤 Customer & Contact Details</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #e2e8f0;">
            <tr>
              <td style="padding: 6px 0; color: #94a3b8; width: 140px;">Customer Name:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #f8fafc;">${escapeHtml(booking.customerName)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Phone Number:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #38bdf8;"><a href="tel:${encodeURIComponent(cleanPhone)}" style="color: #38bdf8; text-decoration: none;">+91 ${escapeHtml(cleanPhone)}</a></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Email Address:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #f8fafc;"><a href="mailto:${encodeURIComponent(booking.customerEmail)}" style="color: #f8fafc; text-decoration: underline;">${escapeHtml(booking.customerEmail)}</a></td>
            </tr>
          </table>
        </div>

        <!-- PICKUP SCHEDULE & ADDRESS -->
        <div style="margin-bottom: 20px; background-color: #0f172a; padding: 16px; border-radius: 8px; border: 1px solid #334155;">
          <h3 style="margin: 0 0 12px 0; font-size: 13px; font-weight: bold; color: #fbbf24; text-transform: uppercase; letter-spacing: 0.5px;">📅 Scheduled Pickup & Address</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #e2e8f0;">
            <tr>
              <td style="padding: 6px 0; color: #94a3b8; width: 140px;">Scheduled Date:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #fbbf24;">${escapeHtml(booking.pickupDate)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Time Window:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #f8fafc;">${escapeHtml(booking.pickupTimeSlot)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8; vertical-align: top;">Pickup Address:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #f8fafc; line-height: 1.4;">${escapeHtml(booking.address)}</td>
            </tr>
          </table>
        </div>

        <!-- DEVICE & PAYOUT DETAILS -->
        <div style="margin-bottom: 20px; background-color: #0f172a; padding: 16px; border-radius: 8px; border: 1px solid #334155;">
          <h3 style="margin: 0 0 12px 0; font-size: 13px; font-weight: bold; color: #4ade80; text-transform: uppercase; letter-spacing: 0.5px;">📱 Device & Valuation Details</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #e2e8f0;">
            <tr>
              <td style="padding: 6px 0; color: #94a3b8; width: 140px;">Device Model:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #f8fafc;">${escapeHtml(booking.modelName)} (${Number(booking.storageGb)}GB)</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8; vertical-align: top;">Reported Condition:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #cbd5e1; line-height: 1.4;">${defectListHtml}</td>
            </tr>
            <tr style="border-top: 1px solid #334155;">
              <td style="padding: 10px 0 4px 0; font-weight: bold; color: #94a3b8; font-size: 14px;">Agreed Payout:</td>
              <td style="padding: 10px 0 4px 0; font-weight: bold; color: #4ade80; font-size: 20px;">₹${Number(booking.finalPrice).toLocaleString('en-IN')}</td>
            </tr>
          </table>
        </div>

        <!-- ACTION BUTTON -->
        <div style="text-align: center; margin: 24px 0 8px 0;">
          <a href="${escapeHtml(pdfDownloadUrl)}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">📄 Download PDF Quotation</a>
        </div>
      </div>

      <div style="background-color: #0f172a; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #334155;">
        <p style="margin: 0;">Rephonix Admin System Alert &bull; Confidential Internal Notification</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: getFromAddress(),
      to: adminRecipient,
      subject: `🔔 [NEW BOOKING CONFIRMED] #${booking.id} - ${booking.customerName} (${booking.modelName})`,
      html: htmlBody,
      attachments: pdfBuffer ? [
        {
          filename: `Quotation-${booking.id}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        }
      ] : [],
    });

    console.log(`[Booking Mailer] Successfully sent SMTP admin notification email to ${adminRecipient} for booking #${booking.id}!`);
    return true;
  } catch (err) {
    console.error('[Booking Mailer] Failed to send admin alert email via Nodemailer:', err);
    return false;
  }
}

export async function sendBookingConfirmationEmail(booking: PDFBookingData, baseUrl: string = 'http://localhost:4000'): Promise<boolean> {
  const recipientEmail = booking.customerEmail;
  const pdfDownloadUrl = `${baseUrl}/api/bookings/${booking.id}/pdf`;

  // 1. Generate PDF document buffer
  let pdfBuffer: Buffer | null = null;
  try {
    pdfBuffer = await generateBookingQuotationPDF(booking);
  } catch (err) {
    console.error('[Booking Mailer] Failed to generate PDF buffer:', err);
  }

  // Dispatch Admin Notification Email
  try {
    await sendAdminBookingNotificationEmail(booking, pdfBuffer, baseUrl);
  } catch (err) {
    console.error('[Booking Mailer] Error sending admin notification email:', err);
  }

  // Direct Nodemailer SMTP for Customer
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[Booking Mailer] SMTP credentials not set. Booking quotation email ready via API for ${recipientEmail}. Link: ${pdfDownloadUrl}`);
    return true;
  }

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #1e3a8a; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">Rephonix</h1>
        <p style="color: #93c5fd; margin: 6px 0 0 0; font-size: 13px; text-transform: uppercase; tracking-spacing: 1px;">Trade-In Booking Quotation Receipt</p>
      </div>

      <div style="padding: 24px;">
        <p style="font-size: 15px; color: #1e293b; margin-top: 0;">Dear <strong>${escapeHtml(booking.customerName)}</strong>,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.5;">Your trade-in booking has been successfully confirmed! Below are your locked quotation details and doorstep pickup schedule.</p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 18px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Booking ID:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #1e3a8a; text-align: right;">#${escapeHtml(booking.id)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Device Model:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #0f172a; text-align: right;">${escapeHtml(booking.modelName)} (${Number(booking.storageGb)}GB)</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Pickup Address:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #0f172a; text-align: right;">${escapeHtml(booking.address)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Scheduled Date:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #0f172a; text-align: right;">${escapeHtml(booking.pickupDate)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Time Window:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #0f172a; text-align: right;">${escapeHtml(booking.pickupTimeSlot)}</td>
            </tr>
            <tr style="border-top: 1px solid #cbd5e1;">
              <td style="padding: 10px 0 4px 0; font-weight: bold; color: #0f172a; font-size: 14px;">Instant Doorside Payout:</td>
              <td style="padding: 10px 0 4px 0; font-weight: bold; color: #1e3a8a; font-size: 18px; text-align: right;">₹${Number(booking.finalPrice).toLocaleString('en-IN')}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 14px; margin-bottom: 24px; text-align: center;">
          <p style="margin: 0; font-size: 13px; color: #065f46; font-weight: bold;">⚡ Instant Doorside Payout (UPI / Bank Transfer)</p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #047857;">Our agent will call you prior to arrival. Payout is transferred instantly at your doorstep after device check.</p>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${escapeHtml(pdfDownloadUrl)}" style="background-color: #1e3a8a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">📄 Download Official PDF Quotation</a>
        </div>
      </div>

      <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0;">Rephonix — Secure Smartphone Trade-In Network</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: getFromAddress(),
      to: recipientEmail,
      subject: `[Trade-In Confirmed] Quotation Receipt #${booking.id} - ${booking.modelName}`,
      html: htmlBody,
      attachments: pdfBuffer ? [
        {
          filename: `Quotation-${booking.id}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        }
      ] : [],
    });

    console.log(`[Booking Mailer] Successfully sent SMTP email with PDF attachment to ${recipientEmail}!`);
    return true;
  } catch (err) {
    console.error('[Booking Mailer] Failed to send email via Nodemailer:', err);
    return false;
  }
}

export interface QuoteAlertData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  modelName: string;
  storageGb: number;
  estimatedPayout: number;
  retentionPercentage: number;
  defects: string[];
  refCode?: string;
}

export async function sendAdminQuoteAlertEmail(data: QuoteAlertData): Promise<boolean> {
  const adminRecipient = process.env.ADMIN_ALERT_EMAIL || 'garvitmadan511@gmail.com';
  const formattedPayout = `₹${data.estimatedPayout.toLocaleString('en-IN')}`;
  const defectText = data.defects && data.defects.length > 0
    ? data.defects.map(d => escapeHtml(d)).join(', ')
    : 'All hardware & screen diagnostics passed (Mint Condition / No Defects)';

  const cleanPhone = String(data.customerPhone || '').replace(/[^\d+]/g, '');

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #0f172a; border: 1px solid #334155; border-radius: 12px; overflow: hidden; color: #f8fafc;">
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 24px; text-align: center; border-bottom: 1px solid #334155;">
        <span style="display: inline-block; padding: 4px 14px; background-color: #3b82f6; color: #ffffff; font-weight: bold; font-size: 11px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">📊 DIAGNOSTIC QUOTE GENERATED</span>
        <h1 style="color: #ffffff; margin: 4px 0 0 0; font-size: 22px; font-weight: bold;">Rephonix Trade-In Quote Alert</h1>
        <p style="color: #93c5fd; margin: 4px 0 0 0; font-size: 13px;">Reference Code: ${escapeHtml(data.refCode || 'SCH-QUOTE')}</p>
      </div>

      <div style="padding: 24px; background-color: #1e293b;">
        <p style="font-size: 14px; color: #cbd5e1; margin-top: 0;">A logged-in user completed diagnostic evaluation and generated a trade-in quote:</p>

        <!-- CUSTOMER DETAILS -->
        <div style="margin-bottom: 20px; background-color: #0f172a; padding: 16px; border-radius: 8px; border: 1px solid #334155;">
          <h3 style="margin: 0 0 12px 0; font-size: 13px; font-weight: bold; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px;">👤 Logged-In Customer Details</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #e2e8f0;">
            <tr>
              <td style="padding: 6px 0; color: #94a3b8; width: 140px;">Customer Name:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #f8fafc;">${escapeHtml(data.customerName)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Phone Number:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #38bdf8;"><a href="tel:${encodeURIComponent(cleanPhone)}" style="color: #38bdf8; text-decoration: none;">+91 ${escapeHtml(cleanPhone)}</a></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Email Address:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #f8fafc;"><a href="mailto:${encodeURIComponent(data.customerEmail)}" style="color: #f8fafc; text-decoration: underline;">${escapeHtml(data.customerEmail)}</a></td>
            </tr>
          </table>
        </div>

        <!-- TARGET DEVICE & ESTIMATED PAYOUT -->
        <div style="margin-bottom: 20px; background-color: #0f172a; padding: 16px; border-radius: 8px; border: 1px solid #334155;">
          <h3 style="margin: 0 0 12px 0; font-size: 13px; font-weight: bold; color: #4ade80; text-transform: uppercase; letter-spacing: 0.5px;">📱 Target Device & Valuation</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #e2e8f0;">
            <tr>
              <td style="padding: 6px 0; color: #94a3b8; width: 140px;">Target Device:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #f8fafc;">${escapeHtml(data.modelName)} (${Number(data.storageGb) >= 1024 ? '1TB' : Number(data.storageGb) + 'GB'})</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Value Retained:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #fbbf24;">${Number(data.retentionPercentage)}% Value Retained</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8; vertical-align: top;">Diagnostic Audit:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #cbd5e1; line-height: 1.4;">${defectText}</td>
            </tr>
            <tr style="border-top: 1px solid #334155;">
              <td style="padding: 10px 0 4px 0; font-weight: bold; color: #94a3b8; font-size: 14px;">Estimated Payout:</td>
              <td style="padding: 10px 0 4px 0; font-weight: bold; color: #4ade80; font-size: 22px;">${escapeHtml(formattedPayout)}</td>
            </tr>
          </table>
        </div>
      </div>

      <div style="background-color: #0f172a; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #334155;">
        <p style="margin: 0;">Rephonix Diagnostic Engine Alert &bull; Confidential Customer Lead Notification</p>
      </div>
    </div>
  `;

  // Direct Nodemailer SMTP
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[Quote Mailer] SMTP credentials not set. Quote alert ready for ${adminRecipient}: ${data.modelName} by ${data.customerName} (${formattedPayout})`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: getFromAddress(),
      to: adminRecipient,
      subject: `📊 [QUOTE GENERATED] ${data.modelName} (${data.storageGb >= 1024 ? '1TB' : data.storageGb + 'GB'}) - ${data.customerName} (${formattedPayout})`,
      html: htmlBody,
    });

    console.log(`[Quote Mailer] Successfully sent SMTP quote alert email to ${adminRecipient} for ${data.customerName}!`);
    return true;
  } catch (err) {
    console.error('[Quote Mailer] Failed to send quote alert email via Nodemailer:', err);
    return false;
  }
}

export interface PriceMatchAlertData {
  customerPhone: string;
  customerEmail?: string;
  customerName?: string;
  modelName: string;
  storageGb: number;
  currentQuote: number;
  expectedPrice: number | string;
  comments?: string;
  refCode?: string;
}

export async function sendAdminPriceMatchAlertEmail(data: PriceMatchAlertData): Promise<boolean> {
  const adminRecipient = process.env.ADMIN_ALERT_EMAIL || 'garvitmadan511@gmail.com';
  const cleanPhone = String(data.customerPhone).replace(/\D/g, '');
  const phoneFormatted = cleanPhone.length === 10 ? cleanPhone : data.customerPhone;
  const waUrl = `https://wa.me/91${phoneFormatted}`;
  const callUrl = `tel:${data.customerPhone}`;
  const formattedCurrent = typeof data.currentQuote === 'number' ? `₹${data.currentQuote.toLocaleString('en-IN')}` : `₹${data.currentQuote}`;
  const formattedExpected = typeof data.expectedPrice === 'number'
    ? `₹${data.expectedPrice.toLocaleString('en-IN')}`
    : (String(data.expectedPrice).startsWith('₹') ? String(data.expectedPrice) : `₹${data.expectedPrice}`);

  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[Price Match Mailer] SMTP credentials not set. Price Match alert ready for ${adminRecipient}: Phone ${data.customerPhone}, Expected ${formattedExpected}`);
    return true;
  }

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #0f172a; border: 1px solid #d97706; border-radius: 12px; overflow: hidden; color: #f8fafc;">
      <div style="background: linear-gradient(135deg, #78350f 0%, #b45309 50%, #1e3a8a 100%); padding: 24px; text-align: center; border-bottom: 1px solid #d97706;">
        <span style="display: inline-block; padding: 4px 14px; background-color: #f59e0b; color: #000000; font-weight: bold; font-size: 11px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">🏷️ PRICE MATCH / CUSTOM QUOTE REQUEST</span>
        <h1 style="color: #ffffff; margin: 4px 0 0 0; font-size: 22px; font-weight: bold;">Rephonix Price Match Lead</h1>
        <p style="color: #fef3c7; margin: 4px 0 0 0; font-size: 13px;">Ref Code: ${escapeHtml(data.refCode || 'MATCH-REQUEST')}</p>
      </div>

      <div style="padding: 24px; background-color: #1e293b;">
        <p style="font-size: 14px; color: #cbd5e1; margin-top: 0;">A customer requested a target price match / custom quote for their device:</p>

        <!-- CUSTOMER CONTACT HIGHLIGHT -->
        <div style="margin-bottom: 20px; background-color: #0f172a; padding: 18px; border-radius: 8px; border: 1px solid #f59e0b;">
          <h3 style="margin: 0 0 12px 0; font-size: 13px; font-weight: bold; color: #fbbf24; text-transform: uppercase; letter-spacing: 0.5px;">📞 Customer Contact Info</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #e2e8f0;">
            <tr>
              <td style="padding: 6px 0; color: #94a3b8; width: 150px;">Mobile / WhatsApp:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #38bdf8; font-size: 16px;"><a href="${escapeHtml(callUrl)}" style="color: #38bdf8; text-decoration: none;">+91 ${escapeHtml(phoneFormatted)}</a></td>
            </tr>
            ${data.customerName ? `
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Customer Name:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #f8fafc;">${escapeHtml(data.customerName)}</td>
            </tr>` : ''}
            ${data.customerEmail ? `
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Email Address:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #f8fafc;"><a href="mailto:${encodeURIComponent(data.customerEmail)}" style="color: #f8fafc; text-decoration: underline;">${escapeHtml(data.customerEmail)}</a></td>
            </tr>` : ''}
          </table>
        </div>

        <!-- TARGET DEVICE & PRICE COMPARISON -->
        <div style="margin-bottom: 20px; background-color: #0f172a; padding: 18px; border-radius: 8px; border: 1px solid #334155;">
          <h3 style="margin: 0 0 12px 0; font-size: 13px; font-weight: bold; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px;">📱 Device & Price Match Request</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #e2e8f0;">
            <tr>
              <td style="padding: 6px 0; color: #94a3b8; width: 150px;">Target Device:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #f8fafc;">${escapeHtml(data.modelName)} (${Number(data.storageGb) >= 1024 ? '1TB' : Number(data.storageGb) + 'GB'})</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Current System Quote:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #94a3b8; text-decoration: line-through;">${escapeHtml(formattedCurrent)}</td>
            </tr>
            <tr style="border-top: 1px solid #334155;">
              <td style="padding: 10px 0 4px 0; font-weight: bold; color: #fbbf24; font-size: 14px;">Customer Target Price:</td>
              <td style="padding: 10px 0 4px 0; font-weight: bold; color: #f59e0b; font-size: 24px;">${escapeHtml(formattedExpected)}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0 4px 0; color: #94a3b8; vertical-align: top;">Comments:</td>
              <td style="padding: 10px 0 4px 0; font-weight: bold; color: #e2e8f0; line-height: 1.4;">${escapeHtml(data.comments || 'No additional comments provided')}</td>
            </tr>
          </table>
        </div>

        <!-- ACTION BUTTONS -->
        <div style="text-align: center; margin: 24px 0 8px 0;">
          <a href="${escapeHtml(waUrl)}" style="background-color: #10b981; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; margin-right: 8px;">💬 Open WhatsApp Chat</a>
          <a href="${escapeHtml(callUrl)}" style="background-color: #2563eb; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">📞 Call Customer Now</a>
        </div>
      </div>

      <div style="background-color: #0f172a; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #334155;">
        <p style="margin: 0;">Rephonix Price Match Engine &bull; Urgent Deal Opportunity Lead</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: getFromAddress(),
      to: adminRecipient,
      subject: `🏷️ [PRICE MATCH REQUEST] ${data.modelName} (${data.storageGb >= 1024 ? '1TB' : data.storageGb + 'GB'}) - Target: ${formattedExpected} (Phone: ${data.customerPhone})`,
      html: htmlBody,
    });

    console.log(`[Price Match Mailer] Successfully sent SMTP price match alert email to ${adminRecipient} for phone ${data.customerPhone}!`);
    return true;
  } catch (err) {
    console.error('[Price Match Mailer] Failed to send price match alert email via Nodemailer:', err);
    return false;
  }
}

export interface StepLeadAlertData {
  modelName: string;
  brandName?: string;
  storageGb: number;
  ramGb?: number;
  basePrice?: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  deviceType?: string;
  sourceUrl?: string;
  ip?: string;
  userAgent?: string;
}

export async function sendAdminStepLeadEmail(data: StepLeadAlertData): Promise<boolean> {
  const adminRecipient = process.env.ADMIN_ALERT_EMAIL || 'garvitmadan511@gmail.com';
  const transporter = getTransporter();

  const formattedBase = data.basePrice && data.basePrice > 0
    ? `₹${data.basePrice.toLocaleString('en-IN')}`
    : 'Pending Full Diagnostics';

  const specLabel = `${Number(data.storageGb) >= 1024 ? (Number(data.storageGb) / 1024) + ' TB' : Number(data.storageGb) + ' GB'}${data.ramGb ? ` • ${data.ramGb} GB RAM` : ''}`;

  const cleanPhone = data.customerPhone ? String(data.customerPhone).replace(/[^\d+]/g, '') : '';
  const isGuest = !data.customerName && !data.customerPhone && !data.customerEmail;
  const leadTitle = isGuest ? 'Guest Website Visitor' : (data.customerName || 'Registered User');

  const nowIst = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const subject = isGuest
    ? `🔥 [STEP 2 LEAD] Visitor is evaluating ${data.modelName} (${specLabel})`
    : `🔥 [STEP 2 LEAD] ${leadTitle} is evaluating ${data.modelName} (${specLabel})`;

  if (!transporter) {
    console.log(`[Step Lead Mailer] SMTP credentials not set. Lead ready for ${adminRecipient}: ${leadTitle} -> ${data.modelName} (${specLabel})`);
    return true;
  }

  const waLeadMsg = encodeURIComponent(
    `Hello! We saw you were checking the sell value for ${data.modelName} (${specLabel}) on Rephonix. Would you like an instant quote with free doorstep pickup today?`
  );
  const waUrl = cleanPhone ? `https://wa.me/91${cleanPhone.replace(/^(\+?91)/, '')}?text=${waLeadMsg}` : '';
  const callUrl = cleanPhone ? `tel:${cleanPhone}` : '';

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #0f172a; border: 1px solid #334155; border-radius: 12px; overflow: hidden; color: #f8fafc;">
      <!-- HEADER -->
      <div style="background: linear-gradient(135deg, #091e3a 0%, #1d4ed8 100%); padding: 26px 24px; text-align: center; border-bottom: 1px solid #1e3a8a;">
        <span style="display: inline-block; padding: 5px 14px; background-color: #f97316; color: #ffffff; font-weight: 800; font-size: 11px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">🔥 LIVE IN-MARKET LEAD // STEP 2 REACHED</span>
        <h1 style="color: #ffffff; margin: 0 0 6px 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Customer Evaluating Device</h1>
        <p style="color: #bfdbfe; margin: 0; font-size: 13px;">A prospective seller entered Step 2 (Screen & Display Check) on Rephonix</p>
      </div>

      <!-- BODY -->
      <div style="padding: 24px; background-color: #0b1329;">
        <!-- DEVICE SUMMARY CARD -->
        <div style="margin-bottom: 20px; background-color: #111d38; padding: 18px; border-radius: 10px; border: 1px solid #1e3a8a;">
          <h3 style="margin: 0 0 12px 0; font-size: 12px; font-weight: 800; color: #60a5fa; text-transform: uppercase; letter-spacing: 0.8px;">📱 Device Model Selected</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #e2e8f0;">
            <tr>
              <td style="padding: 6px 0; color: #94a3b8; width: 140px;">Model:</td>
              <td style="padding: 6px 0; font-weight: 800; color: #ffffff; font-size: 17px;">${escapeHtml(data.modelName)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Specification:</td>
              <td style="padding: 6px 0; font-weight: 700; color: #38bdf8;">${escapeHtml(specLabel)}</td>
            </tr>
            ${data.brandName ? `
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Brand / Category:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #cbd5e1;">${escapeHtml(data.brandName)} ${data.deviceType ? `(${escapeHtml(data.deviceType)})` : ''}</td>
            </tr>
            ` : ''}
            <tr style="border-top: 1px solid #1e293b;">
              <td style="padding: 10px 0 4px 0; color: #94a3b8; font-size: 13px;">Base Trade-in Value:</td>
              <td style="padding: 10px 0 4px 0; font-weight: 800; color: #10b981; font-size: 20px;">${escapeHtml(formattedBase)}</td>
            </tr>
          </table>
        </div>

        <!-- VISITOR STATUS CARD -->
        <div style="margin-bottom: 20px; background-color: #111d38; padding: 18px; border-radius: 10px; border: 1px solid #334155;">
          <h3 style="margin: 0 0 12px 0; font-size: 12px; font-weight: 800; color: ${isGuest ? '#f59e0b' : '#38bdf8'}; text-transform: uppercase; letter-spacing: 0.8px;">
            ${isGuest ? '👤 Visitor Status: Anonymous / Guest' : '👤 Customer Contact Details'}
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #e2e8f0;">
            <tr>
              <td style="padding: 6px 0; color: #94a3b8; width: 140px;">User Status:</td>
              <td style="padding: 6px 0; font-weight: bold; color: ${isGuest ? '#f59e0b' : '#10b981'};">
                ${isGuest ? 'Guest Visitor (Not logged in yet)' : 'Logged-In Rephonix Account'}
              </td>
            </tr>
            ${data.customerName ? `
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Customer Name:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #ffffff;">${escapeHtml(data.customerName)}</td>
            </tr>
            ` : ''}
            ${cleanPhone ? `
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Phone Number:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #38bdf8;">
                <a href="tel:${encodeURIComponent(cleanPhone)}" style="color: #38bdf8; text-decoration: none;">+91 ${escapeHtml(cleanPhone)}</a>
              </td>
            </tr>
            ` : ''}
            ${data.customerEmail ? `
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Email Address:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #cbd5e1;">
                <a href="mailto:${encodeURIComponent(data.customerEmail)}" style="color: #38bdf8; text-decoration: none;">${escapeHtml(data.customerEmail)}</a>
              </td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Diagnostic Stage:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #93c5fd;">Step 2 // Screen & Display Diagnostics</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Time (IST):</td>
              <td style="padding: 6px 0; color: #94a3b8;">${escapeHtml(nowIst)}</td>
            </tr>
            ${data.sourceUrl ? `
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Page URL:</td>
              <td style="padding: 6px 0; color: #64748b; font-size: 11px; word-break: break-all;">${escapeHtml(data.sourceUrl)}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        ${cleanPhone ? `
        <!-- QUICK CONTACT BUTTONS (IF PHONE AVAILABLE) -->
        <div style="text-align: center; margin: 20px 0 8px 0;">
          <a href="${escapeHtml(waUrl)}" style="background-color: #10b981; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px; display: inline-block; margin-right: 8px;">💬 Chat on WhatsApp</a>
          <a href="${escapeHtml(callUrl)}" style="background-color: #2563eb; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px; display: inline-block;">📞 Call Customer</a>
        </div>
        ` : `
        <div style="background-color: #0f172a; padding: 12px 16px; border-radius: 8px; border: 1px dashed #334155; font-size: 12px; color: #94a3b8; text-align: center;">
          💡 <em>Tip: This visitor is currently actively progressing through the evaluation steps on your website. Once they complete the diagnostics and sign in or book, you'll receive the full booking details.</em>
        </div>
        `}
      </div>

      <!-- FOOTER -->
      <div style="background-color: #080d1a; padding: 14px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b;">
        <p style="margin: 0;">Rephonix Real-time Step Lead Notification &bull; Instant In-Market Alert</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: getFromAddress(),
      to: adminRecipient,
      subject,
      html: htmlBody,
    });

    console.log(`[Step Lead Mailer] Successfully sent immediate Step 2 lead email to ${adminRecipient} for model "${data.modelName}"!`);
    return true;
  } catch (err) {
    console.error('[Step Lead Mailer] Failed to send step lead alert email via Nodemailer:', err);
    return false;
  }
}

