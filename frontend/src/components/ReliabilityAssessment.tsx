import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, HelpCircle, FileText } from 'lucide-react';
import { ReliabilityAssessmentItem } from '../types';

interface ReliabilityAssessmentProps {
  items: ReliabilityAssessmentItem[];
}

export const ReliabilityAssessment: React.FC<ReliabilityAssessmentProps> = ({ items }) => {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-xl font-bold text-navy-900 tracking-tight flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <span>Explainable Source Reliability Assessments</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Multifactor evidentiary weighting based on physical provenance, tamper indicators, metadata completeness, and independent cross-source corroboration.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-500">
          Assessed Sources: <strong className="text-navy-900">{items.length}</strong>
        </div>
      </div>

      {/* Audit Principle Callout */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs text-navy-900 flex items-start space-x-3">
        <HelpCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <div className="leading-relaxed">
          <strong className="block font-semibold mb-0.5">Enterprise Provenance Standard:</strong>
          Documents are never presumed authentic merely because of formal institutional headings or PDF format.
          Physical receiving slips with verified signatures receive higher custody weight than self-authored executive reports
          or unversioned spreadsheet tables.
        </div>
      </div>

      {/* Reliability Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-slate-200 rounded-lg shadow-sm p-5 space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div>
              {/* Header badge & Score */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                    {item.evidence_code}
                  </span>
                  <span className="font-semibold text-xs text-navy-900 truncate max-w-[200px]" title={item.filename}>
                    {item.filename}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`font-mono text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      item.category === 'HIGH'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : item.category === 'MODERATE'
                        ? 'bg-sky-100 text-sky-800 border border-sky-300'
                        : item.category === 'LOW'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-red-100 text-red-800 border border-red-300'
                    }`}
                  >
                    {item.score}/100 ({item.category})
                  </span>
                </div>
              </div>

              {/* Provenance notes */}
              <div className="pt-3">
                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  {item.provenance_notes}
                </p>
              </div>

              {/* Authenticity Indicators */}
              <div className="mt-4 space-y-1.5">
                <span className="text-[10px] font-mono uppercase font-bold text-emerald-800 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Authenticity Indicators ({item.authenticity_indicators.length})</span>
                </span>
                <ul className="space-y-1 text-xs text-slate-600 pl-4 list-disc">
                  {item.authenticity_indicators.map((ind, i) => (
                    <li key={i} className="leading-snug">{ind}</li>
                  ))}
                </ul>
              </div>

              {/* Risk Factors */}
              {item.risk_factors && item.risk_factors.length > 0 && (
                <div className="mt-4 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase font-bold text-amber-800 flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    <span>Risk Factors & Limitations ({item.risk_factors.length})</span>
                  </span>
                  <ul className="space-y-1 text-xs text-slate-600 pl-4 list-disc">
                    {item.risk_factors.map((rf, i) => (
                      <li key={i} className="leading-snug">{rf}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Missing Verification Information */}
              {item.missing_verification && item.missing_verification.length > 0 && (
                <div className="mt-4 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-500 flex items-center space-x-1">
                    <HelpCircle className="w-3 h-3 text-slate-400" />
                    <span>Missing Verification Information</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.missing_verification.map((mv, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        {mv}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Recommended Action Pill */}
            {item.recommended_actions && item.recommended_actions.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-blue-900 font-mono bg-blue-50/60 p-2.5 rounded">
                <strong>Next Investigative Step:</strong> {item.recommended_actions[0]}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
