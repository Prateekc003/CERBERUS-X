import React, { useState } from 'react';
import {
  AlertTriangle,
  FileSearch,
  Network,
  ShieldCheck,
  Filter,
  Save,
  CheckCircle2,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Conflict, ExtractedClaim, Entity, ReliabilityAssessmentItem } from '../types';

interface EvidenceAnalysisProps {
  conflicts: Conflict[];
  claims: ExtractedClaim[];
  entities: Entity[];
  reliability: ReliabilityAssessmentItem[];
  onUpdateConflictStatus: (conflictId: number, status: string, notes?: string) => Promise<void>;
  onMergeEntities: (canonicalId: number, aliasIds: number[]) => Promise<void>;
  loading: boolean;
}

export const EvidenceAnalysis: React.FC<EvidenceAnalysisProps> = ({
  conflicts,
  claims,
  entities,
  reliability,
  onUpdateConflictStatus,
  onMergeEntities,
  loading,
}) => {
  const [subTab, setSubTab] = useState<'conflicts' | 'claims' | 'entities' | 'reliability'>('conflicts');
  const [editingConflictId, setEditingConflictId] = useState<number | null>(null);
  const [resStatus, setResStatus] = useState<string>('');
  const [resNotes, setResNotes] = useState<string>('');
  const [claimSearch, setClaimSearch] = useState<string>('');
  const [entitySearch, setEntitySearch] = useState<string>('');

  const handleStartEditConflict = (c: Conflict) => {
    setEditingConflictId(c.id);
    setResStatus(c.verification_status);
    setResNotes(c.resolution_notes || '');
  };

  const handleSaveConflictStatus = async (id: number) => {
    await onUpdateConflictStatus(id, resStatus, resNotes);
    setEditingConflictId(null);
  };

  return (
    <div className="p-7 space-y-6 max-w-7xl mx-auto text-slate-200">
      {/* Module Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-dark-borderSubtle gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Evidence Analysis & Reasoning Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Deep-dive contradiction auditing, entity disambiguation, claim extraction, and explainable reliability grading.
          </p>
        </div>

        {/* Sub-tab pills */}
        <div className="flex items-center space-x-1.5 bg-dark-sidebar p-1 rounded-xl border border-dark-cardBorder">
          <button
            onClick={() => setSubTab('conflicts')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              subTab === 'conflicts'
                ? 'bg-dark-activeNav text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Contradictions ({conflicts.length})</span>
          </button>

          <button
            onClick={() => setSubTab('claims')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              subTab === 'claims'
                ? 'bg-dark-activeNav text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileSearch className="w-3.5 h-3.5 text-blue-400" />
            <span>Claims ({claims.length})</span>
          </button>

          <button
            onClick={() => setSubTab('entities')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              subTab === 'entities'
                ? 'bg-dark-activeNav text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Network className="w-3.5 h-3.5 text-indigo-400" />
            <span>Entities ({entities.length})</span>
          </button>

          <button
            onClick={() => setSubTab('reliability')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              subTab === 'reliability'
                ? 'bg-dark-activeNav text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Reliability ({reliability.length})</span>
          </button>
        </div>
      </div>

      {/* 1. CONTRADICTIONS SUBTAB */}
      {subTab === 'conflicts' && (
        <div className="space-y-4">
          <div className="bg-dark-card border border-dark-cardBorder rounded-xl p-5 flex items-center justify-between">
            <div>
              <div className="text-xs font-mono font-bold uppercase text-amber-400 flex items-center space-x-1.5 mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span>Active Logistical & Quantitative Conflicts</span>
              </div>
              <p className="text-xs text-slate-400">
                Identifies discrepancies between claimed delivery, signed dock receipts, warehouse dispatches, and inventory counts.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-950/60 text-amber-300 border border-amber-900/60">
              {conflicts.length} Detected
            </span>
          </div>

          <div className="space-y-4">
            {conflicts.map((c) => (
              <div
                key={c.id}
                className="bg-dark-card border border-dark-cardBorder rounded-xl p-5 space-y-4 hover:border-slate-700 transition-all"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-dark-borderSubtle gap-2">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-900/60">
                      {c.conflict_code}
                    </span>
                    <span className="font-mono text-xs font-semibold text-white">
                      {c.conflict_type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase bg-dark-sidebar border border-dark-cardBorder text-slate-300">
                      {c.severity} SEVERITY
                    </span>
                  </div>

                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase bg-accent-greenBadgeBg border border-accent-greenBadgeBorder text-accent-greenBadgeText">
                    {c.verification_status.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Comparative Claim Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-dark-sidebar border border-dark-cardBorder rounded-lg p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span className="font-bold text-white truncate max-w-[220px]">
                        {c.evidence_a_filename}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-dark-card text-slate-300">Assertion A</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed italic bg-dark-card p-2.5 rounded border border-dark-borderSubtle">
                      “{c.claim_a_text}”
                    </p>
                  </div>

                  <div className="bg-dark-sidebar border border-dark-cardBorder rounded-lg p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span className="font-bold text-white truncate max-w-[220px]">
                        {c.evidence_b_filename}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-dark-card text-slate-300">Assertion B</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed italic bg-dark-card p-2.5 rounded border border-dark-borderSubtle">
                      “{c.claim_b_text}”
                    </p>
                  </div>
                </div>

                {/* Explanation */}
                <div className="p-3.5 bg-dark-sidebar border border-dark-borderSubtle rounded-lg text-xs">
                  <div className="flex items-center space-x-1.5 text-blue-400 font-semibold mb-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Investigative Determination:</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{c.explanation}</p>
                </div>

                {/* Status Updater */}
                {editingConflictId === c.id ? (
                  <div className="pt-3 border-t border-dark-borderSubtle space-y-3 bg-dark-sidebar p-3.5 rounded-lg">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                          Status
                        </label>
                        <select
                          value={resStatus}
                          onChange={(e) => setResStatus(e.target.value)}
                          className="w-full text-xs bg-dark-input border border-dark-cardBorder text-white rounded p-1.5"
                        >
                          <option value="DETECTED">DETECTED</option>
                          <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                          <option value="VERIFIED_CONFLICT">VERIFIED_CONFLICT</option>
                          <option value="RESOLVED_EXPLAINED">RESOLVED_EXPLAINED</option>
                          <option value="DISMISSED">DISMISSED</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                          Investigator Notes
                        </label>
                        <input
                          type="text"
                          value={resNotes}
                          onChange={(e) => setResNotes(e.target.value)}
                          className="w-full text-xs bg-dark-input border border-dark-cardBorder text-white rounded p-1.5"
                          placeholder="e.g. Discrepancy confirmed by dock intake manifest."
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-1">
                      <button
                        onClick={() => setEditingConflictId(null)}
                        className="text-xs px-3 py-1 rounded border border-dark-cardBorder text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveConflictStatus(c.id)}
                        disabled={loading}
                        className="text-xs font-semibold px-4 py-1 rounded bg-white text-black hover:bg-slate-200"
                      >
                        Save Determination
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center text-xs pt-2 border-t border-dark-borderSubtle">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {c.resolution_notes ? `Note: ${c.resolution_notes}` : 'No investigator notes added'}
                    </span>
                    <button
                      onClick={() => handleStartEditConflict(c)}
                      className="text-xs text-blue-400 hover:underline font-mono"
                    >
                      Update Verification Status →
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. CLAIMS SUBTAB */}
      {subTab === 'claims' && (
        <div className="bg-dark-card border border-dark-cardBorder rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-dark-borderSubtle flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-slate-300">
              Extracted Substantive Claims ({claims.length})
            </span>
            <input
              type="text"
              value={claimSearch}
              onChange={(e) => setClaimSearch(e.target.value)}
              placeholder="Filter claims..."
              className="text-xs px-3 py-1.5 bg-dark-input border border-dark-cardBorder rounded text-white focus:outline-none w-56"
            />
          </div>

          <div className="divide-y divide-dark-borderSubtle text-xs">
            {claims
              .filter((c) => c.text.toLowerCase().includes(claimSearch.toLowerCase()))
              .map((c) => (
                <div key={c.id} className="p-4 hover:bg-dark-cardHover/60 transition-colors space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-blue-400">{c.claim_code}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-dark-sidebar border border-dark-cardBorder text-slate-300 uppercase">
                        {c.claim_type}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">{c.evidence_filename}</span>
                  </div>

                  <p className="text-white font-medium">{c.text}</p>

                  {c.quantity_val !== undefined && c.quantity_val !== null && (
                    <div className="flex items-center space-x-2 font-mono text-[11px] text-slate-300 pt-1">
                      <span>Quantity: <strong className="text-white">{c.quantity_val} {c.quantity_unit}</strong></span>
                      <span>•</span>
                      <span>Action: <strong className="text-blue-400 uppercase">{c.quantity_action || 'stated'}</strong></span>
                      <span>•</span>
                      <span>Location: {c.page_or_location || 'Page 1'}</span>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 3. ENTITIES SUBTAB */}
      {subTab === 'entities' && (
        <div className="bg-dark-card border border-dark-cardBorder rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-dark-borderSubtle flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-slate-300">
              Resolved Entity Registry ({entities.length})
            </span>
            <input
              type="text"
              value={entitySearch}
              onChange={(e) => setEntitySearch(e.target.value)}
              placeholder="Filter entities..."
              className="text-xs px-3 py-1.5 bg-dark-input border border-dark-cardBorder rounded text-white focus:outline-none w-56"
            />
          </div>

          <div className="divide-y divide-dark-borderSubtle text-xs">
            {entities
              .filter((e) => e.name.toLowerCase().includes(entitySearch.toLowerCase()))
              .map((e) => (
                <div key={e.id} className="p-4 flex items-center justify-between hover:bg-dark-cardHover/60 transition-colors">
                  <div className="flex items-center space-x-3">
                    <span className="w-8 h-8 rounded-lg bg-dark-sidebar border border-dark-cardBorder flex items-center justify-center font-bold text-xs text-white">
                      {e.name.charAt(0)}
                    </span>
                    <div>
                      <h4 className="font-semibold text-white">{e.name}</h4>
                      <p className="text-[10px] font-mono text-slate-400">
                        Normalized: {e.normalized_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-dark-sidebar border border-dark-cardBorder text-slate-300">
                      {e.entity_type}
                    </span>
                    <span className="font-mono text-xs text-slate-300">
                      {e.mention_count} mention(s)
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 4. RELIABILITY SUBTAB */}
      {subTab === 'reliability' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reliability.map((r) => (
            <div
              key={r.id}
              className="bg-dark-card border border-dark-cardBorder rounded-xl p-5 space-y-3.5 hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between pb-2 border-b border-dark-borderSubtle">
                <span className="font-semibold text-white text-xs truncate max-w-[200px]" title={r.filename}>
                  {r.filename}
                </span>
                <span
                  className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold ${
                    r.category === 'HIGH'
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-900/60'
                      : r.category === 'MODERATE'
                      ? 'bg-sky-950/60 text-sky-300 border border-sky-900/60'
                      : r.category === 'LOW'
                      ? 'bg-amber-950/60 text-amber-300 border border-amber-900/60'
                      : 'bg-rose-950/60 text-rose-300 border border-rose-900/60'
                  }`}
                >
                  {r.score}/100 ({r.category})
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-mono">
                {r.provenance_notes}
              </p>

              <div className="space-y-1 text-xs">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                  Authenticity Factors ({r.authenticity_indicators.length}):
                </span>
                <ul className="list-disc pl-4 text-[11px] text-slate-300 space-y-0.5">
                  {r.authenticity_indicators.map((ind, i) => (
                    <li key={i}>{ind}</li>
                  ))}
                </ul>
              </div>

              {r.risk_factors && r.risk_factors.length > 0 && (
                <div className="space-y-1 text-xs">
                  <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block">
                    Limitations ({r.risk_factors.length}):
                  </span>
                  <ul className="list-disc pl-4 text-[11px] text-slate-400 space-y-0.5">
                    {r.risk_factors.map((rf, i) => (
                      <li key={i}>{rf}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
