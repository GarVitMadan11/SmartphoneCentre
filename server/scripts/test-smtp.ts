import 'dotenv/config';
import nodemailer from 'nodemailer';

async function testSmtpConnection() {
  console.log('\n📧 --- TESTING SMTP SERVER CONNECTION ---');
  const host = process.env.SECURITY_SMTP_HOST || process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SECURITY_SMTP_PORT || process.env.SMTP_PORT || '587', 10);
  const user = process.env.SECURITY_SMTP_USER || process.env.SECURITY_EMAIL_USER || process.env.SMTP_USER || process.env.EMAIL_USER || process.env.SMTP_USERNAME || process.env.MAIL_USER || process.env.ADMIN_ALERT_EMAIL || 'garvitmadan511@gmail.com';
  const pass = process.env.SECURITY_SMTP_PASS || process.env.SECURITY_EMAIL_PASS || process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.SMTP_PASSWORD || process.env.MAIL_PASS || process.env.EMAIL_PASSWORD;
  const recipient = process.env.ADMIN_ALERT_EMAIL || 'garvitmadan511@gmail.com';

  console.log(`• SMTP Host: ${host}`);
  console.log(`• SMTP Port: ${port}`);
  console.log(`• SMTP User: ${user || '(not set)'}`);
  console.log(`• Recipient: ${recipient}`);

  if (!user || !pass) {
    console.error('\n❌ ERROR: SMTP_USER and SMTP_PASS are not set in server/.env!');
    console.error('Please configure SMTP_USER and SMTP_PASS and try again.');
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  try {
    console.log('\n⏳ Verifying SMTP server credentials...');
    await transporter.verify();
    console.log('✅ SMTP Server Connection Successful!');

    console.log(`\n⏳ Sending test email to ${recipient}...`);
    const info = await transporter.sendMail({
      from: `"Rephonix Security Shield" <${user}>`,
      to: recipient,
      subject: '✅ [TEST] Rephonix SMTP Configuration Verification',
      html: `
        <div style="font-family: sans-serif; padding: 20px; background-color: #0f172a; color: #ffffff; border-radius: 8px;">
          <h2 style="color: #10b981;">SMTP Connection Verified!</h2>
          <p>Your SMTP mail server is correctly configured for <strong>Rephonix</strong>.</p>
          <p>Security alerts and admin notifications will be delivered to <code>${recipient}</code>.</p>
          <hr style="border-color: #334155; margin: 20px 0;" />
          <p style="font-size: 12px; color: #94a3b8;">Sent on ${new Date().toLocaleString('en-IN')}</p>
        </div>
      `,
    });

    console.log(`🎉 Test email sent successfully! Message ID: ${info.messageId}`);
    console.log(`Check inbox at ${recipient}.\n`);
  } catch (err: any) {
    console.error('\n❌ SMTP Test Failed:', err.message || err);
    console.error('Make sure your App Password or SMTP credentials are valid.\n');
  }
}

testSmtpConnection();
