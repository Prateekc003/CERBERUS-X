import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Table as TableIcon,
  Search,
  Info,
} from 'lucide-react';
import { ReliabilityAssessmentItem } from '../types';

interface ReliabilityAssessmentProps {
  items: ReliabilityAssessmentItem[];
}

export const ReliabilityAssessment: React.FC<ReliabilityAssessmentProps> = ({ items }) => {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const filteredItems = items.filter((item) => {
    const matchSearch =
      item.filename.toLowerCase().includes(search.toLowerCase()) ||
      item.evidence_code.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'ALL' || item.category === filterCategory;
    return matchSearch && matchCat;
  });

  const getScoreColor = (category: string) => {
    switch (category) {
      case 'HIGH':
        return {
          text: 'text-emerald-400',
          bg: 'bg-emerald-950/50',
          border: 'border-emerald-800/60',
          bar: 'bg-emerald-500',
          badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        };
      case 'MODERATE':
        return {
          text: 'text-sky-400',
          bg: 'bg-sky-950/50',
          border: 'border-sky-800/60',
          bar: 'bg-sky-500',
          badge: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
        };
      case 'LOW':
        return {
          text: 'text-amber-400',
          bg: 'bg-amber-950/50',
          border: 'border-amber-800/60',
          bar: 'bg-amber-500',
          badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        };
      default:
        return {
          text: 'text-rose-400',
          bg: 'bg-rose-950/50',
          border: 'border-rose-800/60',
          bar: 'bg-rose-500',
          badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        };
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-4 h-4 text-rose-400" />;
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) return <ImageIcon className="w-4 h-4 text-sky-400" />;
    if (['xlsx', 'csv'].includes(ext || '')) return <TableIcon className="w-4 h-4 text-emerald-400" />;
    return <FileText className="w-4 h-4 text-slate-400" />;
  };

  const highCount = items.filter((i) => i.category === 'HIGH').length;
  const modCount = items.filter((i) => i.category === 'MODERATE').length;
  const lowCount = items.filter((i) => i.category === 'LOW').length;
  const susCount = items.filter((i) => i.category === 'SUSPICIOUS').length;

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
            Objective trustworthiness scores (0–100) based on verified provenance, physical custody, and cross-source corroboration.
          </p>
        </div>

        {/* Quick summary counts */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-lg bg-[#14141b] border border-[#23232f] text-slate-300">
            Total Sources: <strong className="text-white">{items.length}</strong>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#14141b] border border-[#23232f] rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search evidence file..."
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-[#0e0e14] border border-[#2a2a38] text-white rounded-lg focus:outline-none focus:border-slate-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs font-medium">
          <button
            onClick={() => setFilterCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterCategory === 'ALL'
                ? 'bg-[#22222f] text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({items.length})
          </button>
          {highCount > 0 && (
            <button
              onClick={() => setFilterCategory('HIGH')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterCategory === 'HIGH'
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                  : 'text-emerald-400/80 hover:text-emerald-300'
              }`}
            >
              High ({highCount})
            </button>
          )}
          {modCount > 0 && (
            <button
              onClick={() => setFilterCategory('MODERATE')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterCategory === 'MODERATE'
                  ? 'bg-sky-950/60 text-sky-300 border border-sky-800'
                  : 'text-sky-400/80 hover:text-sky-300'
              }`}
            >
              Moderate ({modCount})
            </button>
          )}
          {lowCount > 0 && (
            <button
              onClick={() => setFilterCategory('LOW')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterCategory === 'LOW'
                  ? 'bg-amber-950/60 text-amber-300 border border-amber-800'
                  : 'text-amber-400/80 hover:text-amber-300'
              }`}
            >
              Low ({lowCount})
            </button>
          )}
          {susCount > 0 && (
            <button
              onClick={() => setFilterCategory('SUSPICIOUS')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterCategory === 'SUSPICIOUS'
                  ? 'bg-rose-950/60 text-rose-300 border border-rose-800'
                  : 'text-rose-400/80 hover:text-rose-300'
              }`}
            >
              Suspicious ({susCount})
            </button>
          )}
        </div>
      </div>

      {/* Reliability Cards Grid */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-[#14141b] border border-[#23232f] rounded-xl text-slate-400 font-mono text-xs">
          No evidence sources match the selected filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredItems.map((item) => {
            const style = getScoreColor(item.category);
            const scorePercent = Math.max(5, Math.min(100, Math.round(item.score)));

            return (
              <div
                key={item.id}
                className="bg-[#14141b] border border-[#23232f] rounded-xl p-5 space-y-4 shadow-xs hover:border-[#2f2f3e] transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Top Bar: File & Score Badge */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#22222d]">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="p-2 rounded-lg bg-[#0e0e14] border border-[#23232f] shrink-0">
                        {getFileIcon(item.filename)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-semibold text-blue-400">
                            {item.evidence_code}
                          </span>
                        </div>
                        <p className="font-medium text-xs text-white truncate max-w-[240px]" title={item.filename}>
                          {item.filename}
                        </p>
                      </div>
                    </div>

                    {/* Clean Score Pill */}
                    <div className="text-right shrink-0">
                      <div className="flex items-center space-x-1.5 justify-end">
                        <span className={`text-base font-bold font-mono ${style.text}`}>
                          {item.score}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">/ 100</span>
                      </div>
                      <span className={`inline-block text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-medium mt-0.5 ${style.badge}`}>
                        {item.category}
                      </span>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="space-y-1">
                    <div className="h-1.5 w-full bg-[#0e0e14] rounded-full overflow-hidden border border-[#23232f]">
                      <div
                        className={`h-full ${style.bar} transition-all duration-500 rounded-full`}
                        style={{ width: `${scorePercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Executive Rationale */}
                  <div className="p-3 bg-[#0e0e14] border border-[#242432] rounded-lg">
                    <div className="flex items-start space-x-2 text-xs">
                      <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <p className="text-slate-300 leading-relaxed font-sans text-[11px]">
                        {item.provenance_notes}
                      </p>
                    </div>
                  </div>

                  {/* Strengths & Verification */}
                  {item.authenticity_indicators && item.authenticity_indicators.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-1.5 text-xs font-medium text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="font-semibold text-white">Verification & Strengths</span>
                      </div>
                      <div className="space-y-1 pl-5">
                        {item.authenticity_indicators.map((ind, i) => (
                          <div key={i} className="text-[11px] text-slate-300 flex items-start space-x-1.5">
                            <span className="text-emerald-400 leading-none mt-1">•</span>
                            <span className="leading-snug">{ind}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Risk Factors */}
                  {item.risk_factors && item.risk_factors.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center space-x-1.5 text-xs font-medium text-slate-300">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-semibold text-white">Risk Factors & Limitations</span>
                      </div>
                      <div className="space-y-1 pl-5">
                        {item.risk_factors.map((rf, i) => (
                          <div key={i} className="text-[11px] text-slate-300 flex items-start space-x-1.5">
                            <span className="text-amber-400 leading-none mt-1">•</span>
                            <span className="leading-snug">{rf}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
