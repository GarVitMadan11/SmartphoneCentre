import nodemailer from 'nodemailer';
import { generateBookingQuotationPDF, PDFBookingData } from './pdfGenerator.js';

function getTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || process.env.EMAIL_USER || process.env.MAIL_USER || process.env.ADMIN_ALERT_EMAIL;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.MAIL_PASS || process.env.EMAIL_PASSWORD;

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

export async function sendAdminBookingNotificationEmail(booking: PDFBookingData, pdfBuffer: Buffer | null, baseUrl: string = 'http://localhost:4000'): Promise<boolean> {
  const adminRecipient = process.env.ADMIN_ALERT_EMAIL || 'garvitmadan511@gmail.com';
  const pdfDownloadUrl = `${baseUrl}/api/bookings/${booking.id}/pdf`;

  // 1. Try EmailJS REST API if configured
  const serviceId = process.env.EMAILJS_SERVICE_ID || process.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID || process.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY || process.env.VITE_EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (serviceId && templateId && publicKey && !serviceId.includes('xxxxxxx') && !publicKey.includes('your_public')) {
    try {
      const payload = {
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        ...(privateKey ? { accessToken: privateKey } : {}),
        template_params: {
          to_name: 'Admin / Owner',
          to_email: adminRecipient,
          email: adminRecipient,
          customer_name: booking.customerName,
          customer_phone: `+91 ${booking.customerPhone}`,
          customer_email: booking.customerEmail,
          phone: `+91 ${booking.customerPhone}`,
          model_name: `${booking.modelName} (${booking.storageGb}GB)`,
          address: booking.address,
          pickup_date: booking.pickupDate,
          time_slot: booking.pickupTimeSlot,
          payment_method: 'INSTANT DOORSIDE PAYOUT (UPI / BANK TRANSFER)',
          payout_amount: `₹${booking.finalPrice.toLocaleString('en-IN')}`,
          confirmation_id: booking.id,
          pdf_url: pdfDownloadUrl,
          subject: `🔔 [NEW BOOKING] #${booking.id} - ${booking.customerName} (${booking.modelName})`,
        },
      };

      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log(`[Booking Mailer] EmailJS admin notification sent to ${adminRecipient}`);
      }
    } catch (err) {
      console.warn('[Booking Mailer] EmailJS admin alert failed:', err);
    }
  }

  // 2. Try Nodemailer SMTP if configured
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[Booking Mailer] SMTP credentials not set. Admin alert ready for ${adminRecipient}. Booking #${booking.id}`);
    return true;
  }

  const defectListHtml = booking.defectDescriptions && booking.defectDescriptions.length > 0
    ? booking.defectDescriptions.join(', ')
    : 'Flawless / No reported defects';

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #0f172a; border: 1px solid #334155; border-radius: 12px; overflow: hidden; color: #f8fafc;">
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 24px; text-align: center; border-bottom: 1px solid #334155;">
        <span style="display: inline-block; padding: 4px 14px; background-color: #10b981; color: #ffffff; font-weight: bold; font-size: 11px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">🔔 NEW BOOKING CONFIRMED</span>
        <h1 style="color: #ffffff; margin: 4px 0 0 0; font-size: 22px; font-weight: bold;">Rephonix Admin Booking Alert</h1>
        <p style="color: #93c5fd; margin: 4px 0 0 0; font-size: 13px;">Booking ID: #${booking.id}</p>
      </div>

      <div style="padding: 24px; background-color: #1e293b;">
        <p style="font-size: 14px; color: #cbd5e1; margin-top: 0;">A new device trade-in pickup booking has been successfully confirmed. Full details are below:</p>

        <!-- CUSTOMER DETAILS -->
        <div style="margin-bottom: 20px; background-color: #0f172a; padding: 16px; border-radius: 8px; border: 1px solid #334155;">
          <h3 style="margin: 0 0 12px 0; font-size: 13px; font-weight: bold; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px;">👤 Customer & Contact Details</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #e2e8f0;">
            <tr>
              <td style="padding: 6px 0; color: #94a3b8; width: 140px;">Customer Name:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #f8fafc;">${booking.customerName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Phone Number:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #38bdf8;"><a href="tel:${booking.customerPhone}" style="color: #38bdf8; text-decoration: none;">+91 ${booking.customerPhone}</a></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Email Address:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #f8fafc;"><a href="mailto:${booking.customerEmail}" style="color: #f8fafc; text-decoration: underline;">${booking.customerEmail}</a></td>
            </tr>
          </table>
        </div>

        <!-- PICKUP SCHEDULE & ADDRESS -->
        <div style="margin-bottom: 20px; background-color: #0f172a; padding: 16px; border-radius: 8px; border: 1px solid #334155;">
          <h3 style="margin: 0 0 12px 0; font-size: 13px; font-weight: bold; color: #fbbf24; text-transform: uppercase; letter-spacing: 0.5px;">📅 Scheduled Pickup & Address</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #e2e8f0;">
            <tr>
              <td style="padding: 6px 0; color: #94a3b8; width: 140px;">Scheduled Date:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #fbbf24;">${booking.pickupDate}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Time Window:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #f8fafc;">${booking.pickupTimeSlot}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8; vertical-align: top;">Pickup Address:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #f8fafc; line-height: 1.4;">${booking.address}</td>
            </tr>
          </table>
        </div>

        <!-- DEVICE & PAYOUT DETAILS -->
        <div style="margin-bottom: 20px; background-color: #0f172a; padding: 16px; border-radius: 8px; border: 1px solid #334155;">
          <h3 style="margin: 0 0 12px 0; font-size: 13px; font-weight: bold; color: #4ade80; text-transform: uppercase; letter-spacing: 0.5px;">📱 Device & Valuation Details</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #e2e8f0;">
            <tr>
              <td style="padding: 6px 0; color: #94a3b8; width: 140px;">Device Model:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #f8fafc;">${booking.modelName} (${booking.storageGb}GB)</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8; vertical-align: top;">Reported Condition:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #cbd5e1; line-height: 1.4;">${defectListHtml}</td>
            </tr>
            <tr style="border-top: 1px solid #334155;">
              <td style="padding: 10px 0 4px 0; font-weight: bold; color: #94a3b8; font-size: 14px;">Agreed Payout:</td>
              <td style="padding: 10px 0 4px 0; font-weight: bold; color: #4ade80; font-size: 20px;">₹${booking.finalPrice.toLocaleString('en-IN')}</td>
            </tr>
          </table>
        </div>

        <!-- ACTION BUTTON -->
        <div style="text-align: center; margin: 24px 0 8px 0;">
          <a href="${pdfDownloadUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">📄 Download PDF Quotation</a>
        </div>
      </div>

      <div style="background-color: #0f172a; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #334155;">
        <p style="margin: 0;">Rephonix Admin System Alert &bull; Confidential Internal Notification</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Rephonix System" <${process.env.SMTP_USER || process.env.EMAIL_USER || 'no-reply@rephonix.in'}>`,
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

  // 2. Try EmailJS REST API if configured for Customer
  const serviceId = process.env.EMAILJS_SERVICE_ID || process.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID || process.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY || process.env.VITE_EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (serviceId && templateId && publicKey && !serviceId.includes('xxxxxxx') && !publicKey.includes('your_public')) {
    try {
      const payload = {
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        ...(privateKey ? { accessToken: privateKey } : {}),
        template_params: {
          to_name: booking.customerName,
          to_email: recipientEmail,
          email: recipientEmail,
          phone: `+91 ${booking.customerPhone}`,
          model_name: `${booking.modelName} (${booking.storageGb}GB)`,
          address: booking.address,
          pickup_date: booking.pickupDate,
          time_slot: booking.pickupTimeSlot,
          payment_method: 'INSTANT DOORSIDE PAYOUT (UPI / BANK TRANSFER)',
          payout_amount: `₹${booking.finalPrice.toLocaleString('en-IN')}`,
          confirmation_id: booking.id,
          pdf_url: pdfDownloadUrl,
        },
      };

      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log(`[Booking Mailer] EmailJS confirmation sent to ${recipientEmail}`);
      }
    } catch (err) {
      console.warn('[Booking Mailer] EmailJS call failed:', err);
    }
  }

  // 3. Try Nodemailer SMTP if configured for Customer
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
        <p style="font-size: 15px; color: #1e293b; margin-top: 0;">Dear <strong>${booking.customerName}</strong>,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.5;">Your trade-in booking has been successfully confirmed! Below are your locked quotation details and doorstep pickup schedule.</p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 18px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Booking ID:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #1e3a8a; text-align: right;">#${booking.id}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Device Model:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #0f172a; text-align: right;">${booking.modelName} (${booking.storageGb}GB)</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Pickup Address:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #0f172a; text-align: right;">${booking.address}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Scheduled Date:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #0f172a; text-align: right;">${booking.pickupDate}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Time Window:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #0f172a; text-align: right;">${booking.pickupTimeSlot}</td>
            </tr>
            <tr style="border-top: 1px solid #cbd5e1;">
              <td style="padding: 10px 0 4px 0; font-weight: bold; color: #0f172a; font-size: 14px;">Instant Doorside Payout:</td>
              <td style="padding: 10px 0 4px 0; font-weight: bold; color: #1e3a8a; font-size: 18px; text-align: right;">₹${booking.finalPrice.toLocaleString('en-IN')}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 14px; margin-bottom: 24px; text-align: center;">
          <p style="margin: 0; font-size: 13px; color: #065f46; font-weight: bold;">⚡ Instant Doorside Payout (UPI / Bank Transfer)</p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #047857;">Our agent will call you prior to arrival. Payout is transferred instantly at your doorstep after device check.</p>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${pdfDownloadUrl}" style="background-color: #1e3a8a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">📄 Download Official PDF Quotation</a>
        </div>
      </div>

      <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0;">Rephonix — Secure Smartphone Trade-In Network</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Rephonix" <${process.env.SMTP_USER || process.env.EMAIL_USER || 'no-reply@rephonix.in'}>`,
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
    ? data.defects.join(', ')
    : 'All hardware & screen diagnostics passed (Mint Condition / No Defects)';

  // 1. Try EmailJS REST API if configured
  const serviceId = process.env.EMAILJS_SERVICE_ID || process.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID || process.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY || process.env.VITE_EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (serviceId && templateId && publicKey && !serviceId.includes('xxxxxxx') && !publicKey.includes('your_public')) {
    try {
      const payload = {
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        ...(privateKey ? { accessToken: privateKey } : {}),
        template_params: {
          to_name: 'Admin / Owner',
          to_email: adminRecipient,
          email: adminRecipient,
          customer_name: data.customerName,
          customer_phone: `+91 ${data.customerPhone}`,
          customer_email: data.customerEmail,
          phone: `+91 ${data.customerPhone}`,
          model_name: `${data.modelName} (${data.storageGb >= 1024 ? '1TB' : data.storageGb + 'GB'})`,
          payout_amount: formattedPayout,
          ref_code: data.refCode || 'SCH-QUOTE',
          subject: `📊 [QUOTE GENERATED] ${data.modelName} - ${data.customerName} (${formattedPayout})`,
        },
      };

      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log(`[Quote Mailer] EmailJS quote alert sent to ${adminRecipient}`);
      }
    } catch (err) {
      console.warn('[Quote Mailer] EmailJS quote alert failed:', err);
    }
  }

  // 2. Try Nodemailer SMTP if configured
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[Quote Mailer] SMTP credentials not set. Quote alert ready for ${adminRecipient}: ${data.modelName} by ${data.customerName} (${formattedPayout})`);
    return true;
  }

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #0f172a; border: 1px solid #334155; border-radius: 12px; overflow: hidden; color: #f8fafc;">
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 24px; text-align: center; border-bottom: 1px solid #334155;">
        <span style="display: inline-block; padding: 4px 14px; background-color: #3b82f6; color: #ffffff; font-weight: bold; font-size: 11px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">📊 DIAGNOSTIC QUOTE GENERATED</span>
        <h1 style="color: #ffffff; margin: 4px 0 0 0; font-size: 22px; font-weight: bold;">Rephonix Trade-In Quote Alert</h1>
        <p style="color: #93c5fd; margin: 4px 0 0 0; font-size: 13px;">Reference Code: ${data.refCode || 'SCH-QUOTE'}</p>
      </div>

      <div style="padding: 24px; background-color: #1e293b;">
        <p style="font-size: 14px; color: #cbd5e1; margin-top: 0;">A logged-in user completed diagnostic evaluation and generated a trade-in quote:</p>

        <!-- CUSTOMER DETAILS -->
        <div style="margin-bottom: 20px; background-color: #0f172a; padding: 16px; border-radius: 8px; border: 1px solid #334155;">
          <h3 style="margin: 0 0 12px 0; font-size: 13px; font-weight: bold; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px;">👤 Logged-In Customer Details</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #e2e8f0;">
            <tr>
              <td style="padding: 6px 0; color: #94a3b8; width: 140px;">Customer Name:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #f8fafc;">${data.customerName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Phone Number:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #38bdf8;"><a href="tel:${data.customerPhone}" style="color: #38bdf8; text-decoration: none;">+91 ${data.customerPhone}</a></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Email Address:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #f8fafc;"><a href="mailto:${data.customerEmail}" style="color: #f8fafc; text-decoration: underline;">${data.customerEmail}</a></td>
            </tr>
          </table>
        </div>

        <!-- TARGET DEVICE & ESTIMATED PAYOUT -->
        <div style="margin-bottom: 20px; background-color: #0f172a; padding: 16px; border-radius: 8px; border: 1px solid #334155;">
          <h3 style="margin: 0 0 12px 0; font-size: 13px; font-weight: bold; color: #4ade80; text-transform: uppercase; letter-spacing: 0.5px;">📱 Target Device & Valuation</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #e2e8f0;">
            <tr>
              <td style="padding: 6px 0; color: #94a3b8; width: 140px;">Target Device:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #f8fafc;">${data.modelName} (${data.storageGb >= 1024 ? '1TB' : data.storageGb + 'GB'})</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Value Retained:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #fbbf24;">${data.retentionPercentage}% Value Retained</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8; vertical-align: top;">Diagnostic Audit:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #cbd5e1; line-height: 1.4;">${defectText}</td>
            </tr>
            <tr style="border-top: 1px solid #334155;">
              <td style="padding: 10px 0 4px 0; font-weight: bold; color: #94a3b8; font-size: 14px;">Estimated Payout:</td>
              <td style="padding: 10px 0 4px 0; font-weight: bold; color: #4ade80; font-size: 22px;">${formattedPayout}</td>
            </tr>
          </table>
        </div>
      </div>

      <div style="background-color: #0f172a; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #334155;">
        <p style="margin: 0;">Rephonix Diagnostic Engine Alert &bull; Confidential Customer Lead Notification</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Rephonix System" <${process.env.SMTP_USER || process.env.EMAIL_USER || 'no-reply@rephonix.in'}>`,
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


