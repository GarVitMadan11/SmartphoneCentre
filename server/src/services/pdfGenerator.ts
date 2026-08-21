import PDFDocument from 'pdfkit';
import { formatPrice } from '../utils/formatters.js';

export interface PDFBookingData {
  id: string;
  modelName: string;
  storageGb: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: string;
  pickupDate: string;
  pickupTimeSlot: string;
  finalPrice: number;
  defectDescriptions?: string[];
  dateCreated: string;
}

export function generateBookingQuotationPDF(booking: PDFBookingData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err: Error) => reject(err));

      // Brand Header
      doc
        .fillColor('#1E3A8A')
        .fontSize(22)
        .font('Helvetica-Bold')
        .text('SMARTPHONECENTRE', 40, 40);

      doc
        .fillColor('#64748B')
        .fontSize(10)
        .font('Helvetica')
        .text('OFFICIAL TRADE-IN QUOTATION RECEIPT', 40, 68);

      // Top right Metadata Box
      doc
        .fillColor('#0F172A')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(`Booking ID: #${booking.id}`, 380, 40, { align: 'right' })
        .font('Helvetica')
        .fillColor('#64748B')
        .text(`Date Issued: ${new Date(booking.dateCreated || Date.now()).toLocaleDateString('en-IN')}`, 380, 56, { align: 'right' });

      doc
        .moveTo(40, 88)
        .lineTo(555, 88)
        .strokeColor('#E2E8F0')
        .lineWidth(1)
        .stroke();

      let y = 105;

      // Customer Details Section
      doc
        .fillColor('#1E3A8A')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('1. CLIENT CONTACT INFORMATION', 40, y);

      y += 20;

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#334155')
        .text('Name:', 40, y)
        .font('Helvetica')
        .fillColor('#0F172A')
        .text(booking.customerName, 130, y);

      y += 18;

      doc
        .font('Helvetica-Bold')
        .fillColor('#334155')
        .text('Mobile Phone:', 40, y)
        .font('Helvetica')
        .fillColor('#0F172A')
        .text(`+91 ${booking.customerPhone}`, 130, y);

      y += 18;

      doc
        .font('Helvetica-Bold')
        .fillColor('#334155')
        .text('Email Address:', 40, y)
        .font('Helvetica')
        .fillColor('#0F172A')
        .text(booking.customerEmail, 130, y);

      y += 30;

      // Device & Schedule Details
      doc
        .fillColor('#1E3A8A')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('2. DEVICE & DOORSTEP PICKUP DETAILS', 40, y);

      y += 20;

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#334155')
        .text('Device Model:', 40, y)
        .font('Helvetica')
        .fillColor('#0F172A')
        .text(`${booking.modelName} (${booking.storageGb}GB)`, 150, y);

      y += 18;

      doc
        .font('Helvetica-Bold')
        .fillColor('#334155')
        .text('Pickup Address:', 40, y)
        .font('Helvetica')
        .fillColor('#0F172A')
        .text(booking.address, 150, y, { width: 360 });

      y += doc.heightOfString(booking.address, { width: 360 }) + 6;

      doc
        .font('Helvetica-Bold')
        .fillColor('#334155')
        .text('Scheduled Date:', 40, y)
        .font('Helvetica')
        .fillColor('#0F172A')
        .text(booking.pickupDate, 150, y);

      y += 18;

      doc
        .font('Helvetica-Bold')
        .fillColor('#334155')
        .text('Time Window:', 40, y)
        .font('Helvetica')
        .fillColor('#0F172A')
        .text(booking.pickupTimeSlot, 150, y);

      y += 30;

      // Valuation Summary Table
      doc
        .fillColor('#1E3A8A')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('3. TRADE-IN VALUATION BREAKDOWN', 40, y);

      y += 20;

      // Table Header Background
      doc
        .rect(40, y, 515, 24)
        .fill('#F1F5F9');

      doc
        .fillColor('#1E293B')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Item Description', 50, y + 7)
        .text('Amount (INR)', 440, y + 7, { align: 'right' });

      y += 24;

      // Row 1: Valuation Price
      doc
        .rect(40, y, 515, 22)
        .fill('#FFFFFF');

      doc
        .fillColor('#334155')
        .fontSize(9.5)
        .font('Helvetica')
        .text(`Locked Valuation Quote (${booking.modelName})`, 50, y + 6)
        .font('Helvetica-Bold')
        .fillColor('#0F172A')
        .text(formatPrice(booking.finalPrice), 440, y + 6, { align: 'right' });

      y += 22;

      // Row 2: Inspection Fee
      doc
        .rect(40, y, 515, 22)
        .fill('#F8FAFC');

      doc
        .fillColor('#334155')
        .fontSize(9.5)
        .font('Helvetica')
        .text('Doorstep Inspection & Pickup Fee', 50, y + 6)
        .font('Helvetica-Bold')
        .fillColor('#059669')
        .text('FREE (₹0)', 440, y + 6, { align: 'right' });

      y += 22;

      // Defects summary if any
      if (booking.defectDescriptions && booking.defectDescriptions.length > 0) {
        doc
          .rect(40, y, 515, 22)
          .fill('#FFFFFF');

        doc
          .fillColor('#334155')
          .fontSize(9.5)
          .font('Helvetica')
          .text(`Declared Defects (${booking.defectDescriptions.length} item(s) noted)`, 50, y + 6)
          .font('Helvetica')
          .fillColor('#64748B')
          .text('Included in Quote', 440, y + 6, { align: 'right' });

        y += 22;
      }

      // Total Locked Box
      doc
        .rect(40, y, 515, 34)
        .fill('#1E3A8A');

      doc
        .fillColor('#FFFFFF')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('INSTANT DOORSIDE PAYOUT:', 50, y + 10)
        .fontSize(14)
        .text(formatPrice(booking.finalPrice), 430, y + 8, { align: 'right' });

      y += 50;

      // Payout Method Banner
      doc
        .rect(40, y, 515, 45)
        .fillAndStroke('#ECFDF5', '#A7F3D0');

      doc
        .fillColor('#065F46')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('PAYOUT MODE: INSTANT DOORSIDE TRANSFER (UPI / BANK TRANSFER)', 50, y + 10)
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor('#047857')
        .text('Payment will be transferred instantly to your account after physical device verification at your doorstep.', 50, y + 25);

      y += 65;

      // Terms & Footer
      doc
        .fillColor('#94A3B8')
        .fontSize(8)
        .font('Helvetica')
        .text('Terms & Conditions: Quote is valid for 7 days. Device must match the declared conditions upon physical inspection. Agent will contact you prior to arrival.', 40, y, { width: 515, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
