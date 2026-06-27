const fs = require('fs');
const PDFDocument = require('pdfkit');

const doc = new PDFDocument({ margin: 50 });
const writeStream = fs.createWriteStream('SmartphoneCentre_UI_UX_Audit.pdf');
doc.pipe(writeStream);

// Styles
const fontTitle = 'Helvetica-Bold';
const fontSubtitle = 'Helvetica-Bold';
const fontBody = 'Helvetica';
const fontMono = 'Courier';

// Header
doc.fontSize(22).font(fontTitle).fillColor('#0A2540').text('SmartphoneCentre', { align: 'left' });
doc.fontSize(10).font(fontMono).fillColor('#1D4ED8').text('DESIGN SYSTEM & UI/UX AUDIT REPORT', { align: 'left' });
doc.moveDown(1.5);

// Horizontal Line
doc.moveTo(50, doc.y).lineTo(562, doc.y).strokeColor('#E2E8F0').stroke();
doc.moveDown(1.5);

// Executive Summary
doc.fontSize(14).font(fontSubtitle).fillColor('#0A2540').text('1. First Impression & Trust Vector');
doc.moveDown(0.5);
doc.fontSize(10).font(fontBody).fillColor('#1E293B').text(
  'The SmartphoneCentre UI presents a modern, high-contrast visual interface. However, visual and structural inconsistencies exist that prevent the application from matching high-trust transaction standards (e.g. Apple or Stripe). High-priority challenges include the layout of forms in the scheduling flow, accessibility targets (contrast), and inconsistent typographic scales.',
  { align: 'justify', paragraphGap: 10 }
);
doc.moveDown(1.5);

// Scores Table
doc.fontSize(14).font(fontSubtitle).fillColor('#0A2540').text('2. Core Quality Scoring');
doc.moveDown(0.5);

const scores = [
  { name: 'Visual Design', score: '7 / 10' },
  { name: 'User Experience (UX)', score: '5 / 10' },
  { name: 'Accessibility (WCAG)', score: '4 / 10' },
  { name: 'Consistency', score: '6 / 10' },
  { name: 'Trust Vector', score: '4 / 10' },
  { name: 'Overall Polish', score: '5.5 / 10' }
];

scores.forEach(s => {
  doc.fontSize(10).font(fontSubtitle).fillColor('#0F172A').text(s.name, { continued: true });
  doc.font(fontBody).fillColor('#64748B').text(`: ${s.score}`, { indent: 150 });
});
doc.moveDown(2);

// UI Recommendations
doc.fontSize(14).font(fontSubtitle).fillColor('#0A2540').text('3. Primary UI & Layout Remediations');
doc.moveDown(0.5);

const uiRecommendations = [
  '• Remove local file path references (file:///) in App.tsx navigation panels.',
  '• Elevate flat cards by adding subtle glassmorphic container drop shadows.',
  '• Boost color contrast of step subheaders (zinc-500 -> zinc-600) to meet WCAG AA.',
  '• Standardize checkmarks (avoid red checkmarks on accessories step to prevent error confusion).',
  '• Debounce model search input by 150ms to prevent browser rendering lag.'
];

uiRecommendations.forEach(rec => {
  doc.fontSize(9.5).font(fontBody).fillColor('#334155').text(rec, { paragraphGap: 4 });
});
doc.moveDown(1.5);

// UX Recommendations
doc.fontSize(14).font(fontSubtitle).fillColor('#0A2540').text('4. Primary UX Flow Remediations');
doc.moveDown(0.5);

const uxRecommendations = [
  '• Refactor the scheduler form: split the long single page layout into a 3-step wizard.',
  '• Mandate selection of either a defect or the "All Good" confirmation card before next-step click.',
  '• Add interactive tooltips for IMEI inputs demonstrating standard dial options (*#06#).',
  '• Retain session state using localStorage to prevent input wipes during reloads.',
  '• Integrate real-time price updates dynamically into the schedule summary panel.'
];

uxRecommendations.forEach(rec => {
  doc.fontSize(9.5).font(fontBody).fillColor('#334155').text(rec, { paragraphGap: 4 });
});

// Final Overview Page
doc.addPage();
doc.fontSize(14).font(fontSubtitle).fillColor('#0A2540').text('5. Competitive Benchmark Summary');
doc.moveDown(0.8);

doc.fontSize(10).font(fontSubtitle).fillColor('#1E293B').text('Versus Market Leaders (Apple, Stripe, Cashify)');
doc.fontSize(9.5).font(fontBody).fillColor('#334155').text(
  'Currently, the application matches competitor visual styling but falls behind in customer trust vectors. Providing price breakdown transparency (showing how deductions apply) and security badges on payment pages will help surpass the conversion rates of local operators.',
  { paragraphGap: 10 }
);

doc.font(fontSubtitle).text('Compliance Status');
doc.font(fontBody).text(
  '- WCAG Contrast Guidelines: Non-Compliant on subtext colors.\n' +
  '- Target Size Target: Needs adjustment for buttons on mobile formats.\n' +
  '- Keyboard Friendliness: Custom select buttons lack sequential tabIndex indexing.',
  { paragraphGap: 10 }
);

doc.end();
console.log('UI/UX PDF compiled successfully.');
