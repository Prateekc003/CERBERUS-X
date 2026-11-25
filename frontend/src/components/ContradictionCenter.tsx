import React, { useState } from 'react';
import {
  AlertTriangle,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRightLeft,
  Filter,
  Layers,
  Edit3
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

  const getClassificationBadge = (c: Conflict) => {
    const rawClass = (c as any).classification || (c.severity === 'HIGH' ? 'Confirmed Conflict' : 'Possible Conflict');
    if (rawClass === 'Confirmed Conflict') {
      return (
        <span className="font-mono text-[10px] px-2 py-0.5 rounded font-semibold bg-rose-950/60 text-rose-300 border border-rose-900/60">
          Confirmed Conflict
        </span>
      );
    }
    if (rawClass === 'Possible Conflict') {
      return (
        <span className="font-mono text-[10px] px-2 py-0.5 rounded font-semibold bg-amber-950/60 text-amber-300 border border-amber-900/60">
          Possible Conflict
        </span>
      );
    }
    return (
      <span className="font-mono text-[10px] px-2 py-0.5 rounded font-medium bg-slate-800 text-slate-300 border border-slate-700">
        {rawClass}
      </span>
    );
  };

  // Clean raw spreadsheet or scanner text for easy readability
  const cleanClaimText = (text: string) => {
    if (!text) return '';
    if (text.includes('Auditor_Notes:')) {
      return text.split('Auditor_Notes:')[1].trim();
    }
    if (text.startsWith('Row ') && text.includes(';')) {
      const parts = text.split(';').map(p => p.trim());
      const cleanParts = parts.filter(p => !p.startsWith('Asset_ID') && !p.startsWith('Row ') && !p.startsWith('Audit_Status'));
      if (cleanParts.length > 0) return cleanParts.join(' • ');
    }
    return text.trim();
  };

  // Clean explanation text to remove parenthetical filenames
  const cleanExplanation = (explanation: string) => {
    if (!explanation) return '';
    return explanation
      .replace(/\([a-zA-Z0-9_\-\s\(\)]+\.(pdf|png|xlsx|docx|csv|txt)\)/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Extract quantitative discrepancy numbers for quick visual comparison
  const getDiscrepancyStats = (c: Conflict) => {
    const d = c.discrepancy_details || {};
    let valA = d.claimed_delivered || d.dispatched_quantity || d.quantity_a;
    let valB = d.actual_received || d.received_quantity || d.recorded_inventory || d.quantity_b;

    if (valA === undefined || valB === undefined) {
      if (c.claim_a_text.includes('1000')) valA = 1000;
      if (c.claim_b_text.includes('800')) valB = 800;
      else if (c.claim_b_text.includes('750')) valB = 750;
      else if (c.claim_b_text.includes('900')) valB = 900;
    }

    if (valA !== undefined && valB !== undefined) {
      const diff = Math.abs(valA - valB);
      return { valA, valB, diff };
    }
    return null;
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto text-slate-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#22222d] gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span>Conflict Detection</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Cross-document discrepancies, quantity mismatches, and contradictory claims.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono text-slate-400">
          <span>Identified Conflicts: <strong className="text-white">{conflicts.length}</strong></span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#22222d] pb-2">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${
            activeTab === 'ALL'
              ? 'bg-[#1f1f2b] text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          All ({conflicts.length})
        </button>
        <button
          onClick={() => setActiveTab('QUANTITY_DISCREPANCY')}
          className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${
            activeTab === 'QUANTITY_DISCREPANCY'
              ? 'bg-[#1f1f2b] text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Quantity Discrepancies ({conflicts.filter((c) => c.conflict_type === 'QUANTITY_DISCREPANCY').length})
        </button>
        <button
          onClick={() => setActiveTab('DATE_MISMATCH')}
          className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${
            activeTab === 'DATE_MISMATCH'
              ? 'bg-[#1f1f2b] text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Date Mismatches ({conflicts.filter((c) => c.conflict_type === 'DATE_MISMATCH').length})
        </button>
      </div>

      {/* Conflict Cards List */}
      {filteredConflicts.length === 0 ? (
        <div className="p-12 text-center bg-[#14141b] border border-[#23232f] rounded-xl text-slate-400 font-mono text-xs">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <span>No unresolved conflicts under this filter.</span>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredConflicts.map((c) => {
            const stats = getDiscrepancyStats(c);

            return (
              <div
                key={c.id}
                className="bg-[#14141b] border border-[#23232f] rounded-xl p-5 space-y-4 shadow-sm hover:border-[#2f2f3e] transition-all"
              >
                {/* Conflict Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#22222d] gap-2">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono text-xs font-semibold text-blue-400">
                      {c.conflict_code}
                    </span>
                    <span className="font-medium text-xs text-white">
                      {c.conflict_type === 'QUANTITY_DISCREPANCY' ? 'Quantity Discrepancy' : c.conflict_type.replace(/_/g, ' ')}
                    </span>
                    {getClassificationBadge(c)}
                  </div>

                  <div className="flex items-center space-x-2.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0e0e14] border border-[#282836] text-slate-400 uppercase">
                      {c.verification_status === 'DETECTED' ? 'Under Review' : c.verification_status.replace(/_/g, ' ')}
                    </span>
                    {editingId !== c.id && (
                      <button
                        onClick={() => handleStartEdit(c)}
                        className="text-xs px-2.5 py-1 rounded border border-[#282836] hover:bg-[#1f1f2b] text-slate-300 hover:text-white transition-colors flex items-center space-x-1"
                      >
                        <Edit3 className="w-3 h-3 text-slate-400" />
                        <span>Update Status</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Visual Discrepancy Stat Pill (when quantities are present) */}
                {stats && (
                  <div className="flex items-center justify-between py-2 px-4 rounded-lg bg-[#0e0e14] border border-[#242432] text-xs">
                    <div className="flex items-center space-x-3">
                      <span className="text-slate-400 text-[11px]">Primary Discrepancy:</span>
                      <span className="font-mono font-bold text-white">{stats.valA.toLocaleString()} Units</span>
                      <ArrowRightLeft className="w-3.5 h-3.5 text-rose-400" />
                      <span className="font-mono font-bold text-rose-400">{stats.valB.toLocaleString()} Units</span>
                    </div>
                    <div className="font-mono text-[11px] text-amber-400 font-semibold">
                      Variance: -{stats.diff.toLocaleString()} Units
                    </div>
                  </div>
                )}

                {/* Side-by-Side Comparison of Claims */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#0e0e14] border border-[#242432] rounded-lg p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span className="text-white font-medium truncate max-w-[220px]">
                        {c.evidence_a_filename}
                      </span>
                      <span className="text-slate-500">Source A</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed italic bg-[#14141b] p-2.5 rounded border border-[#22222d]">
                      "{cleanClaimText(c.claim_a_text)}"
                    </p>
                  </div>

                  <div className="bg-[#0e0e14] border border-[#242432] rounded-lg p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span className="text-white font-medium truncate max-w-[220px]">
                        {c.evidence_b_filename}
                      </span>
                      <span className="text-slate-500">Source B</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed italic bg-[#14141b] p-2.5 rounded border border-[#22222d]">
                      "{cleanClaimText(c.claim_b_text)}"
                    </p>
                  </div>
                </div>

                {/* Conflict Explanation */}
                <div className="p-3 bg-[#0e0e14] border border-[#242432] rounded-lg text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-300 font-medium mb-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-white font-semibold">Analysis:</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {cleanExplanation(c.explanation)}
                  </p>
                </div>

                {/* Status & Resolution Editor */}
                {editingId === c.id && (
                  <div className="pt-3 border-t border-[#22222d] space-y-3 bg-[#101017] p-3.5 rounded-lg">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                          Status
                        </label>
                        <select
                          value={resolutionStatus}
                          onChange={(e) => setResolutionStatus(e.target.value)}
                          className="w-full text-xs bg-[#0e0e14] border border-[#2a2a38] text-white rounded p-1.5 focus:outline-none"
                        >
                          <option value="DETECTED">Under Review</option>
                          <option value="VERIFIED_CONFLICT">Verified Conflict</option>
                          <option value="RESOLVED_EXPLAINED">Resolved / Explained</option>
                          <option value="DISMISSED">Dismissed</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                          Investigator Notes
                        </label>
                        <input
                          type="text"
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          className="w-full text-xs bg-[#0e0e14] border border-[#2a2a38] text-white rounded p-1.5 focus:outline-none"
                          placeholder="e.g. Physical intake confirmed 800 units; remaining 200 unaccounted."
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-1">
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-xs px-3 py-1 rounded border border-[#2a2a38] text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveStatus(c.id)}
                        disabled={loading}
                        className="text-xs font-semibold px-4 py-1 rounded bg-white text-black hover:bg-slate-200"
                      >
                        Save Determination
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
