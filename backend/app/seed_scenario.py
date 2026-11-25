import os
import hashlib
import json
import datetime
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import docx
import openpyxl
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

from app.config import SAMPLES_DIR, UPLOAD_DIR
from app.database import SessionLocal, engine, Base
from app import models
from app.services.multimodal_extractor import process_file_multimodal
from app.services.entity_resolver import extract_entities_from_text, normalize_entity_name
from app.services.contradiction_engine import extract_structured_claims, detect_conflicts_between_claims
from app.services.reliability_engine import evaluate_evidence_reliability
from app.services.report_generator import build_investigation_markdown_and_data, generate_pdf_report

def create_sample_files_on_disk():
    """Generates the four real physical sample evidence files in SAMPLES_DIR."""
    SAMPLES_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Document 1: Government Report (PDF)
    pdf_path = SAMPLES_DIR / "Doc1_Government_Delivery_Report.pdf"
    if not pdf_path.exists():
        doc = SimpleDocTemplate(str(pdf_path), pagesize=letter)
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'GovTitle', parent=styles['Normal'],
            fontName='Helvetica-Bold', fontSize=16, leading=20,
            textColor=colors.HexColor("#001f54")
        )
        body = ParagraphStyle('GovBody', parent=styles['Normal'], fontSize=10, leading=14)

        story = [
            Paragraph("MINISTRY OF HEALTH & FEDERAL MEDICAL RESERVE", title_style),
            Paragraph("EXECUTIVE PROJECT CLOSURE REPORT - OPERATION SAFEGUARD", styles['Normal']),
            Spacer(1, 15),
            Paragraph("<b>Case Reference:</b> MED-SUPPLY-2026-X | <b>Date:</b> March 15, 2026", body),
            Paragraph("<b>Author:</b> Director Sarah Lin | <b>Organization:</b> Ministry of Health", body),
            Paragraph("<b>Location:</b> Regional Hub Alpha", body),
            Spacer(1, 12),
            Paragraph("<b>1. EXECUTIVE SUMMARY:</b>", styles['Normal']),
            Paragraph(
                "Under emergency procurement mandate 44-B, the Department coordinated the distribution of "
                "vital frontline equipment. According to ministerial procurement records, <b>1000 medical kits were delivered</b> "
                "to Regional Hub Alpha for immediate deployment to regional triage centers. "
                "The delivery was recorded as officially completed under the supervision of Director Sarah Lin.",
                body
            ),
            Spacer(1, 10),
            Paragraph("Status: Full delivery completed. Total units accounted: 1000 medical kits.", body)
        ]
        doc.build(story)

    # 2. Document 2: Scanned Delivery Receipt (PNG image + companion text)
    img_path = SAMPLES_DIR / "Doc2_Delivery_Receipt_Scanned.png"
    txt_companion = SAMPLES_DIR / "Doc2_Delivery_Receipt_Scanned.txt"
    receipt_text = (
        "DELIVERY RECEIPT & PHYSICAL DOCK INTAKE SLIP\n"
        "RECEIVING DOCK: Regional Hub Alpha, Bay 4\n"
        "DATE: March 16, 2026\n"
        "CARRIER: Apex Logistics (Truck #TRK-882)\n"
        "MANIFEST NOTE: Carrier delivered pallets at 09:30 AM.\n"
        "PHYSICAL COUNT: 800 medical kits were received.\n"
        "REMARKS: Pallet count short of manifest estimate. 800 kits received in good condition.\n"
        "SIGNATURE: Inspector Marcus Vance\n"
        "BADGE ID: REC-DOCK-8849\n"
        "STATUS: Verified received count: 800 kits."
    )
    if not txt_companion.exists():
        txt_companion.write_text(receipt_text, encoding="utf-8")

    if not img_path.exists():
        # Create visual scanned slip image
        img = Image.new('RGB', (800, 600), color=(250, 250, 248))
        d = ImageDraw.Draw(img)
        # Draw border
        d.rectangle([(20, 20), (780, 580)], outline=(180, 180, 180), width=2)
        d.rectangle([(25, 25), (775, 575)], outline=(220, 220, 220), width=1)
        # Header banner
        d.rectangle([(30, 30), (770, 80)], fill=(230, 235, 245))
        d.text((45, 45), "OFFICIAL DOCK RECEIPT - REGIONAL HUB ALPHA", fill=(10, 30, 80))
        
        # Draw lines of text
        y = 100
        for line in receipt_text.splitlines():
            d.text((50, y), line, fill=(30, 35, 45))
            y += 30

        # Draw stamp
        d.rectangle([(450, 420), (720, 520)], outline=(180, 40, 40), width=3)
        d.text((470, 440), "PHYSICALLY VERIFIED", fill=(180, 40, 40))
        d.text((470, 465), "COUNT: 800 RECEIVED", fill=(180, 40, 40))
        d.text((470, 490), "OFFICER M. VANCE", fill=(180, 40, 40))
        img.save(str(img_path))

    # 3. Document 3: Excel Spreadsheet Inventory Audit (XLSX)
    xlsx_path = SAMPLES_DIR / "Doc3_Inventory_Audit_Log.xlsx"
    if not xlsx_path.exists():
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Q1_Supply_Audit"
        headers = ["Asset_ID", "Item_Category", "Location", "Quantity_Recorded", "Audit_Status", "Auditor_Notes"]
        ws.append(headers)
        ws.append(["MED-9021-A", "Medical Kits", "Regional Hub Alpha", 750, "Recorded", "750 medical kits recorded in stock during physical bin count"])
        ws.append(["MED-9021-B", "Emergency Trauma Packs", "Regional Hub Alpha", 120, "Recorded", "Complete lot recorded"])
        ws.append(["MED-9021-C", "Surgical Gloves", "Regional Hub Alpha", 3000, "Recorded", "Standard count recorded"])
        wb.save(str(xlsx_path))

    # 4. Document 4: Warehouse Dispatch Record (DOCX)
    docx_path = SAMPLES_DIR / "Doc4_Warehouse_Dispatch_Record.docx"
    if not docx_path.exists():
        doc = docx.Document()
        doc.add_heading("APEX LOGISTICS & WAREHOUSING CORP", level=0)
        doc.add_heading("OUTBOUND FREIGHT DISPATCH MANIFEST", level=1)
        doc.add_paragraph("Origin: Sector 4 Warehouse")
        doc.add_paragraph("Destination: Regional Hub Alpha")
        doc.add_paragraph("Date of Dispatch: March 14, 2026")
        doc.add_paragraph("Dispatcher: Chief Logistics Officer Reynolds")
        doc.add_paragraph(
            "Bill of Lading #BOL-77312. Verified that 900 medical kits were dispatched from Sector 4 Warehouse. "
            "Driver assigned: Truck #TRK-882. Goods loaded securely onto pallets."
        )
        doc.add_paragraph("Total Dispatch Volume: 900 medical kits dispatched.")
        doc.save(str(docx_path))

    return [pdf_path, img_path, xlsx_path, docx_path]

