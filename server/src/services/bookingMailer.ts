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
    <div style="background-color: #f8fafc; padding: 32px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 32px 28px; color: #111827;">
        <!-- Header -->
        <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 18px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td>
                <span style="font-size: 16px; font-weight: 700; color: #111827; letter-spacing: -0.2px;">Rephonix Operations</span>
              </td>
              <td style="text-align: right;">
                <span style="font-size: 12px; color: #6b7280; font-family: monospace;">Booking #${escapeHtml(booking.id)}</span>
              </td>
            </tr>
          </table>
        </div>

        <h1 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 8px 0; letter-spacing: -0.2px;">New Booking Received</h1>
        <p style="font-size: 13px; color: #4b5563; margin: 0 0 24px 0; line-height: 20px;">A new booking has been submitted by a customer and is pending review in the Admin Ledger.</p>

        <!-- Customer Info -->
        <div style="border-top: 1px solid #f1f5f9; padding-top: 18px; margin-bottom: 20px;">
          <h2 style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">Customer</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #6b7280; width: 140px;">Name</td>
              <td style="padding: 6px 0; color: #111827; font-weight: 500;">${escapeHtml(booking.customerName)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Phone</td>
              <td style="padding: 6px 0;"><a href="tel:${encodeURIComponent(cleanPhone)}" style="color: #111827; text-decoration: none; font-weight: 500;">+91 ${escapeHtml(cleanPhone)}</a></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Email</td>
              <td style="padding: 6px 0;"><a href="mailto:${encodeURIComponent(booking.customerEmail)}" style="color: #111827; text-decoration: underline;">${escapeHtml(booking.customerEmail)}</a></td>
            </tr>
          </table>
        </div>

        <!-- Schedule & Address -->
        <div style="border-top: 1px solid #f1f5f9; padding-top: 18px; margin-bottom: 20px;">
          <h2 style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">Pickup Schedule &amp; Address</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #6b7280; width: 140px;">Requested date</td>
              <td style="padding: 6px 0; color: #111827; font-weight: 500;">${escapeHtml(booking.pickupDate)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Time window</td>
              <td style="padding: 6px 0; color: #111827; font-weight: 500;">${escapeHtml(booking.pickupTimeSlot)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280; vertical-align: top;">Address</td>
              <td style="padding: 6px 0; color: #111827; line-height: 1.4;">${escapeHtml(booking.address)}</td>
            </tr>
          </table>
        </div>

        <!-- Device & Payout -->
        <div style="border-top: 1px solid #f1f5f9; padding-top: 18px; margin-bottom: 24px;">
          <h2 style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">Device &amp; Valuation</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #6b7280; width: 140px;">Device model</td>
              <td style="padding: 6px 0; color: #111827; font-weight: 500;">${escapeHtml(booking.modelName)} (${Number(booking.storageGb)}GB)</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280; vertical-align: top;">Reported condition</td>
              <td style="padding: 6px 0; color: #374151; line-height: 1.4;">${defectListHtml}</td>
            </tr>
            <tr style="border-top: 1px solid #f1f5f9;">
              <td style="padding: 10px 0 0 0; color: #111827; font-weight: 600;">Estimated payout</td>
              <td style="padding: 10px 0 0 0; color: #111827; font-size: 16px; font-weight: 700;">₹${Number(booking.finalPrice).toLocaleString('en-IN')}</td>
            </tr>
          </table>
        </div>

        <!-- Action Button -->
        <div style="margin: 24px 0 16px 0;">
          <a href="${escapeHtml(pdfDownloadUrl)}" style="background-color: #111827; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 13px; display: inline-block;">Download Quotation PDF</a>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 28px; font-size: 11px; color: #9ca3af;">
          <p style="margin: 0;">Internal operational notification &bull; Rephonix</p>
        </div>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: getFromAddress(),
      to: adminRecipient,
      subject: `New booking: ${booking.customerName} - ${booking.modelName} (#${booking.id})`,
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

/**
 * Dispatched immediately when a customer creates a new booking.
 * Informs customer that their booking has been received and is currently under review by the operations team.
 */
export async function sendBookingUnderReviewEmail(booking: PDFBookingData, baseUrl: string = 'http://localhost:4000'): Promise<boolean> {
  const recipientEmail = booking.customerEmail;
  const pdfDownloadUrl = `${baseUrl}/api/bookings/${encodeURIComponent(booking.id)}/pdf`;

  // 1. Generate PDF document buffer
  let pdfBuffer: Buffer | null = null;
  try {
    pdfBuffer = await generateBookingQuotationPDF(booking);
  } catch (err) {
    console.error('[Booking Mailer] Failed to generate PDF buffer:', err);
  }

  // 2. Dispatch Admin Notification Email so the operations team knows a new booking is awaiting review
  try {
    await sendAdminBookingNotificationEmail(booking, pdfBuffer, baseUrl);
  } catch (err) {
    console.error('[Booking Mailer] Error sending admin notification email:', err);
  }

  // 3. Direct Nodemailer SMTP for Customer
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[Booking Mailer] SMTP credentials not set. Booking under-review email ready via API for ${recipientEmail}. Link: ${pdfDownloadUrl}`);
    return true;
  }

  const defectListHtml = booking.defectDescriptions && booking.defectDescriptions.length > 0
    ? booking.defectDescriptions.map(d => escapeHtml(d)).join(', ')
    : 'None reported (Mint Condition / Flawless)';

  const htmlBody = `
    <div style="background-color: #f8fafc; padding: 32px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 36px 32px; color: #111827;">
        
        <!-- Header -->
        <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 28px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="vertical-align: middle;">
                <span style="font-size: 18px; font-weight: 700; color: #111827; letter-spacing: -0.3px;">Rephonix</span>
              </td>
              <td style="text-align: right; vertical-align: middle;">
                <span style="font-size: 13px; color: #6b7280;">Order #${escapeHtml(booking.id)}</span>
              </td>
            </tr>
          </table>
        </div>

        <!-- Main Heading -->
        <h1 style="font-size: 20px; font-weight: 600; color: #111827; margin: 0 0 16px 0; letter-spacing: -0.3px;">Your booking is under review</h1>

        <!-- Body Text -->
        <p style="font-size: 14px; line-height: 24px; color: #374151; margin: 0 0 14px 0;">Hi ${escapeHtml(booking.customerName)},</p>
        <p style="font-size: 14px; line-height: 24px; color: #374151; margin: 0 0 14px 0;">
          Thank you for choosing Rephonix. We've received your booking for the <strong>${escapeHtml(booking.modelName)} (${Number(booking.storageGb)}GB)</strong>.
        </p>
        <p style="font-size: 14px; line-height: 24px; color: #374151; margin: 0 0 28px 0;">
          Our team is currently reviewing technician availability and slot scheduling. Once verified, you will receive an email confirmation with your appointment details.
        </p>

        <!-- Summary Table -->
        <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; margin-bottom: 28px;">
          <h2 style="font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 16px 0;">Booking Summary</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #f9fafb; width: 40%;">Device</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 500; text-align: right; border-bottom: 1px solid #f9fafb;">${escapeHtml(booking.modelName)} (${Number(booking.storageGb)}GB)</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #f9fafb;">Reported condition</td>
              <td style="padding: 8px 0; color: #111827; text-align: right; border-bottom: 1px solid #f9fafb;">${defectListHtml}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #f9fafb;">Requested date</td>
              <td style="padding: 8px 0; color: #111827; text-align: right; border-bottom: 1px solid #f9fafb;">${escapeHtml(booking.pickupDate)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #f9fafb;">Time slot</td>
              <td style="padding: 8px 0; color: #111827; text-align: right; border-bottom: 1px solid #f9fafb;">${escapeHtml(booking.pickupTimeSlot)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; vertical-align: top; border-bottom: 1px solid #f9fafb;">Pickup address</td>
              <td style="padding: 8px 0; color: #111827; text-align: right; line-height: 1.5; border-bottom: 1px solid #f9fafb;">${escapeHtml(booking.address)}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0 0 0; color: #111827; font-weight: 600;">Estimated payout</td>
              <td style="padding: 12px 0 0 0; color: #111827; font-size: 16px; font-weight: 700; text-align: right;">₹${Number(booking.finalPrice).toLocaleString('en-IN')}</td>
            </tr>
          </table>
        </div>

        <!-- What to expect -->
        <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; margin-bottom: 28px;">
          <h3 style="font-size: 13px; font-weight: 600; color: #111827; margin: 0 0 8px 0;">What to expect next</h3>
          <p style="font-size: 13px; line-height: 22px; color: #4b5563; margin: 0 0 6px 0;">&bull; Our team reviews route coverage and assigns a local technician.</p>
          <p style="font-size: 13px; line-height: 22px; color: #4b5563; margin: 0 0 6px 0;">&bull; You will receive a confirmation email once your appointment is locked in.</p>
          <p style="font-size: 13px; line-height: 22px; color: #4b5563; margin: 0;">&bull; At pickup, our executive will inspect the device and transfer payment instantly via UPI or bank transfer.</p>
        </div>

        <!-- Button -->
        <div style="margin: 28px 0 20px 0;">
          <a href="${escapeHtml(pdfDownloadUrl)}" style="background-color: #111827; color: #ffffff; padding: 11px 22px; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 500; display: inline-block;">Download Quotation PDF</a>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #f1f5f9; padding-top: 24px; margin-top: 32px; font-size: 12px; color: #9ca3af; line-height: 20px;">
          <p style="margin: 0 0 4px 0;">Questions? Reply to this email or reach us at <a href="mailto:support@rephonix.in" style="color: #6b7280; text-decoration: underline;">support@rephonix.in</a></p>
          <p style="margin: 0;">Rephonix &bull; Order #${escapeHtml(booking.id)}</p>
        </div>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: getFromAddress(),
      to: recipientEmail,
      subject: `We've received your booking - #${booking.id}`,
      html: htmlBody,
      attachments: pdfBuffer ? [
        {
          filename: `Quotation-${booking.id}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        }
      ] : [],
    });

    console.log(`[Booking Mailer] Successfully sent Under Review email to ${recipientEmail} for booking #${booking.id}!`);
    return true;
  } catch (err) {
    console.error('[Booking Mailer] Failed to send under review email via Nodemailer:', err);
    return false;
  }
}

/**
 * Dispatched when an admin reviews and approves the booking in the Admin Panel.
 * Sends the official Confirmation Email with locked appointment schedule to customer.
 */
export async function sendBookingApprovalEmail(booking: PDFBookingData, baseUrl: string = 'http://localhost:4000'): Promise<boolean> {
  const recipientEmail = booking.customerEmail;
  const pdfDownloadUrl = `${baseUrl}/api/bookings/${encodeURIComponent(booking.id)}/pdf`;

  // 1. Generate PDF document buffer
  let pdfBuffer: Buffer | null = null;
  try {
    pdfBuffer = await generateBookingQuotationPDF(booking);
  } catch (err) {
    console.error('[Booking Mailer] Failed to generate PDF buffer:', err);
  }

  // 2. Direct Nodemailer SMTP for Customer
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[Booking Mailer] SMTP credentials not set. Booking approval email ready via API for ${recipientEmail}. Link: ${pdfDownloadUrl}`);
    return true;
  }

  const defectListHtml = booking.defectDescriptions && booking.defectDescriptions.length > 0
    ? booking.defectDescriptions.map(d => escapeHtml(d)).join(', ')
    : 'None reported (Mint Condition / Flawless)';

  const htmlBody = `
    <div style="background-color: #f8fafc; padding: 32px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 36px 32px; color: #111827;">
        
        <!-- Header -->
        <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 28px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="vertical-align: middle;">
                <span style="font-size: 18px; font-weight: 700; color: #111827; letter-spacing: -0.3px;">Rephonix</span>
              </td>
              <td style="text-align: right; vertical-align: middle;">
                <span style="font-size: 13px; color: #6b7280;">Order #${escapeHtml(booking.id)}</span>
              </td>
            </tr>
          </table>
        </div>

        <!-- Main Heading -->
        <h1 style="font-size: 20px; font-weight: 600; color: #111827; margin: 0 0 16px 0; letter-spacing: -0.3px;">Your pickup is confirmed</h1>

        <!-- Body Text -->
        <p style="font-size: 14px; line-height: 24px; color: #374151; margin: 0 0 14px 0;">Hi ${escapeHtml(booking.customerName)},</p>
        <p style="font-size: 14px; line-height: 24px; color: #374151; margin: 0 0 14px 0;">
          Your booking for the <strong>${escapeHtml(booking.modelName)} (${Number(booking.storageGb)}GB)</strong> has been confirmed. A Rephonix technician is scheduled to visit you on <strong>${escapeHtml(booking.pickupDate)}</strong> during <strong>${escapeHtml(booking.pickupTimeSlot)}</strong>.
        </p>
        <p style="font-size: 14px; line-height: 24px; color: #374151; margin: 0 0 28px 0;">
          Our technician will inspect the device at your doorstep and transfer the payment immediately to your UPI or bank account before taking handover.
        </p>

        <!-- Summary Table -->
        <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; margin-bottom: 28px;">
          <h2 style="font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 16px 0;">Appointment Details</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #f9fafb; width: 40%;">Appointment date</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 500; text-align: right; border-bottom: 1px solid #f9fafb;">${escapeHtml(booking.pickupDate)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #f9fafb;">Arrival window</td>
              <td style="padding: 8px 0; color: #111827; text-align: right; border-bottom: 1px solid #f9fafb;">${escapeHtml(booking.pickupTimeSlot)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #f9fafb;">Device</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 500; text-align: right; border-bottom: 1px solid #f9fafb;">${escapeHtml(booking.modelName)} (${Number(booking.storageGb)}GB)</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #f9fafb;">Reported condition</td>
              <td style="padding: 8px 0; color: #111827; text-align: right; border-bottom: 1px solid #f9fafb;">${defectListHtml}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; vertical-align: top; border-bottom: 1px solid #f9fafb;">Pickup address</td>
              <td style="padding: 8px 0; color: #111827; text-align: right; line-height: 1.5; border-bottom: 1px solid #f9fafb;">${escapeHtml(booking.address)}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0 0 0; color: #111827; font-weight: 600;">Agreed payout</td>
              <td style="padding: 12px 0 0 0; color: #111827; font-size: 16px; font-weight: 700; text-align: right;">₹${Number(booking.finalPrice).toLocaleString('en-IN')}</td>
            </tr>
          </table>
        </div>

        <!-- Before pickup checklist -->
        <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; margin-bottom: 28px;">
          <h3 style="font-size: 13px; font-weight: 600; color: #111827; margin: 0 0 8px 0;">Before your pickup</h3>
          <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #4b5563; line-height: 22px;">
            <li>Charge your phone to at least 50% for diagnostics</li>
            <li>Back up your personal data and remove screen locks / accounts</li>
            <li>Keep a government-issued photo ID ready for verification</li>
          </ul>
        </div>

        <!-- Button -->
        <div style="margin: 28px 0 20px 0;">
          <a href="${escapeHtml(pdfDownloadUrl)}" style="background-color: #111827; color: #ffffff; padding: 11px 22px; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 500; display: inline-block;">Download Quotation PDF</a>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #f1f5f9; padding-top: 24px; margin-top: 32px; font-size: 12px; color: #9ca3af; line-height: 20px;">
          <p style="margin: 0 0 4px 0;">Need to reschedule or update pickup details? Email us at <a href="mailto:support@rephonix.in" style="color: #6b7280; text-decoration: underline;">support@rephonix.in</a></p>
          <p style="margin: 0;">Rephonix &bull; Order #${escapeHtml(booking.id)}</p>
        </div>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: getFromAddress(),
      to: recipientEmail,
      subject: `Booking confirmed - #${booking.id}`,
      html: htmlBody,
      attachments: pdfBuffer ? [
        {
          filename: `Quotation-${booking.id}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        }
      ] : [],
    });

    console.log(`[Booking Mailer] Successfully sent Booking Confirmed email to ${recipientEmail} for booking #${booking.id}!`);
    return true;
  } catch (err) {
    console.error('[Booking Mailer] Failed to send booking confirmed email via Nodemailer:', err);
    return false;
  }
}

/**
 * Backward-compatibility alias for sendBookingApprovalEmail
 */
export const sendBookingConfirmationEmail = sendBookingApprovalEmail;

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
    <div style="background-color: #f8fafc; padding: 32px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 32px 28px; color: #111827;">
        
        <!-- Header -->
        <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 18px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td>
                <span style="font-size: 16px; font-weight: 700; color: #111827; letter-spacing: -0.2px;">Rephonix Lead Alert</span>
              </td>
              <td style="text-align: right;">
                <span style="font-size: 12px; color: #6b7280; font-family: monospace;">Ref: ${escapeHtml(data.refCode || 'SCH-QUOTE')}</span>
              </td>
            </tr>
          </table>
        </div>

        <h1 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 8px 0; letter-spacing: -0.2px;">Quote Generated</h1>
        <p style="font-size: 13px; color: #4b5563; margin: 0 0 24px 0; line-height: 20px;">A logged-in customer completed diagnostic evaluation and generated a quote.</p>

        <!-- Customer Details -->
        <div style="border-top: 1px solid #f1f5f9; padding-top: 18px; margin-bottom: 20px;">
          <h2 style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">Customer</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #6b7280; width: 140px;">Name</td>
              <td style="padding: 6px 0; color: #111827; font-weight: 500;">${escapeHtml(data.customerName)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Phone</td>
              <td style="padding: 6px 0;"><a href="tel:${encodeURIComponent(cleanPhone)}" style="color: #111827; text-decoration: none; font-weight: 500;">+91 ${escapeHtml(cleanPhone)}</a></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Email</td>
              <td style="padding: 6px 0;"><a href="mailto:${encodeURIComponent(data.customerEmail)}" style="color: #111827; text-decoration: underline;">${escapeHtml(data.customerEmail)}</a></td>
            </tr>
          </table>
        </div>

        <!-- Target Device & Payout -->
        <div style="border-top: 1px solid #f1f5f9; padding-top: 18px; margin-bottom: 24px;">
          <h2 style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">Device &amp; Valuation</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #6b7280; width: 140px;">Target device</td>
              <td style="padding: 6px 0; color: #111827; font-weight: 500;">${escapeHtml(data.modelName)} (${Number(data.storageGb) >= 1024 ? '1TB' : Number(data.storageGb) + 'GB'})</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Value retained</td>
              <td style="padding: 6px 0; color: #111827; font-weight: 500;">${Number(data.retentionPercentage)}%</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280; vertical-align: top;">Condition check</td>
              <td style="padding: 6px 0; color: #374151; line-height: 1.4;">${defectText}</td>
            </tr>
            <tr style="border-top: 1px solid #f1f5f9;">
              <td style="padding: 10px 0 0 0; color: #111827; font-weight: 600;">Estimated Payout</td>
              <td style="padding: 10px 0 0 0; color: #111827; font-size: 16px; font-weight: 700;">${escapeHtml(formattedPayout)}</td>
            </tr>
          </table>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 28px; font-size: 11px; color: #9ca3af;">
          <p style="margin: 0;">Diagnostic engine notification &bull; Rephonix</p>
        </div>
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
      subject: `Quote generated: ${data.modelName} (${data.storageGb >= 1024 ? '1TB' : data.storageGb + 'GB'}) - ${data.customerName} (${formattedPayout})`,
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
    <div style="background-color: #f8fafc; padding: 32px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 32px 28px; color: #111827;">
        
        <!-- Header -->
        <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 18px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td>
                <span style="font-size: 16px; font-weight: 700; color: #111827; letter-spacing: -0.2px;">Rephonix Deal Alert</span>
              </td>
              <td style="text-align: right;">
                <span style="font-size: 12px; color: #6b7280; font-family: monospace;">Ref: ${escapeHtml(data.refCode || 'MATCH-REQUEST')}</span>
              </td>
            </tr>
          </table>
        </div>

        <h1 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 8px 0; letter-spacing: -0.2px;">Price Match Request</h1>
        <p style="font-size: 13px; color: #4b5563; margin: 0 0 24px 0; line-height: 20px;">A customer submitted a custom price match request for their device.</p>

        <!-- Customer Contact -->
        <div style="border-top: 1px solid #f1f5f9; padding-top: 18px; margin-bottom: 20px;">
          <h2 style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">Customer</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #6b7280; width: 140px;">Phone</td>
              <td style="padding: 6px 0;"><a href="${escapeHtml(callUrl)}" style="color: #111827; text-decoration: none; font-weight: 600;">+91 ${escapeHtml(phoneFormatted)}</a></td>
            </tr>
            ${data.customerName ? `
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Name</td>
              <td style="padding: 6px 0; color: #111827; font-weight: 500;">${escapeHtml(data.customerName)}</td>
            </tr>` : ''}
            ${data.customerEmail ? `
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Email</td>
              <td style="padding: 6px 0;"><a href="mailto:${encodeURIComponent(data.customerEmail)}" style="color: #111827; text-decoration: underline;">${escapeHtml(data.customerEmail)}</a></td>
            </tr>` : ''}
          </table>
        </div>

        <!-- Target Device & Pricing -->
        <div style="border-top: 1px solid #f1f5f9; padding-top: 18px; margin-bottom: 24px;">
          <h2 style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">Price Comparison</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #6b7280; width: 140px;">Target device</td>
              <td style="padding: 6px 0; color: #111827; font-weight: 500;">${escapeHtml(data.modelName)} (${Number(data.storageGb) >= 1024 ? '1TB' : Number(data.storageGb) + 'GB'})</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">System quote</td>
              <td style="padding: 6px 0; color: #6b7280; text-decoration: line-through;">${escapeHtml(formattedCurrent)}</td>
            </tr>
            <tr style="border-top: 1px solid #f1f5f9;">
              <td style="padding: 10px 0 0 0; color: #111827; font-weight: 600;">Customer target</td>
              <td style="padding: 10px 0 0 0; color: #111827; font-size: 16px; font-weight: 700;">${escapeHtml(formattedExpected)}</td>
            </tr>
            ${data.comments ? `
            <tr>
              <td style="padding: 8px 0 0 0; color: #6b7280; vertical-align: top;">Comments</td>
              <td style="padding: 8px 0 0 0; color: #374151; line-height: 1.4;">${escapeHtml(data.comments)}</td>
            </tr>` : ''}
          </table>
        </div>

        <!-- Action Links -->
        <div style="margin: 24px 0 16px 0;">
          <a href="${escapeHtml(waUrl)}" style="background-color: #111827; color: #ffffff; padding: 10px 18px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 13px; display: inline-block; margin-right: 8px;">WhatsApp</a>
          <a href="${escapeHtml(callUrl)}" style="background-color: #f3f4f6; color: #111827; border: 1px solid #e5e7eb; padding: 9px 18px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 13px; display: inline-block;">Call</a>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 28px; font-size: 11px; color: #9ca3af;">
          <p style="margin: 0;">Price match notification &bull; Rephonix</p>
        </div>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: getFromAddress(),
      to: adminRecipient,
      subject: `Price match request: ${data.modelName} - Target: ${formattedExpected} (${data.customerPhone})`,
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
    ? `Visitor evaluating ${data.modelName} (${specLabel})`
    : `${leadTitle} evaluating ${data.modelName} (${specLabel})`;

  if (!transporter) {
    console.log(`[Step Lead Mailer] SMTP credentials not set. Lead ready for ${adminRecipient}: ${leadTitle} -> ${data.modelName} (${specLabel})`);
    return true;
  }

  const waLeadMsg = encodeURIComponent(
    `Hello! We saw you were checking the sell value for ${data.modelName} (${specLabel}) on Rephonix. Would you like an instant quote and scheduled pickup today?`
  );
  const waUrl = cleanPhone ? `https://wa.me/91${cleanPhone.replace(/^(\+?91)/, '')}?text=${waLeadMsg}` : '';
  const callUrl = cleanPhone ? `tel:${cleanPhone}` : '';

  const htmlBody = `
    <div style="background-color: #f8fafc; padding: 32px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 32px 28px; color: #111827;">
        
        <!-- Header -->
        <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 18px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td>
                <span style="font-size: 16px; font-weight: 700; color: #111827; letter-spacing: -0.2px;">Rephonix Lead Alert</span>
              </td>
              <td style="text-align: right;">
                <span style="font-size: 12px; color: #6b7280;">Step 2 Reached</span>
              </td>
            </tr>
          </table>
        </div>

        <h1 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 8px 0; letter-spacing: -0.2px;">Visitor Evaluating Device</h1>
        <p style="font-size: 13px; color: #4b5563; margin: 0 0 24px 0; line-height: 20px;">A prospective seller entered Step 2 (Screen &amp; Display Check) on Rephonix.</p>

        <!-- Device Model -->
        <div style="border-top: 1px solid #f1f5f9; padding-top: 18px; margin-bottom: 20px;">
          <h2 style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">Device Model</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #6b7280; width: 140px;">Model</td>
              <td style="padding: 6px 0; color: #111827; font-weight: 500;">${escapeHtml(data.modelName)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Specification</td>
              <td style="padding: 6px 0; color: #111827;">${escapeHtml(specLabel)}</td>
            </tr>
            ${data.brandName ? `
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Brand</td>
              <td style="padding: 6px 0; color: #111827;">${escapeHtml(data.brandName)} ${data.deviceType ? `(${escapeHtml(data.deviceType)})` : ''}</td>
            </tr>` : ''}
            <tr style="border-top: 1px solid #f1f5f9;">
              <td style="padding: 10px 0 0 0; color: #111827; font-weight: 600;">Base valuation</td>
              <td style="padding: 10px 0 0 0; color: #111827; font-size: 16px; font-weight: 700;">${escapeHtml(formattedBase)}</td>
            </tr>
          </table>
        </div>

        <!-- Visitor / Contact Details -->
        <div style="border-top: 1px solid #f1f5f9; padding-top: 18px; margin-bottom: 24px;">
          <h2 style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">Visitor Details</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #6b7280; width: 140px;">Status</td>
              <td style="padding: 6px 0; color: #111827; font-weight: 500;">${isGuest ? 'Guest visitor' : 'Logged-in user'}</td>
            </tr>
            ${data.customerName ? `
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Name</td>
              <td style="padding: 6px 0; color: #111827; font-weight: 500;">${escapeHtml(data.customerName)}</td>
            </tr>` : ''}
            ${cleanPhone ? `
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Phone</td>
              <td style="padding: 6px 0;"><a href="tel:${encodeURIComponent(cleanPhone)}" style="color: #111827; text-decoration: none; font-weight: 500;">+91 ${escapeHtml(cleanPhone)}</a></td>
            </tr>` : ''}
            ${data.customerEmail ? `
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Email</td>
              <td style="padding: 6px 0;"><a href="mailto:${encodeURIComponent(data.customerEmail)}" style="color: #111827; text-decoration: underline;">${escapeHtml(data.customerEmail)}</a></td>
            </tr>` : ''}
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Time (IST)</td>
              <td style="padding: 6px 0; color: #4b5563;">${escapeHtml(nowIst)}</td>
            </tr>
          </table>
        </div>

        ${cleanPhone ? `
        <!-- Action Links -->
        <div style="margin: 24px 0 16px 0;">
          <a href="${escapeHtml(waUrl)}" style="background-color: #111827; color: #ffffff; padding: 10px 18px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 13px; display: inline-block; margin-right: 8px;">WhatsApp</a>
          <a href="${escapeHtml(callUrl)}" style="background-color: #f3f4f6; color: #111827; border: 1px solid #e5e7eb; padding: 9px 18px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 13px; display: inline-block;">Call</a>
        </div>
        ` : ''}

        <!-- Footer -->
        <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 28px; font-size: 11px; color: #9ca3af;">
          <p style="margin: 0;">Step lead notification &bull; Rephonix</p>
        </div>
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

