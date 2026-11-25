import React from 'react';
import {
  FileText,
  X,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { EvidenceFile } from '../types';

interface EvidenceDetailModalProps {
  evidence: EvidenceFile | null;
  onClose: () => void;
}

export const EvidenceDetailModal: React.FC<EvidenceDetailModalProps> = ({ evidence, onClose }) => {
  if (!evidence) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-dark-card rounded-xl border border-dark-cardBorder shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden text-xs text-slate-200">
        {/* Header */}
        <div className="bg-dark-sidebar px-6 py-4 flex items-center justify-between shrink-0 border-b border-dark-borderSubtle">
          <div className="flex items-center space-x-2.5">
            <FileText className="w-5 h-5 text-blue-400" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-blue-400">
                  {evidence.evidence_code}
                </span>
                <span className="text-slate-500">•</span>
                <span className="font-semibold text-sm text-white">{evidence.filename}</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                SHA-256: {evidence.sha256_hash}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-dark-sidebar p-3.5 rounded-lg border border-dark-cardBorder text-[11px] font-mono">
            <div>
              <span className="text-slate-500 uppercase text-[10px] block">Modality</span>
              <span className="font-bold text-white">{evidence.file_type.toUpperCase()}</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase text-[10px] block">Size</span>
              <span className="font-bold text-white">
                {(evidence.file_size_bytes / 1024).toFixed(1)} KB
              </span>
            </div>
            <div>
              <span className="text-slate-500 uppercase text-[10px] block">OCR Applied</span>
              <span className="font-bold text-white">{evidence.ocr_applied ? 'YES' : 'NO'}</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase text-[10px] block">Attribution</span>
              <span className="font-bold text-white truncate block">
                {evidence.source_attribution || 'Unknown'}
              </span>
            </div>
          </div>

          {/* Adversarial & Tampering Report */}
          <div
            className={`p-4 rounded-xl border text-xs space-y-2 ${
              evidence.adversarial_flagged
                ? 'bg-rose-950/40 border-rose-900/60 text-rose-300'
                : 'bg-emerald-950/40 border-emerald-900/60 text-emerald-300'
            }`}
          >
            <div className="flex items-center space-x-2 font-mono font-bold uppercase text-[11px]">
              {evidence.adversarial_flagged ? (
                <>
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Adversarial & Tamper Check: FLAG DETECTED</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Adversarial Check: SECURE & SANITIZED</span>
                </>
              )}
            </div>

            <p className="text-[11px] leading-relaxed text-slate-300">
              {evidence.adversarial_report?.disclaimer ||
                'Uploaded evidence is treated as untrusted data. Embedded directives are isolated and never executed by Cerberus-X.'}
            </p>

            {evidence.adversarial_report?.flags && evidence.adversarial_report.flags.length > 0 && (
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] font-mono">
                {evidence.adversarial_report.flags.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Extracted Document Text */}
          <div className="space-y-2">
            <span className="font-mono text-[11px] uppercase font-bold text-slate-400 block">
              Extracted Full Text Content
            </span>
            <div className="p-4 bg-dark-sidebar text-slate-200 rounded-lg font-mono text-[11px] whitespace-pre-wrap max-h-72 overflow-y-auto leading-relaxed border border-dark-cardBorder">
              {evidence.extracted_text || 'No text extracted from document.'}
            </div>
          </div>

          {/* Metadata JSON */}
          {evidence.metadata && Object.keys(evidence.metadata).length > 0 && (
            <div className="space-y-2">
              <span className="font-mono text-[11px] uppercase font-bold text-slate-400 block">
                Embedded File Metadata
              </span>
              <pre className="p-3 bg-dark-sidebar text-slate-300 rounded-lg font-mono text-[10px] overflow-x-auto border border-dark-cardBorder">
                {JSON.stringify(evidence.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-dark-sidebar px-6 py-3 border-t border-dark-borderSubtle flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="text-xs px-4 py-1.5 rounded-lg bg-dark-card hover:bg-dark-cardHover text-white font-medium transition-colors border border-dark-cardBorder"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
