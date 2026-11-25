import React, { useState } from 'react';
import {
  AlertTriangle,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
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

  const getClassificationBadge = (c: Conflict) => {
    const rawClass = (c as any).classification || (c.severity === 'HIGH' ? 'Confirmed Conflict' : 'Possible Conflict');
    if (rawClass === 'Confirmed Conflict') {
      return (
        <span className="font-mono text-[10px] px-2 py-0.5 rounded font-medium bg-rose-950/60 text-rose-300 border border-rose-900/60">
          Confirmed Conflict
        </span>
      );
    }
    if (rawClass === 'Possible Conflict') {
      return (
        <span className="font-mono text-[10px] px-2 py-0.5 rounded font-medium bg-amber-950/60 text-amber-300 border border-amber-900/60">
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
          {filteredConflicts.map((c) => (
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
                    {c.conflict_type.replace(/_/g, ' ')}
                  </span>
                  {getClassificationBadge(c)}
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0e0e14] border border-[#282836] text-slate-300 uppercase">
                    {c.verification_status.replace(/_/g, ' ')}
                  </span>
                  {editingId !== c.id && (
                    <button
                      onClick={() => handleStartEdit(c)}
                      className="text-xs text-blue-400 hover:underline font-mono"
                    >
                      Update Status
                    </button>
                  )}
                </div>
              </div>

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
                    "{c.claim_a_text}"
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
                    "{c.claim_b_text}"
                  </p>
                </div>
              </div>

              {/* Conflict Explanation */}
              <div className="p-3 bg-[#0e0e14] border border-[#242432] rounded-lg text-xs">
                <div className="flex items-center space-x-1.5 text-slate-300 font-medium mb-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-white font-semibold">Analysis:</span>
                </div>
                <p className="text-slate-300 leading-relaxed">{c.explanation}</p>
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
                        <option value="DETECTED">Detected</option>
                        <option value="UNDER_REVIEW">Under Review</option>
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
                        placeholder="e.g. Dock receipt confirms 800 units; remaining 200 unreceived."
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
                      Save Status
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
