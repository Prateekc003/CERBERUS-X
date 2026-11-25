import datetime
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey, Float, Boolean
)
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=True)
    role = Column(String(50), default="investigator")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    investigations = relationship("Investigation", back_populates="creator")

class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    case_code = Column(String(64), unique=True, index=True, nullable=False)
    status = Column(String(50), default="ACTIVE")  # ACTIVE, UNDER_REVIEW, CLOSED, ARCHIVED
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    creator = relationship("User", back_populates="investigations")
    evidence_files = relationship("EvidenceFile", back_populates="investigation", cascade="all, delete-orphan")
    claims = relationship("ExtractedClaim", back_populates="investigation", cascade="all, delete-orphan")
    entities = relationship("Entity", back_populates="investigation", cascade="all, delete-orphan")
    relationships = relationship("EntityRelationship", back_populates="investigation", cascade="all, delete-orphan")
    conflicts = relationship("Conflict", back_populates="investigation", cascade="all, delete-orphan")
    reports = relationship("InvestigationReport", back_populates="investigation", cascade="all, delete-orphan")

class EvidenceFile(Base):
    __tablename__ = "evidence_files"

    id = Column(Integer, primary_key=True, index=True)
    investigation_id = Column(Integer, ForeignKey("investigations.id"), nullable=False, index=True)
    evidence_code = Column(String(64), unique=True, index=True, nullable=False) # e.g. EVD-2026-001
    filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    file_type = Column(String(32), nullable=False) # pdf, docx, xlsx, etc.
    file_size_bytes = Column(Integer, nullable=False)
    sha256_hash = Column(String(64), nullable=False)
    mime_type = Column(String(128), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String(50), default="PENDING") # PENDING, PROCESSING, EXTRACTED, FAILED
    source_attribution = Column(String(255), nullable=True) # e.g. Ministry Official, Receiving Dock, etc.
    metadata_json = Column(Text, nullable=True) # JSON document metadata
    extracted_text = Column(Text, nullable=True) # full text
    ocr_applied = Column(Boolean, default=False)
    adversarial_flagged = Column(Boolean, default=False)
    adversarial_report_json = Column(Text, nullable=True)

    investigation = relationship("Investigation", back_populates="evidence_files")
    claims = relationship("ExtractedClaim", back_populates="evidence", cascade="all, delete-orphan")
    reliability = relationship("ReliabilityAssessment", back_populates="evidence", uselist=False, cascade="all, delete-orphan")
    processing_jobs = relationship("ProcessingJob", back_populates="evidence", cascade="all, delete-orphan")

class ExtractedClaim(Base):
    __tablename__ = "extracted_claims"

    id = Column(Integer, primary_key=True, index=True)
    investigation_id = Column(Integer, ForeignKey("investigations.id"), nullable=False, index=True)
    evidence_id = Column(Integer, ForeignKey("evidence_files.id"), nullable=False, index=True)
    claim_code = Column(String(64), index=True, nullable=False) # e.g. CLM-001
    text = Column(Text, nullable=False)
    claim_type = Column(String(64), default="FACT") # QUANTITY, DATE, LOCATION, STATUS, ATTRIBUTION
    subject = Column(String(255), nullable=True) # e.g. medical kits
    predicate = Column(String(128), nullable=True) # delivered, received, recorded, dispatched
    object_val = Column(String(255), nullable=True)
    quantity_val = Column(Float, nullable=True)
    quantity_unit = Column(String(64), nullable=True) # kits, units, boxes
    quantity_action = Column(String(64), nullable=True) # delivered, received, recorded, dispatched
    date_val = Column(String(64), nullable=True)
    location_val = Column(String(255), nullable=True)
    page_or_location = Column(String(128), nullable=True) # Page 1, Row 14, etc.
    confidence = Column(Float, default=1.0)
    raw_snippet = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    investigation = relationship("Investigation", back_populates="claims")
    evidence = relationship("EvidenceFile", back_populates="claims")

