import React, { useState } from 'react';
import { FileSearch, Search, Filter, Hash, Calendar, MapPin, Tag } from 'lucide-react';
import { ExtractedClaim, EvidenceFile } from '../types';

interface ClaimsInspectorProps {
  claims: ExtractedClaim[];
  evidenceList: EvidenceFile[];
}

export const ClaimsInspector: React.FC<ClaimsInspectorProps> = ({ claims, evidenceList }) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [evidenceFilter, setEvidenceFilter] = useState('ALL');

  const filteredClaims = claims.filter((c) => {
    const matchSearch =
      c.text.toLowerCase().includes(search.toLowerCase()) ||
      c.claim_code.toLowerCase().includes(search.toLowerCase()) ||
      (c.subject || '').toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'ALL' || c.claim_type.toUpperCase() === typeFilter.toUpperCase();
    const matchEv = evidenceFilter === 'ALL' || c.evidence_id.toString() === evidenceFilter;
    return matchSearch && matchType && matchEv;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-xl font-bold text-navy-900 tracking-tight">
            Extracted Claims Repository
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Structured factual claims parsed from uploaded evidence files via deterministic regex and NER semantics.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-500">
          Total Claims: <strong className="text-navy-900">{claims.length}</strong>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search claim text, code, or subject..."
            className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {/* Claim Type */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          >
            <option value="ALL">All Claim Types</option>
            <option value="QUANTITY">Quantity Claims</option>
            <option value="DATE">Date / Milestone Claims</option>
            <option value="STATUS">Status Claims</option>
            <option value="FACT">General Factual Claims</option>
          </select>

          {/* Evidence File */}
          <select
            value={evidenceFilter}
            onChange={(e) => setEvidenceFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white max-w-[200px] truncate"
          >
            <option value="ALL">All Source Files</option>
            {evidenceList.map((e) => (
              <option key={e.id} value={e.id.toString()}>
                {e.filename}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Claims List Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        {filteredClaims.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-mono text-xs">
            No claims found matching current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-mono text-[11px] uppercase">
                  <th className="py-2.5 px-4 font-semibold">Claim Code</th>
                  <th className="py-2.5 px-4 font-semibold">Classification</th>
                  <th className="py-2.5 px-4 font-semibold">Substantive Claim Assertion</th>
                  <th className="py-2.5 px-4 font-semibold">Structured Values</th>
                  <th className="py-2.5 px-4 font-semibold">Source Document & Line</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-slate-50 transition-colors">
                    {/* Code */}
                    <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {claim.claim_code}
                    </td>

                    {/* Classification */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                          claim.claim_type === 'QUANTITY'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : claim.claim_type === 'DATE'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : claim.claim_type === 'STATUS'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {claim.claim_type}
                      </span>
                    </td>

                    {/* Claim text */}
                    <td className="py-3 px-4">
                      <p className="font-medium text-navy-900 leading-snug">{claim.text}</p>
                      {claim.subject && (
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Subject: <strong className="text-slate-600">{claim.subject}</strong> | Predicate:{' '}
                          <strong className="text-slate-600">{claim.predicate || 'asserted'}</strong>
                        </p>
                      )}
                    </td>

                    {/* Structured Values */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {claim.quantity_val !== undefined && claim.quantity_val !== null ? (
                        <div className="flex items-center space-x-1.5 font-mono">
                          <span className="text-xs font-bold text-blue-700">
                            {claim.quantity_val} {claim.quantity_unit || 'units'}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 uppercase border border-blue-200">
                            {claim.quantity_action || 'asserted'}
                          </span>
                        </div>
                      ) : claim.date_val ? (
                        <span className="text-[11px] font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {claim.date_val}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-[10px]">—</span>
                      )}
                    </td>

                    {/* Source Doc */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <p className="font-mono text-slate-700 text-[11px] truncate max-w-[200px]">
                        {claim.evidence_filename || `Evidence #${claim.evidence_id}`}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {claim.page_or_location || 'Page 1'}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
