import React, { useState } from 'react';
import {
  AlertTriangle,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
  ArrowRight,
  Save,
  Clock,
  Filter,
  Layers
} from 'lucide-react';
import { Conflict } from '../types';

interface ContradictionCenterProps {
  conflicts: Conflict[];
  onUpdateStatus: (conflictId: number, status: string, notes?: string) => Promise<void>;
  loading: boolean;
}

export const ContradictionCenter: React.FC<ContradictionCenterProps> = ({
  conflicts,
  onUpdateStatus,
  loading,
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'QUANTITY_DISCREPANCY' | 'DATE_MISMATCH' | 'OTHER'>('ALL');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<string>('');
  const [resolutionNotes, setResolutionNotes] = useState<string>('');

  const filteredConflicts = conflicts.filter((c) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'OTHER') return c.conflict_type !== 'QUANTITY_DISCREPANCY' && c.conflict_type !== 'DATE_MISMATCH';
    return c.conflict_type === activeTab;
  });

  const handleStartEdit = (c: Conflict) => {
    setEditingId(c.id);
    setResolutionStatus(c.verification_status);
    setResolutionNotes(c.resolution_notes || '');
  };

  const handleSaveStatus = async (conflictId: number) => {
    await onUpdateStatus(conflictId, resolutionStatus, resolutionNotes);
    setEditingId(null);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Module Title Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-red-600 font-bold uppercase mb-1">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>PRIMARY AUDIT ENGINE: CONTRADICTION & DISCREPANCY AUDITOR</span>
          </div>
          <h1 className="text-xl font-bold text-navy-900 tracking-tight">
            Cross-Document Evidentiary Conflicts ({conflicts.length})
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Detects quantitative variance across custody stages (dispatched vs received vs recorded),
            chronological impossibilities, and conflicting status assertions across independent evidence sources.
          </p>
        </div>

        {/* Conflict count summary pill */}
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 shrink-0 flex items-center space-x-3 text-red-900">
          <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
          <div>
            <div className="text-xs font-mono font-bold uppercase">Active Contradictions</div>
            <div className="text-lg font-mono font-extrabold text-red-700">{conflicts.length} Identified</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`text-xs font-mono px-3 py-1.5 rounded transition-colors ${
            activeTab === 'ALL'
              ? 'bg-navy-900 text-white font-semibold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Conflicts ({conflicts.length})
        </button>
        <button
          onClick={() => setActiveTab('QUANTITY_DISCREPANCY')}
          className={`text-xs font-mono px-3 py-1.5 rounded transition-colors ${
            activeTab === 'QUANTITY_DISCREPANCY'
              ? 'bg-red-700 text-white font-semibold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Quantity Discrepancies ({conflicts.filter((c) => c.conflict_type === 'QUANTITY_DISCREPANCY').length})
        </button>
        <button
          onClick={() => setActiveTab('DATE_MISMATCH')}
          className={`text-xs font-mono px-3 py-1.5 rounded transition-colors ${
            activeTab === 'DATE_MISMATCH'
              ? 'bg-amber-600 text-white font-semibold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Temporal / Date Mismatches ({conflicts.filter((c) => c.conflict_type === 'DATE_MISMATCH').length})
        </button>
      </div>

      {/* Conflict Cards List */}
      {filteredConflicts.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-lg text-slate-400 font-mono text-xs">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <span>No unresolved conflicts under this filter. All assertions reconciled.</span>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredConflicts.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-slate-200 rounded-lg shadow-sm hover:border-slate-300 transition-all overflow-hidden"
            >
              {/* Conflict Header */}
              <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200">
                    {c.conflict_code}
                  </span>
                  <span className="font-mono text-xs font-semibold text-slate-800">
                    {c.conflict_type.replace(/_/g, ' ')}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      c.severity === 'HIGH'
                        ? 'bg-red-600 text-white'
                        : c.severity === 'MEDIUM'
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-600 text-white'
                    }`}
                  >
                    {c.severity} SEVERITY
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-mono text-slate-500">Status:</span>
                  <span
                    className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase ${
                      c.verification_status === 'DETECTED'
                        ? 'bg-red-100 text-red-800 border border-red-300'
                        : c.verification_status === 'UNDER_REVIEW'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : c.verification_status === 'RESOLVED_EXPLAINED'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {c.verification_status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Side-by-side Comparative Evidence Display */}
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Claim A */}
                  <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 space-y-2 relative">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span className="font-bold text-navy-900 flex items-center space-x-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span className="truncate max-w-[220px]">{c.evidence_a_filename}</span>
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">Assertion A</span>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded text-xs font-medium text-slate-800 leading-relaxed italic">
                      “{c.claim_a_text}”
                    </div>
                  </div>

                  {/* Claim B */}
                  <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 space-y-2 relative">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span className="font-bold text-navy-900 flex items-center space-x-1.5">
                        <FileText className="w-3.5 h-3.5 text-red-600" />
                        <span className="truncate max-w-[220px]">{c.evidence_b_filename}</span>
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">Assertion B</span>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded text-xs font-medium text-slate-800 leading-relaxed italic">
                      “{c.claim_b_text}”
                    </div>
                  </div>
                </div>

                {/* Analytical Explanation */}
                <div className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-lg">
                  <p className="text-xs font-semibold text-navy-900 mb-1 flex items-center space-x-1.5">
                    <AlertCircle className="w-4 h-4 text-blue-700" />
                    <span>Investigative Conflict Analysis:</span>
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed">{c.explanation}</p>
                </div>

                {/* Status Update / Review Notes */}
                {editingId === c.id ? (
                  <div className="pt-3 border-t border-slate-200 space-y-3 bg-slate-50 p-4 rounded-lg">
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-700">
                      Investigator Resolution Workflow
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-mono uppercase text-slate-500 block mb-1">
                          Verification Status
                        </label>
                        <select
                          value={resolutionStatus}
                          onChange={(e) => setResolutionStatus(e.target.value)}
                          className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white"
                        >
                          <option value="DETECTED">DETECTED</option>
                          <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                          <option value="VERIFIED_CONFLICT">VERIFIED_CONFLICT</option>
                          <option value="RESOLVED_EXPLAINED">RESOLVED_EXPLAINED</option>
                          <option value="DISMISSED">DISMISSED</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-mono uppercase text-slate-500 block mb-1">
                          Auditor Resolution Notes
                        </label>
                        <input
                          type="text"
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          placeholder="e.g. Subpoenaed warehouse receipt confirms 200 units damaged in transit."
                          className="w-full text-xs border border-slate-300 rounded px-3 py-1.5 bg-white"
                        >
                        </input>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-xs px-3 py-1 rounded border border-slate-300 text-slate-600 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveStatus(c.id)}
                        disabled={loading}
                        className="text-xs font-medium px-4 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-1.5 shadow-sm"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Determination</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500 gap-2">
                    <div className="font-mono text-[11px]">
                      {c.resolution_notes ? (
                        <span>Notes: <strong className="text-slate-700">{c.resolution_notes}</strong></span>
                      ) : (
                        <span className="text-slate-400 italic">No investigator notes recorded yet.</span>
                      )}
                    </div>

                    <button
                      onClick={() => handleStartEdit(c)}
                      className="text-xs text-blue-700 hover:underline font-mono"
                    >
                      Update Verification Status →
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
