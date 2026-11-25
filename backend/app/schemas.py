from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict, Any
import datetime

# --- Investigation Schemas ---
class InvestigationBase(BaseModel):
    title: str
    description: Optional[str] = None

class InvestigationCreate(InvestigationBase):
    pass

class InvestigationResponse(InvestigationBase):
    id: int
    case_code: str
    status: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
    evidence_count: Optional[int] = 0
    claims_count: Optional[int] = 0
    conflicts_count: Optional[int] = 0
    high_risk_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)

# --- Evidence Schemas ---
class EvidenceResponse(BaseModel):
    id: int
    investigation_id: int
    evidence_code: str
    filename: str
    file_type: str
    file_size_bytes: int
    sha256_hash: str
    mime_type: Optional[str]
    uploaded_at: datetime.datetime
    status: str
    source_attribution: Optional[str]
    ocr_applied: bool
    adversarial_flagged: bool
    metadata: Optional[Dict[str, Any]] = None
    claims_count: Optional[int] = 0
    reliability_score: Optional[float] = None
    reliability_category: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class EvidenceDetailResponse(EvidenceResponse):
    extracted_text: Optional[str] = None
    adversarial_report: Optional[Dict[str, Any]] = None
    reliability_details: Optional[Dict[str, Any]] = None

# --- Claims Schemas ---
class ClaimResponse(BaseModel):
    id: int
    investigation_id: int
    evidence_id: int
    evidence_filename: Optional[str] = None
    claim_code: str
    text: str
    claim_type: str
    subject: Optional[str] = None
    predicate: Optional[str] = None
    object_val: Optional[str] = None
    quantity_val: Optional[float] = None
    quantity_unit: Optional[str] = None
    quantity_action: Optional[str] = None
    date_val: Optional[str] = None
    location_val: Optional[str] = None
    page_or_location: Optional[str] = None
    confidence: float
    raw_snippet: Optional[str] = None
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

# --- Entity Schemas ---
class EntityResponse(BaseModel):
    id: int
    investigation_id: int
    name: str
    normalized_name: str
    entity_type: str
    mention_count: int
    alias_of_id: Optional[int] = None
    aliases: Optional[List[str]] = []

    model_config = ConfigDict(from_attributes=True)

class EntityMergeRequest(BaseModel):
    canonical_entity_id: int
    alias_entity_ids: List[int]

# --- Conflict Schemas ---
class ConflictResponse(BaseModel):
    id: int
    investigation_id: int
    conflict_code: str
    claim_a_id: int
    claim_b_id: int
    claim_a_text: str
    claim_b_text: str
    evidence_a_filename: str
    evidence_b_filename: str
    conflict_type: str
    severity: str
    explanation: str
    discrepancy_details: Optional[Dict[str, Any]] = None
    verification_status: str
    resolution_notes: Optional[str] = None
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class ConflictStatusUpdate(BaseModel):
    verification_status: str
    resolution_notes: Optional[str] = None

# --- Reliability Schemas ---
class ReliabilityResponse(BaseModel):
    id: int
    evidence_id: int
    evidence_code: str
    filename: str
    score: float
    category: str
    provenance_notes: Optional[str]
    authenticity_indicators: List[str]
    risk_factors: List[str]
    missing_verification: List[str]
    recommended_actions: List[str]

# --- Knowledge Graph Schemas ---
class GraphNodePosition(BaseModel):
    x: float
    y: float

class GraphNode(BaseModel):
    id: str
    type: str
    position: Optional[GraphNodePosition] = None
    data: Dict[str, Any]

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None
    type: Optional[str] = "smoothstep"
    animated: Optional[bool] = False
    style: Optional[Dict[str, Any]] = None
    data: Optional[Dict[str, Any]] = None

class KnowledgeGraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    stats: Dict[str, int]

# --- Assistant Schemas ---
class AssistantQueryRequest(BaseModel):
    investigation_id: int
    query: str
    preferred_mode: Optional[str] = "auto" # auto, ollama, rule-based

class AssistantCitation(BaseModel):
    evidence_id: int
    filename: str
    page_or_location: Optional[str]
    claim_snippet: str
    reliability_category: str

class AssistantQueryResponse(BaseModel):
    answer: str
    reasoning_mode: str # OLLAMA_LOCAL_LLM or RULE_BASED_INFERENCE
    is_sufficient_evidence: bool
    confidence_score: float
    citations: List[AssistantCitation]
    supporting_claims: List[str]
    contradicting_claims: List[str]
    key_findings: List[str]

# --- Report Schemas ---
class ReportGenerateRequest(BaseModel):
    investigation_id: int
    title: Optional[str] = None

class ReportResponse(BaseModel):
    id: int
    report_code: str
    title: str
    executive_summary: str
    findings: Dict[str, Any]
    report_markdown: str
    pdf_download_url: Optional[str] = None
    created_at: datetime.datetime

# --- Overview Dashboard Stats ---
class DashboardOverviewResponse(BaseModel):
    total_investigations: int
    total_evidence_files: int
    total_extracted_claims: int
    total_identified_entities: int
    total_detected_conflicts: int
    high_risk_evidence_count: int
    conflict_distribution: Dict[str, int]
    reliability_breakdown: Dict[str, int]
    recent_activity: List[Dict[str, Any]]
    system_status: Dict[str, Any]
