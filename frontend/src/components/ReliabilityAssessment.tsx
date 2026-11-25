import React from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ReliabilityAssessmentItem } from '../types';

interface ReliabilityAssessmentProps {
  items: ReliabilityAssessmentItem[];
}

export const ReliabilityAssessment: React.FC<ReliabilityAssessmentProps> = ({ items }) => {
  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto text-slate-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#22222d] gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Reliability Scoring</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Evaluates evidence trustworthiness based on metadata completeness, physical custody, and cross-source verification.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-400">
          Assessed Sources: <strong className="text-white">{items.length}</strong>
        </div>
      </div>

      {/* Reliability Cards Grid */}
      {items.length === 0 ? (
        <div className="p-12 text-center bg-[#14141b] border border-[#23232f] rounded-xl text-slate-400 font-mono text-xs">
          No reliability assessments available yet. Upload evidence to compute scores.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-[#14141b] border border-[#23232f] rounded-xl p-5 space-y-4 shadow-sm hover:border-[#2f2f3e] transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header badge & Score */}
                <div className="flex items-center justify-between pb-3 border-b border-[#22222d]">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#0e0e14] border border-[#282836] text-blue-400">
                      {item.evidence_code}
                    </span>
                    <span className="font-medium text-xs text-white truncate max-w-[200px]" title={item.filename}>
                      {item.filename}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`font-mono text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                        item.category === 'HIGH'
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-900/60'
                          : item.category === 'MODERATE'
                          ? 'bg-sky-950/60 text-sky-300 border border-sky-900/60'
                          : item.category === 'LOW'
                          ? 'bg-amber-950/60 text-amber-300 border border-amber-900/60'
                          : 'bg-rose-950/60 text-rose-300 border border-rose-900/60'
                      }`}
                    >
                      {item.score}/100 • {item.category}
                    </span>
                  </div>
                </div>

                {/* Provenance notes */}
                <div className="pt-3">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.provenance_notes}
                  </p>
                </div>

                {/* Authenticity Indicators */}
                {item.authenticity_indicators && item.authenticity_indicators.length > 0 && (
                  <div className="mt-4 space-y-1.5">
                    <span className="text-[10px] font-mono uppercase font-medium text-emerald-400 flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Authenticity Indicators ({item.authenticity_indicators.length})</span>
                    </span>
                    <ul className="space-y-1 text-xs text-slate-300 pl-4 list-disc">
                      {item.authenticity_indicators.map((ind, i) => (
                        <li key={i} className="leading-snug">{ind}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Risk Factors */}
                {item.risk_factors && item.risk_factors.length > 0 && (
                  <div className="mt-4 space-y-1.5">
                    <span className="text-[10px] font-mono uppercase font-medium text-amber-400 flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      <span>Risk Factors ({item.risk_factors.length})</span>
                    </span>
                    <ul className="space-y-1 text-xs text-slate-300 pl-4 list-disc">
                      {item.risk_factors.map((rf, i) => (
                        <li key={i} className="leading-snug">{rf}</li>
                      ))}
                    </ul>
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
