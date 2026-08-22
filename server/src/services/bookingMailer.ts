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

  // 2. Try EmailJS REST API if configured
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

  // 3. Try Nodemailer SMTP if configured
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
