from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageTemplate,
    Paragraph,
    Spacer,
    ListFlowable,
    ListItem,
    PageBreak,
)

OUTPUT_PATH = r"f:\SmartphoneCentre\SmartphoneCentre_Implementation_Plan.pdf"


def page_decor(canvas, doc):
    canvas.saveState()
    width, height = letter
    canvas.setStrokeColor(colors.HexColor("#d6dde8"))
    canvas.setLineWidth(0.6)
    canvas.line(doc.leftMargin, height - 0.6 * inch, width - doc.rightMargin, height - 0.6 * inch)
    canvas.line(doc.leftMargin, 0.6 * inch, width - doc.rightMargin, 0.6 * inch)
    canvas.setFont("Helvetica", 9)
    canvas.setFillColor(colors.HexColor("#5b6575"))
    canvas.drawString(doc.leftMargin, height - 0.45 * inch, "SmartphoneCentre")
    canvas.drawRightString(width - doc.rightMargin, height - 0.45 * inch, "Implementation Plan")
    canvas.drawString(doc.leftMargin, 0.4 * inch, "Prepared for startup launch planning")
    canvas.drawRightString(width - doc.rightMargin, 0.4 * inch, f"Page {doc.page}")
    canvas.restoreState()


def bullet_list(items, styles):
    return ListFlowable(
        [ListItem(Paragraph(item, styles["BodyText"]), leftIndent=12) for item in items],
        bulletType="bullet",
        start="circle",
        leftIndent=18,
    )


def build_pdf():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name="TitleCustom",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=30,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=12,
    ))
    styles.add(ParagraphStyle(
        name="SubtitleCustom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor("#475569"),
        alignment=TA_LEFT,
        spaceAfter=16,
    ))
    styles.add(ParagraphStyle(
        name="SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=10,
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        name="BodyCustom",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#1e293b"),
        spaceAfter=6,
    ))

    doc = BaseDocTemplate(
        OUTPUT_PATH,
        pagesize=letter,
        leftMargin=0.8 * inch,
        rightMargin=0.8 * inch,
        topMargin=0.95 * inch,
        bottomMargin=0.9 * inch,
    )

    frame = Frame(
        doc.leftMargin,
        doc.bottomMargin,
        doc.width,
        doc.height,
        id="normal",
    )
    doc.addPageTemplates([PageTemplate(id="plan", frames=[frame], onPage=page_decor)])

    story = []
    story.append(Paragraph("SmartphoneCentre Implementation Plan", styles["TitleCustom"]))
    story.append(Paragraph(
        "Date: 2026-07-21 | Scope: convert the current prototype into a production-ready startup website and operations platform.",
        styles["SubtitleCustom"],
    ))

    sections = [
        (
            "1. Stabilize the product foundation",
            [
                "Choose one active frontend entrypoint and retire or consolidate the duplicate <b>reliable-exchange</b> app.",
                "Define the startup scope clearly: trade-in only, storefront only, or a unified platform.",
                "Separate demo assets, prototype data, and production code paths so the repository has one clear source of truth.",
            ],
        ),
        (
            "2. Fix security and trust first",
            [
                "Replace the client-side admin PIN with proper authentication and role-based authorization.",
                "Add server-side validation for every booking, model, and admin update route.",
                "Put rate limiting, stricter CORS, request-size limits, and audit logs in front of the API.",
                "Move sensitive submission and notification logic from the browser into the backend.",
            ],
        ),
        (
            "3. Harden the data layer",
            [
                "Move the production database from SQLite to Postgres.",
                "Add constraints, indexes, and migration discipline for models and bookings.",
                "Store structured operational data in normalized tables instead of JSON where it matters.",
                "Add backup and restore procedures before launch.",
            ],
        ),
        (
            "4. Turn the UI into a real startup site",
            [
                "Create a full landing page with a strong hero, benefits, process explanation, FAQs, testimonials, and CTA blocks.",
                "Refine the design system: typography hierarchy, spacing scale, buttons, cards, and responsive rules.",
                "Improve the mobile booking flow with sticky summaries, better step progress, and clearer validation states.",
                "Make empty, loading, error, and success states feel intentional across the app.",
            ],
        ),
        (
            "5. Make the product operational",
            [
                "Add a real booking lifecycle and audit trail for admin actions.",
                "Move email/SMS notifications to the backend and wire in environment-based secrets.",
                "Add analytics for funnel drop-off, booking completion, and admin throughput.",
                "Create SEO pages for services, locations, and device categories.",
            ],
        ),
        (
            "6. Add quality gates before launch",
            [
                "Write tests for valuation logic, booking validation, and admin status updates.",
                "Add lint, typecheck, and build steps to CI.",
                "Run accessibility, performance, and cross-device checks before deployment.",
                "Review security headers and production deployment settings before public release.",
            ],
        ),
        (
            "Recommended execution order",
            [
                "Phase 1: security and backend hardening.",
                "Phase 2: database and workflow stability.",
                "Phase 3: UI redesign and marketing pages.",
                "Phase 4: testing, analytics, and launch readiness.",
            ],
        ),
    ]

    for heading, items in sections:
        story.append(Paragraph(heading, styles["SectionHeading"]))
        story.append(bullet_list(items, styles))
        story.append(Spacer(1, 0.08 * inch))

    story.append(PageBreak())
    story.append(Paragraph("Why these changes matter", styles["SectionHeading"]))
    story.append(Paragraph(
        "The current codebase is a strong prototype, but a startup launch needs trust, reliability, and operational control. The biggest risk is the current security model: the admin area is still client-gated, and the API has no true server-side authorization. The biggest product opportunity is turning the existing diagnostic flow into a polished conversion funnel with a credible landing experience.",
        styles["BodyCustom"],
    ))
    story.append(Paragraph(
        "If you want, this PDF can be followed by a build checklist, sprint plan, or investor-ready product roadmap.",
        styles["BodyCustom"],
    ))

    doc.build(story)


if __name__ == "__main__":
    build_pdf()
    print(OUTPUT_PATH)
