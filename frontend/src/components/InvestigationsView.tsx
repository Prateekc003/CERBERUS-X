import React from 'react';
import { Folder, Plus, FileText, Calendar, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { Investigation } from '../types';

interface InvestigationsViewProps {
  investigations: Investigation[];
  currentInvestigation: Investigation | null;
  onSelectInvestigation: (inv: Investigation) => void;
  onNewInvestigation: () => void;
  onNavigate: (tab: any) => void;
}

export const InvestigationsView: React.FC<InvestigationsViewProps> = ({
  investigations,
  currentInvestigation,
  onSelectInvestigation,
  onNewInvestigation,
  onNavigate,
}) => {
  return (
    <div
      style={{ backgroundColor: '#0d0d12' }}
      className="min-h-screen p-8 max-w-5xl mx-auto space-y-6 text-white bg-[#0d0d12]"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#23232f]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
            Investigation Case Files
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage, select, and review active evidence investigation workspaces.
          </p>
        </div>

        <button
          onClick={onNewInvestigation}
          className="flex items-center space-x-2 bg-white hover:bg-slate-200 text-black text-xs font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>New Investigation</span>
        </button>
      </div>

      {/* Case Files List */}
      <div className="space-y-3 pt-2">
        {investigations.map((inv) => {
          const isSelected = currentInvestigation?.id === inv.id;
          return (
            <div
              key={inv.id}
              onClick={() => {
                onSelectInvestigation(inv);
                onNavigate('home');
              }}
              style={{
                backgroundColor: isSelected ? '#1b1b24' : '#17171e',
                borderColor: isSelected ? '#3b82f6' : '#23232f',
              }}
              className="p-5 rounded-2xl border hover:border-slate-500 cursor-pointer transition-all flex items-center justify-between shadow-md"
            >
              <div className="flex items-center space-x-4">
                <div
                  style={{ backgroundColor: '#131318' }}
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-300"
                >
                  <Folder className={`w-5 h-5 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
                </div>
                <div>
                  <div className="flex items-center space-x-2.5">
                    <h3 className="text-sm font-semibold text-white">{inv.title}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#131318] text-slate-400 border border-[#23232f]">
                      {inv.case_code}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#16281e] text-[#4ade80] border border-[#224832] flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Active Case</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl truncate">
                    {inv.description || 'Enterprise multimodal evidence verification inquiry.'}
                  </p>
                  <div className="flex items-center space-x-4 text-[11px] text-slate-500 font-mono mt-2">
                    <span className="flex items-center space-x-1">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{inv.evidence_count ?? 4} evidence files</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{inv.created_at ? new Date(inv.created_at).toLocaleDateString() : 'Active'}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectInvestigation(inv);
                    onNavigate('home');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#131318] border border-[#262633] hover:bg-[#1f1f28] text-xs text-slate-200 transition-colors flex items-center space-x-1.5"
                >
                  <span>Select & Open</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
