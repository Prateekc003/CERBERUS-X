import os
import shutil
import hashlib
import json
import datetime
from typing import List, Optional
from pathlib import Path

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.config import UPLOAD_DIR, REPORT_DIR, OLLAMA_HOST, OLLAMA_MODEL
from app.database import engine, get_db, Base
from app import models, schemas
from app.services.multimodal_extractor import process_file_multimodal
from app.services.entity_resolver import extract_entities_from_text, normalize_entity_name
from app.services.contradiction_engine import extract_structured_claims, detect_conflicts_between_claims
from app.services.reliability_engine import evaluate_evidence_reliability
from app.services.knowledge_graph_engine import build_investigation_knowledge_graph
from app.services.investigation_assistant import query_investigation_assistant, check_ollama_available
from app.services.report_generator import build_investigation_markdown_and_data, generate_pdf_report
from app.seed_scenario import seed_medical_supply_investigation

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CERBERUS-X API",
    description="Multimodal Evidence Intelligence & Conflict-Aware Reasoning System",
    version="1.0.0"
)

# Enable CORS for frontend Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed demonstration scenario automatically if database is fresh
@app.on_event("startup")
def on_startup():
    db = next(get_db())
    try:
        count = db.query(models.Investigation).count()
        if count == 0:
            seed_medical_supply_investigation(db)
    except Exception as e:
        print(f"Startup seed notice: {e}")
    finally:
        db.close()