class Entity(Base):
    __tablename__ = "entities"

    id = Column(Integer, primary_key=True, index=True)
    investigation_id = Column(Integer, ForeignKey("investigations.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    normalized_name = Column(String(255), nullable=False, index=True)
    entity_type = Column(String(64), nullable=False) # PERSON, ORG, LOCATION, DATE, EVENT, PRODUCT, QUANTITY
    mention_count = Column(Integer, default=1)
    alias_of_id = Column(Integer, ForeignKey("entities.id"), nullable=True)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    investigation = relationship("Investigation", back_populates="entities")
    aliases = relationship("Entity", backref="canonical", remote_side=[id])

class EntityRelationship(Base):
    __tablename__ = "entity_relationships"

    id = Column(Integer, primary_key=True, index=True)
    investigation_id = Column(Integer, ForeignKey("investigations.id"), nullable=False, index=True)
    source_entity_id = Column(Integer, ForeignKey("entities.id"), nullable=False)
    target_entity_id = Column(Integer, ForeignKey("entities.id"), nullable=False)
    relationship_type = Column(String(64), nullable=False) # MENTIONS, SUPPORTS, CONTRADICTS, BELONGS_TO, RELATED_TO, TRANSACTED_WITH
    evidence_id = Column(Integer, ForeignKey("evidence_files.id"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    investigation = relationship("Investigation", back_populates="relationships")
    source_entity = relationship("Entity", foreign_keys=[source_entity_id])
    target_entity = relationship("Entity", foreign_keys=[target_entity_id])
    evidence = relationship("EvidenceFile")

class Conflict(Base):
    __tablename__ = "conflicts"

    id = Column(Integer, primary_key=True, index=True)
    investigation_id = Column(Integer, ForeignKey("investigations.id"), nullable=False, index=True)
    conflict_code = Column(String(64), index=True, nullable=False) # e.g. CNF-001
    claim_a_id = Column(Integer, ForeignKey("extracted_claims.id"), nullable=False)
    claim_b_id = Column(Integer, ForeignKey("extracted_claims.id"), nullable=False)
    evidence_a_id = Column(Integer, ForeignKey("evidence_files.id"), nullable=False)
    evidence_b_id = Column(Integer, ForeignKey("evidence_files.id"), nullable=False)
    conflict_type = Column(String(64), nullable=False) # QUANTITY_DISCREPANCY, DATE_MISMATCH, STATUS_CONTRADICTION, ATTRIBUTION_CONFLICT, LOCATION_CONFLICT, SEMANTIC_CONTRADICTION
    severity = Column(String(32), default="HIGH") # HIGH, MEDIUM, LOW
    explanation = Column(Text, nullable=False)
    discrepancy_details = Column(Text, nullable=True) # JSON with breakdown
    verification_status = Column(String(50), default="DETECTED") # DETECTED, UNDER_REVIEW, VERIFIED_CONFLICT, RESOLVED_EXPLAINED, DISMISSED
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    investigation = relationship("Investigation", back_populates="conflicts")
    claim_a = relationship("ExtractedClaim", foreign_keys=[claim_a_id])
    claim_b = relationship("ExtractedClaim", foreign_keys=[claim_b_id])
    evidence_a = relationship("EvidenceFile", foreign_keys=[evidence_a_id])
    evidence_b = relationship("EvidenceFile", foreign_keys=[evidence_b_id])

class ReliabilityAssessment(Base):
    __tablename__ = "reliability_assessments"

    id = Column(Integer, primary_key=True, index=True)
    investigation_id = Column(Integer, ForeignKey("investigations.id"), nullable=False, index=True)
    evidence_id = Column(Integer, ForeignKey("evidence_files.id"), nullable=False, unique=True, index=True)
    score = Column(Float, nullable=False) # 0 to 100
    category = Column(String(32), nullable=False) # HIGH (80-100), MODERATE (60-79), LOW (40-59), SUSPICIOUS (0-39)
    provenance_notes = Column(Text, nullable=True)
    authenticity_indicators_json = Column(Text, nullable=True)
    risk_factors_json = Column(Text, nullable=True)
    missing_verification_json = Column(Text, nullable=True)
    recommended_actions_json = Column(Text, nullable=True)
    calculated_at = Column(DateTime, default=datetime.datetime.utcnow)

    evidence = relationship("EvidenceFile", back_populates="reliability")

class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id = Column(Integer, primary_key=True, index=True)
    evidence_id = Column(Integer, ForeignKey("evidence_files.id"), nullable=False, index=True)
    stage = Column(String(64), nullable=False) # UPLOAD, ADVERSARIAL_CHECK, TEXT_EXTRACTION, ENTITY_RESOLUTION, CLAIM_EXTRACTION, CONFLICT_DETECTION, RELIABILITY_SCORING, COMPLETED
    status = Column(String(32), default="PENDING") # PENDING, IN_PROGRESS, COMPLETED, FAILED
    progress = Column(Integer, default=0) # 0 to 100
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    evidence = relationship("EvidenceFile", back_populates="processing_jobs")

class InvestigationReport(Base):
    __tablename__ = "investigation_reports"

    id = Column(Integer, primary_key=True, index=True)
    investigation_id = Column(Integer, ForeignKey("investigations.id"), nullable=False, index=True)
    report_code = Column(String(64), index=True, nullable=False)
    title = Column(String(255), nullable=False)
    executive_summary = Column(Text, nullable=False)
    findings_json = Column(Text, nullable=False)
    report_markdown = Column(Text, nullable=False)
    pdf_file_path = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    investigation = relationship("Investigation", back_populates="reports")
