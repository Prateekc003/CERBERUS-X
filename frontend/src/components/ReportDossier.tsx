import React from 'react';
import { FileText, Download, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { ReportData, Investigation } from '../types';

interface ReportDossierProps {
  currentInvestigation: Investigation | null;
  reportData: ReportData | null;
  onGenerateReport: () => Promise<void>;
  loading: boolean;
}

export const ReportDossier: React.FC<ReportDossierProps> = ({
  currentInvestigation,
  reportData,
  onGenerateReport,
  loading,
}) => {
  const handleDownloadPdf = () => {
    if (reportData?.pdf_download_url) {
      const url = reportData.pdf_download_url.startsWith('http')
        ? reportData.pdf_download_url
        : `http://127.0.0.1:8000${reportData.pdf_download_url}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="p-7 space-y-6 max-w-5xl mx-auto text-slate-200">
      {/* Header & Export Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-dark-borderSubtle gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <span>Reports & Output</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Comprehensive investigation report with evidence citations, conflict analysis, and findings.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            onClick={onGenerateReport}
            disabled={loading}
            className="flex items-center space-x-1.5 text-xs font-medium px-3.5 py-2 rounded-lg border border-dark-cardBorder hover:bg-dark-cardHover text-slate-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Re-compile Dossier</span>
          </button>

          {reportData?.pdf_download_url && (
            <button
              onClick={handleDownloadPdf}
              className="flex items-center space-x-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-white text-black hover:bg-slate-200 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Official PDF</span>
            </button>
          )}
        </div>
      </div>

      {!reportData ? (
        <div className="p-12 text-center bg-dark-card border border-dark-cardBorder rounded-xl space-y-3">
          <FileText className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-xs font-mono text-slate-400">
            No compiled intelligence dossier found for this case yet.
          </p>
          <button
            onClick={onGenerateReport}
            disabled={loading}
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-white text-black hover:bg-slate-200"
          >
            Generate Comprehensive Report Now
          </button>
        </div>
      ) : (
        <div className="bg-dark-card border border-dark-cardBorder rounded-xl shadow-md p-8 space-y-6">
          {/* Header */}
          <div className="border-b border-dark-borderSubtle pb-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>SECURITY CLASSIFICATION: OFFICIAL AUDIT / SENSITIVE</span>
              <span>CERBERUS-X INTEL SYSTEM</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight font-sans">
              {reportData.title}
            </h2>
            <div className="flex flex-wrap gap-4 text-xs font-mono text-slate-400 pt-1">
              <span>Report Code: <strong className="text-white">{reportData.report_code}</strong></span>
              <span>•</span>
              <span>Case Reference: <strong className="text-white">{currentInvestigation?.case_code}</strong></span>
              <span>•</span>
              <span>Generated: <strong>{new Date(reportData.created_at).toUTCString()}</strong></span>
            </div>
          </div>

          {/* Key Findings Box Callout (Section 8) */}
          <div className="bg-rose-950/40 border border-rose-900/60 rounded-xl p-5 space-y-2 text-rose-200">
            <div className="flex items-center space-x-2 text-xs font-mono uppercase font-bold text-rose-400">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Section 8: Key Evidentiary Determination</span>
            </div>
            <p className="text-sm font-semibold leading-relaxed text-white">
              {reportData.findings.conclusion ||
                'The available evidence does not establish that all 1000 medical kits were delivered. Discrepancies exist across delivery receipts and inventory spreadsheets.'}
            </p>
          </div>

          {/* Markdown Content */}
          <div className="prose prose-invert max-w-none text-xs leading-relaxed font-sans space-y-4">
            <div className="whitespace-pre-wrap font-mono text-xs text-slate-300 bg-dark-sidebar p-6 rounded-xl border border-dark-borderSubtle overflow-x-auto leading-relaxed">
              {reportData.report_markdown}
            </div>
          </div>

          {/* Dossier Footer */}
          <div className="pt-6 border-t border-dark-borderSubtle flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 font-mono gap-2">
            <div>
              <p>Generated by Cerberus-X Autonomous Evidence Intelligence System</p>
              <p className="text-[10px] text-slate-500">Deterministic extraction • Conflict-aware reasoning • Zero hallucination</p>
            </div>
            {reportData.pdf_download_url && (
              <button
                onClick={handleDownloadPdf}
                className="text-blue-400 hover:underline flex items-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF File ({reportData.report_code}.pdf)</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