def seed_medical_supply_investigation(db) -> models.Investigation:
    """
    Creates and processes the primary demonstration scenario:
    GOVERNMENT MEDICAL SUPPLY INVESTIGATION.
    """
    Base.metadata.create_all(bind=engine)
    create_sample_files_on_disk()

    # Check if already seeded
    existing = db.query(models.Investigation).filter(models.Investigation.case_code == "INV-MED-2026-001").first()
    if existing:
        return existing

    # Create investigation
    inv = models.Investigation(
        title="GOVERNMENT MEDICAL SUPPLY INVESTIGATION",
        description="Comprehensive forensic audit and verification of emergency medical supply shipments distributed between Sector 4 Warehouse and Regional Hub Alpha.",
        case_code="INV-MED-2026-001",
        status="ACTIVE"
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)

    sample_files = [
        ("Doc1_Government_Delivery_Report.pdf", "pdf", "Ministry of Health Executive Oversight"),
        ("Doc2_Delivery_Receipt_Scanned.png", "png", "Regional Hub Alpha Dock Intake Officer"),
        ("Doc3_Inventory_Audit_Log.xlsx", "xlsx", "Internal Supply Chain Audit Team"),
        ("Doc4_Warehouse_Dispatch_Record.docx", "docx", "Sector 4 Warehouse Dispatcher")
    ]

    ev_db_objects = []
    all_extracted_claims = []
    all_extracted_entities = []

    for idx, (filename, ftype, source) in enumerate(sample_files, start=1):
        src_path = SAMPLES_DIR / filename
        file_bytes = src_path.read_bytes()
        sha256 = hashlib.sha256(file_bytes).hexdigest()
        ev_code = f"EVD-2026-{idx:03d}"

        # Copy to UPLOAD_DIR
        dest_path = UPLOAD_DIR / filename
        dest_path.write_bytes(file_bytes)
        companion_src = src_path.with_suffix(".txt")
        if companion_src.exists():
            (UPLOAD_DIR / f"{src_path.stem}.txt").write_bytes(companion_src.read_bytes())

        # Run extraction
        extraction = process_file_multimodal(str(dest_path), filename)

        # Create EvidenceFile record
        ev = models.EvidenceFile(
            investigation_id=inv.id,
            evidence_code=ev_code,
            filename=filename,
            file_path=str(dest_path),
            file_type=ftype,
            file_size_bytes=len(file_bytes),
            sha256_hash=sha256,
            mime_type=f"application/{ftype}",
            status="EXTRACTED",
            source_attribution=source,
            metadata_json=json.dumps(extraction.get("metadata", {})),
            extracted_text=extraction.get("text", ""),
            ocr_applied=extraction.get("ocr_applied", False),
            adversarial_flagged=extraction.get("adversarial_flagged", False),
            adversarial_report_json=json.dumps(extraction.get("adversarial_report", {}))
        )
        db.add(ev)
        db.commit()
        db.refresh(ev)
        ev_db_objects.append(ev)

        # Extract claims
        claims_data = extract_structured_claims(extraction.get("text", ""), filename, extraction.get("metadata"))
        for c in claims_data:
            c_obj = models.ExtractedClaim(
                investigation_id=inv.id,
                evidence_id=ev.id,
                claim_code=f"{ev_code}-{c['claim_code']}",
                text=c["text"],
                claim_type=c["claim_type"],
                subject=c.get("subject"),
                predicate=c.get("predicate"),
                object_val=c.get("object_val"),
                quantity_val=c.get("quantity_val"),
                quantity_unit=c.get("quantity_unit"),
                quantity_action=c.get("quantity_action"),
                date_val=c.get("date_val"),
                location_val=c.get("location_val"),
                page_or_location=c.get("page_or_location"),
                confidence=c.get("confidence", 1.0),
                raw_snippet=c.get("raw_snippet")
            )
            db.add(c_obj)
            db.commit()
            db.refresh(c_obj)
            all_extracted_claims.append({
                "id": c_obj.id,
                "evidence_id": ev.id,
                "evidence_filename": ev.filename,
                "claim_code": c_obj.claim_code,
                "text": c_obj.text,
                "claim_type": c_obj.claim_type,
                "subject": c_obj.subject,
                "predicate": c_obj.predicate,
                "quantity_val": c_obj.quantity_val,
                "quantity_unit": c_obj.quantity_unit,
                "quantity_action": c_obj.quantity_action,
                "date_val": c_obj.date_val,
                "location_val": c_obj.location_val,
                "page_or_location": c_obj.page_or_location
            })

        # Extract entities
        ents = extract_entities_from_text(extraction.get("text", ""))
        for ent in ents:
            norm = ent["normalized_name"]
            existing_ent = db.query(models.Entity).filter(
                models.Entity.investigation_id == inv.id,
                models.Entity.normalized_name == norm
            ).first()
            if existing_ent:
                existing_ent.mention_count += 1
                db.commit()
            else:
                new_ent = models.Entity(
                    investigation_id=inv.id,
                    name=ent["name"],
                    normalized_name=norm,
                    entity_type=ent["entity_type"],
                    mention_count=1
                )
                db.add(new_ent)
                db.commit()

    # Detect conflicts between extracted claims
    ev_map = {e.id: {"filename": e.filename, "evidence_code": e.evidence_code} for e in ev_db_objects}
    conflicts_detected = detect_conflicts_between_claims(all_extracted_claims, ev_map)

    for cf in conflicts_detected:
        cnf_obj = models.Conflict(
            investigation_id=inv.id,
            conflict_code=cf["conflict_code"],
            claim_a_id=cf["claim_a_id"],
            claim_b_id=cf["claim_b_id"],
            evidence_a_id=cf["evidence_a_id"],
            evidence_b_id=cf["evidence_b_id"],
            conflict_type=cf["conflict_type"],
            severity=cf["severity"],
            explanation=cf["explanation"],
            discrepancy_details=json.dumps(cf.get("discrepancy_details", {})),
            verification_status="DETECTED"
        )
        db.add(cnf_obj)
    db.commit()

    # Evaluate reliability for each evidence file
    for ev in ev_db_objects:
        # Check conflicts involving this file
        file_conflicts = [c for c in conflicts_detected if c["evidence_a_id"] == ev.id or c["evidence_b_id"] == ev.id]
        meta = json.loads(ev.metadata_json) if ev.metadata_json else {}
        adv = json.loads(ev.adversarial_report_json) if ev.adversarial_report_json else {}

        rel_result = evaluate_evidence_reliability(
            evidence_meta=meta,
            file_type=ev.file_type,
            extracted_text=ev.extracted_text or "",
            adversarial_report=adv,
            has_conflicts=len(file_conflicts) > 0,
            conflicts_count=len(file_conflicts),
            is_corroborated=False
        )

        rel_obj = models.ReliabilityAssessment(
            investigation_id=inv.id,
            evidence_id=ev.id,
            score=rel_result["score"],
            category=rel_result["category"],
            provenance_notes=rel_result["provenance_notes"],
            authenticity_indicators_json=json.dumps(rel_result["authenticity_indicators"]),
            risk_factors_json=json.dumps(rel_result["risk_factors"]),
            missing_verification_json=json.dumps(rel_result["missing_verification"]),
            recommended_actions_json=json.dumps(rel_result["recommended_actions"])
        )
        db.add(rel_obj)
    db.commit()

    # Generate initial dossier report
    db_claims = db.query(models.ExtractedClaim).filter(models.ExtractedClaim.investigation_id == inv.id).all()
    db_entities = db.query(models.Entity).filter(models.Entity.investigation_id == inv.id).all()
    db_conflicts = db.query(models.Conflict).filter(models.Conflict.investigation_id == inv.id).all()
    db_reliabilities = db.query(models.ReliabilityAssessment).filter(models.ReliabilityAssessment.investigation_id == inv.id).all()

    report_payload = build_investigation_markdown_and_data(
        investigation={"case_code": inv.case_code, "title": inv.title},
        evidence_list=[{"id": e.id, "evidence_code": e.evidence_code, "filename": e.filename, "file_type": e.file_type, "file_size_bytes": e.file_size_bytes, "sha256_hash": e.sha256_hash, "ocr_applied": e.ocr_applied, "status": e.status, "source_attribution": e.source_attribution, "adversarial_flagged": e.adversarial_flagged} for e in ev_db_objects],
        claims_list=[{"claim_code": c.claim_code, "claim_type": c.claim_type, "text": c.text, "evidence_filename": ev_map.get(c.evidence_id, {}).get("filename"), "page_or_location": c.page_or_location} for c in db_claims],
        entities_list=[{"name": ent.name, "entity_type": ent.entity_type, "normalized_name": ent.normalized_name, "mention_count": ent.mention_count} for ent in db_entities],
        conflicts_list=[{"conflict_code": cf.conflict_code, "conflict_type": cf.conflict_type, "severity": cf.severity, "explanation": cf.explanation, "evidence_a_filename": ev_map.get(cf.evidence_a_id, {}).get("filename"), "evidence_b_filename": ev_map.get(cf.evidence_b_id, {}).get("filename"), "claim_a_text": cf.claim_a.text if cf.claim_a else "", "claim_b_text": cf.claim_b.text if cf.claim_b else "", "verification_status": cf.verification_status} for cf in db_conflicts],
        reliability_list=[{"evidence_code": ev_map.get(r.evidence_id, {}).get("evidence_code"), "filename": ev_map.get(r.evidence_id, {}).get("filename"), "score": r.score, "category": r.category, "authenticity_indicators": json.loads(r.authenticity_indicators_json or "[]"), "risk_factors": json.loads(r.risk_factors_json or "[]")} for r in db_reliabilities]
    )

    pdf_filename = f"Report_{inv.case_code}.pdf"
    pdf_full_path = generate_pdf_report(report_payload, pdf_filename)

    rep_obj = models.InvestigationReport(
        investigation_id=inv.id,
        report_code=f"REP-{inv.case_code}",
        title=report_payload["title"],
        executive_summary=report_payload["executive_summary"],
        findings_json=json.dumps(report_payload["findings"]),
        report_markdown=report_payload["report_markdown"],
        pdf_file_path=pdf_full_path
    )
    db.add(rep_obj)
    db.commit()

    return inv
