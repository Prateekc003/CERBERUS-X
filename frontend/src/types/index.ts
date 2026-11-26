export interface Investigation {
  id: number;
  case_code: string;
  title: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
  evidence_count: number;
  claims_count: number;
  conflicts_count: number;
  high_risk_count: number;
}

export interface EvidenceFile {
  id: number;
  investigation_id: number;
  evidence_code: string;
  filename: string;
  file_type: string;
  file_size_bytes: number;
  sha256_hash: string;
  mime_type?: string;
  uploaded_at: string;
  status: string;
  source_attribution?: string;
  ocr_applied: boolean;
  adversarial_flagged: boolean;
  metadata?: Record<string, any>;
  claims_count?: number;
  reliability_score?: number;
  reliability_category?: string;
  extracted_text?: string;
  adversarial_report?: {
    is_flagged: boolean;
    risk_score: number;
    flags: string[];
    flag_count: number;
    suspicious_snippets: string[];
    safe_to_process: boolean;
    disclaimer: string;
  };
  reliability_details?: {
    score: number;
    category: string;
    provenance_notes: string;
    authenticity_indicators: string[];
    risk_factors: string[];
    missing_verification: string[];
  };
}

export interface ExtractedClaim {
  id: number;
  investigation_id: number;
  evidence_id: number;
  evidence_filename?: string;
  claim_code: string;
  text: string;
  claim_type: string;
  subject?: string;
  predicate?: string;
  object_val?: string;
  quantity_val?: number;
  quantity_unit?: string;
  quantity_action?: string;
  date_val?: string;
  location_val?: string;
  page_or_location?: string;
  confidence: number;
  raw_snippet?: string;
  created_at: string;
}

export interface Entity {
  id: number;
  investigation_id: number;
  name: string;
  normalized_name: string;
  entity_type: string;
  mention_count: number;
  alias_of_id?: number;
  aliases: string[];
}

export interface Conflict {
  id: number;
  investigation_id: number;
  conflict_code: string;
  claim_a_id: number;
  claim_b_id: number;
  claim_a_text: string;
  claim_b_text: string;
  evidence_a_filename: string;
  evidence_b_filename: string;
  conflict_type: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  explanation: string;
  discrepancy_details?: {
    quantity_a?: number;
    quantity_b?: number;
    action_a?: string;
    action_b?: string;
    variance?: number;
    category?: string;
    claimed_delivered?: number;
    actual_received?: number;
    missing_quantity?: number;
    dispatched_quantity?: number;
    received_quantity?: number;
    in_transit_shortfall?: number;
    recorded_inventory?: number;
    unaccounted_in_ledger?: number;
    warehouse_dispatched?: number;
    origin_shortfall?: number;
  };
  verification_status: string;
  resolution_notes?: string;
  created_at: string;
}

export interface ReliabilityAssessmentItem {
  id: number;
  evidence_id: number;
  evidence_code: string;
  filename: string;
  score: number;
  category: 'HIGH' | 'MODERATE' | 'LOW' | 'SUSPICIOUS';
  provenance_notes?: string;
  authenticity_indicators: string[];
  risk_factors: string[];
  missing_verification: string[];
  recommended_actions: string[];
}

export interface KnowledgeGraphData {
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: {
      id: string;
      nodeType: 'DOCUMENT' | 'CLAIM' | 'ENTITY' | 'CONFLICT' | 'PROJECT';
      label: string;
      sublabel?: string;
      category?: string;
      hasConflict?: boolean;
      isOrange?: boolean;
      payload: any;
    };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label?: string;
    type: string;
    animated?: boolean;
    style?: Record<string, any>;
    data?: any;
  }>;
  stats: {
    total_nodes: number;
    documents_count: number;
    claims_count: number;
    entities_count: number;
    total_edges: number;
    conflict_edges: number;
  };
}

export interface AssistantCitation {
  evidence_id: number;
  filename: string;
  page_or_location?: string;
  claim_snippet: string;
  reliability_category: string;
}

export interface AssistantResponse {
  answer: string;
  reasoning_mode: 'OLLAMA_LOCAL_LLM' | 'RULE_BASED_INFERENCE';
  is_sufficient_evidence: boolean;
  confidence_score: number;
  citations: AssistantCitation[];
  supporting_claims: string[];
  contradicting_claims: string[];
  key_findings: string[];
}

export interface DashboardOverview {
  total_investigations: number;
  total_evidence_files: number;
  total_extracted_claims: number;
  total_identified_entities: number;
  total_detected_conflicts: number;
  high_risk_evidence_count: number;
  conflict_distribution: Record<string, number>;
  reliability_breakdown: Record<string, number>;
  recent_activity: Array<{
    type: string;
    title: string;
    code: string;
    timestamp: string;
    details: string;
  }>;
  system_status: {
    is_online: boolean;
    ollama_connected: boolean;
    active_mode: string;
  };
}

export interface ReportData {
  id: number;
  report_code: string;
  title: string;
  executive_summary: string;
  findings: Record<string, any>;
  report_markdown: string;
  pdf_download_url?: string;
  created_at: string;
}