# ----------------- SYSTEM & DASHBOARD APIs -----------------
@app.get("/api/system/status")
async def get_system_status():
    ollama_ok = await check_ollama_available()
    return {
        "status": "ONLINE",
        "offline_first": True,
        "ollama_connected": ollama_ok,
        "ollama_host": OLLAMA_HOST,
        "ollama_model": OLLAMA_MODEL,
        "reasoning_mode": "OLLAMA_LOCAL_LLM" if ollama_ok else "RULE_BASED_INFERENCE",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

@app.get("/api/dashboard/overview", response_model=schemas.DashboardOverviewResponse)
async def get_dashboard_overview(investigation_id: Optional[int] = None, db: Session = Depends(get_db)):
    inv_q = db.query(models.Investigation)
    ev_q = db.query(models.EvidenceFile)
    clm_q = db.query(models.ExtractedClaim)
    ent_q = db.query(models.Entity)
    cnf_q = db.query(models.Conflict)

    if investigation_id:
        ev_q = ev_q.filter(models.EvidenceFile.investigation_id == investigation_id)
        clm_q = clm_q.filter(models.ExtractedClaim.investigation_id == investigation_id)
        ent_q = ent_q.filter(models.Entity.investigation_id == investigation_id)
        cnf_q = cnf_q.filter(models.Conflict.investigation_id == investigation_id)

    total_invs = inv_q.count()
    total_ev = ev_q.count()
    total_clm = clm_q.count()
    total_ent = ent_q.count()
    total_cnf = cnf_q.count()
    high_risk_ev = ev_q.filter(models.EvidenceFile.adversarial_flagged == True).count()

    # Conflict distribution by type
    conflicts = cnf_q.all()
    conf_dist: dict[str, int] = {}
    for c in conflicts:
        conf_dist[c.conflict_type] = conf_dist.get(c.conflict_type, 0) + 1

    # Reliability breakdown
    rel_q = db.query(models.ReliabilityAssessment)
    if investigation_id:
        rel_q = rel_q.filter(models.ReliabilityAssessment.investigation_id == investigation_id)
    reliabilities = rel_q.all()
    rel_breakdown: dict[str, int] = {"HIGH": 0, "MODERATE": 0, "LOW": 0, "SUSPICIOUS": 0}
    for r in reliabilities:
        rel_breakdown[r.category] = rel_breakdown.get(r.category, 0) + 1

    # Recent activity
    recent_activity = []
    recent_ev = ev_q.order_by(models.EvidenceFile.uploaded_at.desc()).limit(5).all()
    for e in recent_ev:
        recent_activity.append({
            "type": "EVIDENCE_INGESTION",
            "title": f"Ingested {e.filename}",
            "code": e.evidence_code,
            "timestamp": e.uploaded_at.isoformat(),
            "details": f"{e.file_type.upper()} ({e.file_size_bytes} B) - Status: {e.status}"
        })

    ollama_ok = await check_ollama_available()

    return {
        "total_investigations": total_invs,
        "total_evidence_files": total_ev,
        "total_extracted_claims": total_clm,
        "total_identified_entities": total_ent,
        "total_detected_conflicts": total_cnf,
        "high_risk_evidence_count": high_risk_ev,
        "conflict_distribution": conf_dist,
        "reliability_breakdown": rel_breakdown,
        "recent_activity": recent_activity,
        "system_status": {
            "is_online": True,
            "ollama_connected": ollama_ok,
            "active_mode": "OLLAMA_LOCAL_LLM" if ollama_ok else "RULE_BASED_INFERENCE"
        }
    }

# ----------------- INVESTIGATIONS APIs -----------------
@app.get("/api/investigations", response_model=List[schemas.InvestigationResponse])
def list_investigations(db: Session = Depends(get_db)):
    invs = db.query(models.Investigation).order_by(models.Investigation.created_at.desc()).all()
    res = []
    for inv in invs:
        ev_cnt = db.query(models.EvidenceFile).filter(models.EvidenceFile.investigation_id == inv.id).count()
        clm_cnt = db.query(models.ExtractedClaim).filter(models.ExtractedClaim.investigation_id == inv.id).count()
        cnf_cnt = db.query(models.Conflict).filter(models.Conflict.investigation_id == inv.id).count()
        hr_cnt = db.query(models.EvidenceFile).filter(
            models.EvidenceFile.investigation_id == inv.id,
            models.EvidenceFile.adversarial_flagged == True
        ).count()
        res.append({
            "id": inv.id,
            "title": inv.title,
            "description": inv.description,
            "case_code": inv.case_code,
            "status": inv.status,
            "created_at": inv.created_at,
            "updated_at": inv.updated_at,
            "evidence_count": ev_cnt,
            "claims_count": clm_cnt,
            "conflicts_count": cnf_cnt,
            "high_risk_count": hr_cnt
        })
    return res

@app.post("/api/investigations", response_model=schemas.InvestigationResponse)
def create_investigation(payload: schemas.InvestigationCreate, db: Session = Depends(get_db)):
    code_suffix = int(datetime.datetime.utcnow().timestamp()) % 100000
    case_code = f"INV-CASE-{code_suffix:05d}"
    inv = models.Investigation(
        title=payload.title,
        description=payload.description,
        case_code=case_code,
        status="ACTIVE"
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)
    return {
        "id": inv.id,
        "title": inv.title,
        "description": inv.description,
        "case_code": inv.case_code,
        "status": inv.status,
        "created_at": inv.created_at,
        "updated_at": inv.updated_at,
        "evidence_count": 0,
        "claims_count": 0,
        "conflicts_count": 0,
        "high_risk_count": 0
    }

@app.post("/api/investigations/demo-seed")
def trigger_demo_seed(db: Session = Depends(get_db)):
    inv = seed_medical_supply_investigation(db)
    return {"message": "Demo scenario seeded successfully", "investigation_id": inv.id, "case_code": inv.case_code}

# ----------------- EVIDENCE UPLOAD & RETRIEVAL APIs -----------------
@app.get("/api/evidence", response_model=List[schemas.EvidenceResponse])
def list_evidence(investigation_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(models.EvidenceFile)
    if investigation_id:
        q = q.filter(models.EvidenceFile.investigation_id == investigation_id)
    files = q.order_by(models.EvidenceFile.uploaded_at.desc()).all()
    res = []
    for f in files:
        clm_count = db.query(models.ExtractedClaim).filter(models.ExtractedClaim.evidence_id == f.id).count()
        rel = db.query(models.ReliabilityAssessment).filter(models.ReliabilityAssessment.evidence_id == f.id).first()
        meta = json.loads(f.metadata_json) if f.metadata_json else {}
        res.append({
            "id": f.id,
            "investigation_id": f.investigation_id,
            "evidence_code": f.evidence_code,
            "filename": f.filename,
            "file_type": f.file_type,
            "file_size_bytes": f.file_size_bytes,
            "sha256_hash": f.sha256_hash,
            "mime_type": f.mime_type,
            "uploaded_at": f.uploaded_at,
            "status": f.status,
            "source_attribution": f.source_attribution,
            "ocr_applied": f.ocr_applied,
            "adversarial_flagged": f.adversarial_flagged,
            "metadata": meta,
            "claims_count": clm_count,
            "reliability_score": rel.score if rel else None,
            "reliability_category": rel.category if rel else None
        })
    return res

@app.get("/api/evidence/{evidence_id}", response_model=schemas.EvidenceDetailResponse)
def get_evidence_detail(evidence_id: int, db: Session = Depends(get_db)):
    ev = db.query(models.EvidenceFile).filter(models.EvidenceFile.id == evidence_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence file not found")
    
    clm_count = db.query(models.ExtractedClaim).filter(models.ExtractedClaim.evidence_id == ev.id).count()
    rel = db.query(models.ReliabilityAssessment).filter(models.ReliabilityAssessment.evidence_id == ev.id).first()
    meta = json.loads(ev.metadata_json) if ev.metadata_json else {}
    adv = json.loads(ev.adversarial_report_json) if ev.adversarial_report_json else {}
    rel_data = {
        "score": rel.score,
        "category": rel.category,
        "provenance_notes": rel.provenance_notes,
        "authenticity_indicators": json.loads(rel.authenticity_indicators_json or "[]"),
        "risk_factors": json.loads(rel.risk_factors_json or "[]"),
        "missing_verification": json.loads(rel.missing_verification_json or "[]")
    } if rel else None

    return {
        "id": ev.id,
        "investigation_id": ev.investigation_id,
        "evidence_code": ev.evidence_code,
        "filename": ev.filename,
        "file_type": ev.file_type,
        "file_size_bytes": ev.file_size_bytes,
        "sha256_hash": ev.sha256_hash,
        "mime_type": ev.mime_type,
        "uploaded_at": ev.uploaded_at,
        "status": ev.status,
        "source_attribution": ev.source_attribution,
        "ocr_applied": ev.ocr_applied,
        "adversarial_flagged": ev.adversarial_flagged,
        "metadata": meta,
        "claims_count": clm_count,
        "reliability_score": rel.score if rel else None,
        "reliability_category": rel.category if rel else None,
        "extracted_text": ev.extracted_text,
        "adversarial_report": adv,
        "reliability_details": rel_data
    }

@app.post("/api/evidence/upload")
async def upload_evidence(
    investigation_id: int = Form(...),
    source_attribution: Optional[str] = Form(None),
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    inv = db.query(models.Investigation).filter(models.Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    saved_evidence = []
    
    for f in files:
        contents = await f.read()
        sha256 = hashlib.sha256(contents).hexdigest()
        ext = Path(f.filename).suffix.lower()
        file_type = ext.replace(".", "") or "unknown"
        
        # Save file to upload directory
        dest_path = UPLOAD_DIR / f"{sha256[:12]}_{f.filename}"
        with open(dest_path, "wb") as dest:
            dest.write(contents)

        ev_idx = db.query(models.EvidenceFile).filter(models.EvidenceFile.investigation_id == investigation_id).count() + 1
        ev_code = f"EVD-{datetime.datetime.utcnow().year}-{ev_idx:03d}"

        # Run extraction
        extraction = process_file_multimodal(str(dest_path), f.filename)

        ev = models.EvidenceFile(
            investigation_id=investigation_id,
            evidence_code=ev_code,
            filename=f.filename,
            file_path=str(dest_path),
            file_type=file_type,
            file_size_bytes=len(contents),
            sha256_hash=sha256,
            mime_type=f.content_type,
            status="EXTRACTED",
            source_attribution=source_attribution or "Uploaded Evidence",
            metadata_json=json.dumps(extraction.get("metadata", {})),
            extracted_text=extraction.get("text", ""),
            ocr_applied=extraction.get("ocr_applied", False),
            adversarial_flagged=extraction.get("adversarial_flagged", False),
            adversarial_report_json=json.dumps(extraction.get("adversarial_report", {}))
        )
        db.add(ev)
        db.commit()
        db.refresh(ev)

        # Extract claims
        claims_data = extract_structured_claims(extraction.get("text", ""), f.filename, extraction.get("metadata"))
        for c in claims_data:
            c_obj = models.ExtractedClaim(
                investigation_id=investigation_id,
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

        # Extract entities
        ents = extract_entities_from_text(extraction.get("text", ""))
        for ent in ents:
            norm = ent["normalized_name"]
            existing_ent = db.query(models.Entity).filter(
                models.Entity.investigation_id == investigation_id,
                models.Entity.normalized_name == norm
            ).first()
            if existing_ent:
                existing_ent.mention_count += 1
            else:
                new_ent = models.Entity(
                    investigation_id=investigation_id,
                    name=ent["name"],
                    normalized_name=norm,
                    entity_type=ent["entity_type"],
                    mention_count=1
                )
                db.add(new_ent)
        db.commit()

        # Run conflict re-evaluation for the entire investigation
        all_inv_claims = db.query(models.ExtractedClaim).filter(models.ExtractedClaim.investigation_id == investigation_id).all()
        all_inv_ev = db.query(models.EvidenceFile).filter(models.EvidenceFile.investigation_id == investigation_id).all()
        ev_map = {e.id: {"filename": e.filename, "evidence_code": e.evidence_code} for e in all_inv_ev}
        
        claims_dict_list = [{
            "id": c.id,
            "evidence_id": c.evidence_id,
            "evidence_filename": ev_map.get(c.evidence_id, {}).get("filename"),
            "claim_code": c.claim_code,
            "text": c.text,
            "claim_type": c.claim_type,
            "subject": c.subject,
            "predicate": c.predicate,
            "quantity_val": c.quantity_val,
            "quantity_unit": c.quantity_unit,
            "quantity_action": c.quantity_action,
            "date_val": c.date_val,
            "location_val": c.location_val,
            "page_or_location": c.page_or_location
        } for c in all_inv_claims]

        conflicts = detect_conflicts_between_claims(claims_dict_list, ev_map)
        
        # Clear existing auto conflicts and recreate
        db.query(models.Conflict).filter(models.Conflict.investigation_id == investigation_id).delete()
        for cf in conflicts:
            cnf_obj = models.Conflict(
                investigation_id=investigation_id,
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

        # Compute reliability
        for e in all_inv_ev:
            e_confs = [c for c in conflicts if c["evidence_a_id"] == e.id or c["evidence_b_id"] == e.id]
            meta = json.loads(e.metadata_json) if e.metadata_json else {}
            adv = json.loads(e.adversarial_report_json) if e.adversarial_report_json else {}
            rel_res = evaluate_evidence_reliability(
                evidence_meta=meta,
                file_type=e.file_type,
                extracted_text=e.extracted_text or "",
                adversarial_report=adv,
                has_conflicts=len(e_confs) > 0,
                conflicts_count=len(e_confs),
                is_corroborated=False
            )
            # Update or create reliability
            rel_rec = db.query(models.ReliabilityAssessment).filter(models.ReliabilityAssessment.evidence_id == e.id).first()
            if not rel_rec:
                rel_rec = models.ReliabilityAssessment(investigation_id=investigation_id, evidence_id=e.id, score=rel_res["score"], category=rel_res["category"])
                db.add(rel_rec)
            rel_rec.score = rel_res["score"]
            rel_rec.category = rel_res["category"]
            rel_rec.provenance_notes = rel_res["provenance_notes"]
            rel_rec.authenticity_indicators_json = json.dumps(rel_res["authenticity_indicators"])
            rel_rec.risk_factors_json = json.dumps(rel_res["risk_factors"])
            rel_rec.missing_verification_json = json.dumps(rel_res["missing_verification"])
            rel_rec.recommended_actions_json = json.dumps(rel_res["recommended_actions"])
        db.commit()

        saved_evidence.append({"id": ev.id, "filename": ev.filename, "evidence_code": ev.evidence_code})

    return {"message": f"Successfully processed {len(saved_evidence)} evidence file(s)", "evidence": saved_evidence}

@app.delete("/api/evidence/{evidence_id}")
def delete_evidence(evidence_id: int, db: Session = Depends(get_db)):
    ev = db.query(models.EvidenceFile).filter(models.EvidenceFile.id == evidence_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    # Delete file from disk if exists
    try:
        p = Path(ev.file_path)
        if p.exists():
            p.unlink()
    except Exception:
        pass

    db.delete(ev)
    db.commit()
    return {"message": "Evidence file deleted successfully"}

# ----------------- CLAIMS & ENTITIES APIs -----------------
@app.get("/api/claims", response_model=List[schemas.ClaimResponse])
def list_claims(investigation_id: Optional[int] = None, evidence_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(models.ExtractedClaim)
    if investigation_id:
        q = q.filter(models.ExtractedClaim.investigation_id == investigation_id)
    if evidence_id:
        q = q.filter(models.ExtractedClaim.evidence_id == evidence_id)
    
    claims = q.order_by(models.ExtractedClaim.id.asc()).all()
    res = []
    for c in claims:
        res.append({
            "id": c.id,
            "investigation_id": c.investigation_id,
            "evidence_id": c.evidence_id,
            "evidence_filename": c.evidence.filename if c.evidence else None,
            "claim_code": c.claim_code,
            "text": c.text,
            "claim_type": c.claim_type,
            "subject": c.subject,
            "predicate": c.predicate,
            "object_val": c.object_val,
            "quantity_val": c.quantity_val,
            "quantity_unit": c.quantity_unit,
            "quantity_action": c.quantity_action,
            "date_val": c.date_val,
            "location_val": c.location_val,
            "page_or_location": c.page_or_location,
            "confidence": c.confidence,
            "raw_snippet": c.raw_snippet,
            "created_at": c.created_at
        })
    return res

@app.get("/api/entities", response_model=List[schemas.EntityResponse])
def list_entities(investigation_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(models.Entity)
    if investigation_id:
        q = q.filter(models.Entity.investigation_id == investigation_id)
    
    entities = q.order_by(models.Entity.mention_count.desc()).all()
    res = []
    for ent in entities:
        aliases = [a.name for a in ent.aliases] if ent.aliases else []
        res.append({
            "id": ent.id,
            "investigation_id": ent.investigation_id,
            "name": ent.name,
            "normalized_name": ent.normalized_name,
            "entity_type": ent.entity_type,
            "mention_count": ent.mention_count,
            "alias_of_id": ent.alias_of_id,
            "aliases": aliases
        })
    return res

@app.post("/api/entities/merge")
def merge_entities(payload: schemas.EntityMergeRequest, db: Session = Depends(get_db)):
    canonical = db.query(models.Entity).filter(models.Entity.id == payload.canonical_entity_id).first()
    if not canonical:
        raise HTTPException(status_code=404, detail="Canonical entity not found")

    merged_names = []
    for alias_id in payload.alias_entity_ids:
        if alias_id == canonical.id:
            continue
        alias_ent = db.query(models.Entity).filter(models.Entity.id == alias_id).first()
        if alias_ent:
            canonical.mention_count += alias_ent.mention_count
            alias_ent.alias_of_id = canonical.id
            merged_names.append(alias_ent.name)
    db.commit()
    return {"message": f"Successfully merged {len(merged_names)} entities into {canonical.name}", "merged": merged_names}

# ----------------- KNOWLEDGE GRAPH & CONFLICTS APIs -----------------
@app.get("/api/knowledge-graph", response_model=schemas.KnowledgeGraphResponse)
def get_knowledge_graph(investigation_id: Optional[int] = None, db: Session = Depends(get_db)):
    ev_q = db.query(models.EvidenceFile)
    clm_q = db.query(models.ExtractedClaim)
    ent_q = db.query(models.Entity)
    cnf_q = db.query(models.Conflict)

    if investigation_id:
        ev_q = ev_q.filter(models.EvidenceFile.investigation_id == investigation_id)
        clm_q = clm_q.filter(models.ExtractedClaim.investigation_id == investigation_id)
        ent_q = ent_q.filter(models.Entity.investigation_id == investigation_id)
        cnf_q = cnf_q.filter(models.Conflict.investigation_id == investigation_id)

    ev_list = [{
        "id": e.id, "evidence_code": e.evidence_code, "filename": e.filename,
        "file_type": e.file_type, "status": e.status, "adversarial_flagged": e.adversarial_flagged,
        "reliability_score": e.reliability.score if e.reliability else None
    } for e in ev_q.all()]

    clm_list = [{
        "id": c.id, "claim_code": c.claim_code, "text": c.text, "claim_type": c.claim_type,
        "quantity_val": c.quantity_val, "quantity_action": c.quantity_action,
        "evidence_id": c.evidence_id, "evidence_filename": c.evidence.filename if c.evidence else None
    } for c in clm_q.all()]

    ent_list = [{
        "id": ent.id, "name": ent.name, "normalized_name": ent.normalized_name,
        "entity_type": ent.entity_type, "mention_count": ent.mention_count
    } for ent in ent_q.all()]

    cnf_list = [{
        "id": cf.id, "conflict_code": cf.conflict_code, "conflict_type": cf.conflict_type,
        "claim_a_id": cf.claim_a_id, "claim_b_id": cf.claim_b_id,
        "evidence_a_id": cf.evidence_a_id, "evidence_b_id": cf.evidence_b_id,
        "severity": cf.severity, "explanation": cf.explanation
    } for cf in cnf_q.all()]

    return build_investigation_knowledge_graph(ev_list, clm_list, ent_list, cnf_list)

@app.get("/api/conflicts", response_model=List[schemas.ConflictResponse])
def list_conflicts(investigation_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(models.Conflict)
    if investigation_id:
        q = q.filter(models.Conflict.investigation_id == investigation_id)
    
    confs = q.order_by(models.Conflict.severity.desc(), models.Conflict.id.asc()).all()
    res = []
    for c in confs:
        disc = json.loads(c.discrepancy_details) if c.discrepancy_details else None
        res.append({
            "id": c.id,
            "investigation_id": c.investigation_id,
            "conflict_code": c.conflict_code,
            "claim_a_id": c.claim_a_id,
            "claim_b_id": c.claim_b_id,
            "claim_a_text": c.claim_a.text if c.claim_a else "Claim A",
            "claim_b_text": c.claim_b.text if c.claim_b else "Claim B",
            "evidence_a_filename": c.evidence_a.filename if c.evidence_a else "Evidence A",
            "evidence_b_filename": c.evidence_b.filename if c.evidence_b else "Evidence B",
            "conflict_type": c.conflict_type,
            "severity": c.severity,
            "explanation": c.explanation,
            "discrepancy_details": disc,
            "verification_status": c.verification_status,
            "resolution_notes": c.resolution_notes,
            "created_at": c.created_at
        })
    return res

@app.put("/api/conflicts/{conflict_id}/status")
def update_conflict_status(conflict_id: int, payload: schemas.ConflictStatusUpdate, db: Session = Depends(get_db)):
    c = db.query(models.Conflict).filter(models.Conflict.id == conflict_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Conflict record not found")
    c.verification_status = payload.verification_status
    if payload.resolution_notes:
        c.resolution_notes = payload.resolution_notes
    db.commit()
    return {"message": "Conflict status updated", "conflict_id": c.id, "new_status": c.verification_status}

# ----------------- RELIABILITY ASSESSMENTS API -----------------
@app.get("/api/reliability", response_model=List[schemas.ReliabilityResponse])
def list_reliability(investigation_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(models.ReliabilityAssessment)
    if investigation_id:
        q = q.filter(models.ReliabilityAssessment.investigation_id == investigation_id)
    
    rels = q.order_by(models.ReliabilityAssessment.score.desc()).all()
    res = []
    for r in rels:
        ev = r.evidence
        res.append({
            "id": r.id,
            "evidence_id": r.evidence_id,
            "evidence_code": ev.evidence_code if ev else "EVD-UNKNOWN",
            "filename": ev.filename if ev else "File",
            "score": r.score,
            "category": r.category,
            "provenance_notes": r.provenance_notes,
            "authenticity_indicators": json.loads(r.authenticity_indicators_json or "[]"),
            "risk_factors": json.loads(r.risk_factors_json or "[]"),
            "missing_verification": json.loads(r.missing_verification_json or "[]"),
            "recommended_actions": json.loads(r.recommended_actions_json or "[]")
        })
    return res

# ----------------- INVESTIGATION ASSISTANT API -----------------
@app.post("/api/assistant/query", response_model=schemas.AssistantQueryResponse)
async def query_assistant(payload: schemas.AssistantQueryRequest, db: Session = Depends(get_db)):
    inv_id = payload.investigation_id
    evidence = db.query(models.EvidenceFile).filter(models.EvidenceFile.investigation_id == inv_id).all()
    claims = db.query(models.ExtractedClaim).filter(models.ExtractedClaim.investigation_id == inv_id).all()
    conflicts = db.query(models.Conflict).filter(models.Conflict.investigation_id == inv_id).all()
    reliabilities = db.query(models.ReliabilityAssessment).filter(models.ReliabilityAssessment.investigation_id == inv_id).all()

    ev_list = [{"id": e.id, "filename": e.filename, "evidence_code": e.evidence_code, "file_type": e.file_type} for e in evidence]
    clm_list = [{"id": c.id, "evidence_id": c.evidence_id, "evidence_filename": c.evidence.filename if c.evidence else None, "claim_code": c.claim_code, "text": c.text, "quantity_val": c.quantity_val, "quantity_action": c.quantity_action, "page_or_location": c.page_or_location} for c in claims]
    cnf_list = [{"id": cf.id, "conflict_code": cf.conflict_code, "conflict_type": cf.conflict_type, "severity": cf.severity, "explanation": cf.explanation, "claim_a_id": cf.claim_a_id, "claim_b_id": cf.claim_b_id, "evidence_a_id": cf.evidence_a_id, "evidence_b_id": cf.evidence_b_id, "evidence_a_filename": cf.evidence_a.filename if cf.evidence_a else None, "evidence_b_filename": cf.evidence_b.filename if cf.evidence_b else None, "claim_a_text": cf.claim_a.text if cf.claim_a else "", "claim_b_text": cf.claim_b.text if cf.claim_b else ""} for cf in conflicts]
    rel_list = [{"evidence_id": r.evidence_id, "filename": r.evidence.filename if r.evidence else "", "evidence_code": r.evidence.evidence_code if r.evidence else "", "score": r.score, "category": r.category, "provenance_notes": r.provenance_notes} for r in reliabilities]

    return await query_investigation_assistant(
        query=payload.query,
        evidence_list=ev_list,
        claims_list=clm_list,
        conflicts_list=cnf_list,
        reliability_list=rel_list,
        preferred_mode=payload.preferred_mode or "auto"
    )

# ----------------- REPORT GENERATION APIs -----------------
@app.post("/api/reports/generate", response_model=schemas.ReportResponse)
def generate_report(payload: schemas.ReportGenerateRequest, db: Session = Depends(get_db)):
    inv = db.query(models.Investigation).filter(models.Investigation.id == payload.investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    evidence = db.query(models.EvidenceFile).filter(models.EvidenceFile.investigation_id == inv.id).all()
    claims = db.query(models.ExtractedClaim).filter(models.ExtractedClaim.investigation_id == inv.id).all()
    entities = db.query(models.Entity).filter(models.Entity.investigation_id == inv.id).all()
    conflicts = db.query(models.Conflict).filter(models.Conflict.investigation_id == inv.id).all()
    reliabilities = db.query(models.ReliabilityAssessment).filter(models.ReliabilityAssessment.investigation_id == inv.id).all()

    report_payload = build_investigation_markdown_and_data(
        investigation={"case_code": inv.case_code, "title": payload.title or inv.title},
        evidence_list=[{"id": e.id, "evidence_code": e.evidence_code, "filename": e.filename, "file_type": e.file_type, "file_size_bytes": e.file_size_bytes, "sha256_hash": e.sha256_hash, "ocr_applied": e.ocr_applied, "status": e.status, "source_attribution": e.source_attribution, "adversarial_flagged": e.adversarial_flagged} for e in evidence],
        claims_list=[{"claim_code": c.claim_code, "claim_type": c.claim_type, "text": c.text, "evidence_filename": c.evidence.filename if c.evidence else "", "page_or_location": c.page_or_location} for c in claims],
        entities_list=[{"name": ent.name, "entity_type": ent.entity_type, "normalized_name": ent.normalized_name, "mention_count": ent.mention_count} for ent in entities],
        conflicts_list=[{"conflict_code": cf.conflict_code, "conflict_type": cf.conflict_type, "severity": cf.severity, "explanation": cf.explanation, "evidence_a_filename": cf.evidence_a.filename if cf.evidence_a else "", "evidence_b_filename": cf.evidence_b.filename if cf.evidence_b else "", "claim_a_text": cf.claim_a.text if cf.claim_a else "", "claim_b_text": cf.claim_b.text if cf.claim_b else "", "verification_status": cf.verification_status} for cf in conflicts],
        reliability_list=[{"evidence_code": r.evidence.evidence_code if r.evidence else "", "filename": r.evidence.filename if r.evidence else "", "score": r.score, "category": r.category, "authenticity_indicators": json.loads(r.authenticity_indicators_json or "[]"), "risk_factors": json.loads(r.risk_factors_json or "[]")} for r in reliabilities]
    )

    pdf_filename = f"Report_{inv.case_code}_{int(datetime.datetime.utcnow().timestamp())}.pdf"
    pdf_path = generate_pdf_report(report_payload, pdf_filename)

    rep = models.InvestigationReport(
        investigation_id=inv.id,
        report_code=f"REP-{inv.case_code}-{int(datetime.datetime.utcnow().timestamp()) % 1000}",
        title=report_payload["title"],
        executive_summary=report_payload["executive_summary"],
        findings_json=json.dumps(report_payload["findings"]),
        report_markdown=report_payload["report_markdown"],
        pdf_file_path=pdf_path
    )
    db.add(rep)
    db.commit()
    db.refresh(rep)

    return {
        "id": rep.id,
        "report_code": rep.report_code,
        "title": rep.title,
        "executive_summary": rep.executive_summary,
        "findings": report_payload["findings"],
        "report_markdown": rep.report_markdown,
        "pdf_download_url": f"/api/reports/{rep.id}/pdf",
        "created_at": rep.created_at
    }

@app.get("/api/reports/{report_id}/pdf")
def download_pdf_report(report_id: int, db: Session = Depends(get_db)):
    rep = db.query(models.InvestigationReport).filter(models.InvestigationReport.id == report_id).first()
    if not rep or not rep.pdf_file_path or not Path(rep.pdf_file_path).exists():
        raise HTTPException(status_code=404, detail="PDF report not found on disk")
    return FileResponse(
        rep.pdf_file_path,
        media_type="application/pdf",
        filename=os.path.basename(rep.pdf_file_path)
    )
