import {
  Investigation,
  EvidenceFile,
  ExtractedClaim,
  Entity,
  Conflict,
  ReliabilityAssessmentItem,
  KnowledgeGraphData,
  AssistantResponse,
  DashboardOverview,
  ReportData
} from '../types';

const BASE_URL = '/api';

export const api = {
  // System & Dashboard
  getSystemStatus: async () => {
    const res = await fetch(`${BASE_URL}/system/status`);
    if (!res.ok) throw new Error('Failed to fetch system status');
    return res.json();
  },

  getDashboardOverview: async (investigationId?: number): Promise<DashboardOverview> => {
    const url = investigationId
      ? `${BASE_URL}/dashboard/overview?investigation_id=${investigationId}`
      : `${BASE_URL}/dashboard/overview`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch dashboard overview');
    return res.json();
  },

  // Investigations
  getInvestigations: async (): Promise<Investigation[]> => {
    const res = await fetch(`${BASE_URL}/investigations`);
    if (!res.ok) throw new Error('Failed to fetch investigations');
    return res.json();
  },

  createInvestigation: async (title: string, description?: string): Promise<Investigation> => {
    const res = await fetch(`${BASE_URL}/investigations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
    });
    if (!res.ok) throw new Error('Failed to create investigation');
    return res.json();
  },

  triggerDemoSeed: async () => {
    const res = await fetch(`${BASE_URL}/investigations/demo-seed`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to trigger demo seed');
    return res.json();
  },

  // Evidence
  getEvidenceList: async (investigationId?: number): Promise<EvidenceFile[]> => {
    const url = investigationId
      ? `${BASE_URL}/evidence?investigation_id=${investigationId}`
      : `${BASE_URL}/evidence`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch evidence list');
    return res.json();
  },

  getEvidenceDetail: async (id: number): Promise<EvidenceFile> => {
    const res = await fetch(`${BASE_URL}/evidence/${id}`);
    if (!res.ok) throw new Error('Failed to fetch evidence detail');
    return res.json();
  },

  uploadEvidence: async (investigationId: number, files: File[], sourceAttribution?: string) => {
    const formData = new FormData();
    formData.append('investigation_id', investigationId.toString());
    if (sourceAttribution) {
      formData.append('source_attribution', sourceAttribution);
    }
    for (const file of files) {
      formData.append('files', file);
    }

    const res = await fetch(`${BASE_URL}/evidence/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  deleteEvidence: async (id: number) => {
    const res = await fetch(`${BASE_URL}/evidence/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete evidence');
    return res.json();
  },

  // Claims & Entities
  getClaims: async (investigationId?: number, evidenceId?: number): Promise<ExtractedClaim[]> => {
    let url = `${BASE_URL}/claims`;
    const params = new URLSearchParams();
    if (investigationId) params.append('investigation_id', investigationId.toString());
    if (evidenceId) params.append('evidence_id', evidenceId.toString());
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch claims');
    return res.json();
  },

  getEntities: async (investigationId?: number): Promise<Entity[]> => {
    const url = investigationId
      ? `${BASE_URL}/entities?investigation_id=${investigationId}`
      : `${BASE_URL}/entities`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch entities');
    return res.json();
  },

  mergeEntities: async (canonicalId: number, aliasIds: number[]) => {
    const res = await fetch(`${BASE_URL}/entities/merge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ canonical_entity_id: canonicalId, alias_entity_ids: aliasIds }),
    });
    if (!res.ok) throw new Error('Failed to merge entities');
    return res.json();
  },

  // Knowledge Graph & Conflicts
  getKnowledgeGraph: async (investigationId?: number): Promise<KnowledgeGraphData> => {
    const url = investigationId
      ? `${BASE_URL}/knowledge-graph?investigation_id=${investigationId}`
      : `${BASE_URL}/knowledge-graph`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch knowledge graph');
    return res.json();
  },

  getConflicts: async (investigationId?: number): Promise<Conflict[]> => {
    const url = investigationId
      ? `${BASE_URL}/conflicts?investigation_id=${investigationId}`
      : `${BASE_URL}/conflicts`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch conflicts');
    return res.json();
  },

  updateConflictStatus: async (conflictId: number, status: string, notes?: string) => {
    const res = await fetch(`${BASE_URL}/conflicts/${conflictId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verification_status: status, resolution_notes: notes }),
    });
    if (!res.ok) throw new Error('Failed to update conflict status');
    return res.json();
  },

  // Reliability
  getReliability: async (investigationId?: number): Promise<ReliabilityAssessmentItem[]> => {
    const url = investigationId
      ? `${BASE_URL}/reliability?investigation_id=${investigationId}`
      : `${BASE_URL}/reliability`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch reliability assessments');
    return res.json();
  },

  // Assistant Query
  queryAssistant: async (
    investigationId: number,
    query: string,
    mode: string = 'auto'
  ): Promise<AssistantResponse> => {
    const res = await fetch(`${BASE_URL}/assistant/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        investigation_id: investigationId,
        query,
        preferred_mode: mode,
      }),
    });
    if (!res.ok) throw new Error('Failed to process assistant query');
    return res.json();
  },

  // Reports
  generateReport: async (investigationId: number, title?: string): Promise<ReportData> => {
    const res = await fetch(`${BASE_URL}/reports/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ investigation_id: investigationId, title }),
    });
    if (!res.ok) throw new Error('Failed to generate report');
    return res.json();
  },
};
