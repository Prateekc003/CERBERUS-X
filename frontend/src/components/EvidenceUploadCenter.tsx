import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  File,
  FileText,
  Image as ImageIcon,
  Table as TableIcon,
  Trash2,
  Eye,
  ShieldCheck,
  ShieldAlert,
  Search
} from 'lucide-react';
import { EvidenceFile, Investigation } from '../types';

interface EvidenceUploadCenterProps {
  evidence: EvidenceFile[];
  currentInvestigation: Investigation | null;
  onUpload: (files: File[], sourceAttribution?: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onSelectEvidence: (ev: EvidenceFile) => void;
  loading: boolean;
}

export const EvidenceUploadCenter: React.FC<EvidenceUploadCenterProps> = ({
  evidence,
  currentInvestigation,
  onUpload,
  onDelete,
  onSelectEvidence,
  loading,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [sourceAttribution, setSourceAttribution] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedExtensions = ['.pdf', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.csv', '.xlsx', '.json'];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const valid = files.filter((f) => {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase();
      return allowedExtensions.includes(ext);
    });
    setSelectedFiles((prev) => [...prev, ...valid]);
  };

  const submitUpload = async () => {
    if (selectedFiles.length === 0) return;
    await onUpload(selectedFiles, sourceAttribution);
    setSelectedFiles([]);
    setSourceAttribution('');
  };

  const removeStagedFile = (idx: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const filteredEvidence = evidence.filter((ev) => {
    const matchSearch =
      ev.filename.toLowerCase().includes(searchFilter.toLowerCase()) ||
      ev.evidence_code.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (ev.source_attribution || '').toLowerCase().includes(searchFilter.toLowerCase());
    const matchType = typeFilter === 'ALL' || ev.file_type.toLowerCase() === typeFilter.toLowerCase();
    return matchSearch && matchType;
  });

  const getFileIcon = (fileType: string) => {
    const ft = fileType.toLowerCase();
    if (ft === 'pdf') return <FileText className="w-4 h-4 text-rose-400" />;
    if (['jpg', 'jpeg', 'png'].includes(ft)) return <ImageIcon className="w-4 h-4 text-sky-400" />;
    if (['xlsx', 'csv'].includes(ft)) return <TableIcon className="w-4 h-4 text-emerald-400" />;
    if (ft === 'docx') return <FileText className="w-4 h-4 text-blue-400" />;
    return <File className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="p-7 space-y-6 max-w-7xl mx-auto text-slate-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-dark-borderSubtle gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Evidence Ingestion Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Accepts multimodal documents, scans, spreadsheets, and structured records into case{' '}
            <strong className="text-blue-400 font-mono">[{currentInvestigation?.case_code || 'CASE'}]</strong>.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400 flex items-center space-x-3">
          <span>Active Files: <strong className="text-white">{evidence.length}</strong></span>
          <span>•</span>
          <span>SHA-256 Hash Verified</span>
        </div>
      </div>

      {/* Upload Dropzone */}
      <div className="bg-dark-card border border-dark-cardBorder rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
          Stage New Multimodal Evidence
        </h2>

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border border-dashed rounded-xl p-7 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-blue-500 bg-blue-950/20'
              : 'border-dark-cardBorder hover:border-slate-600 bg-dark-sidebar'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.csv,.xlsx,.json"
            onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
            className="hidden"
          />
          <UploadCloud className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-white">
            Click to upload or drag & drop files here
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            PDF, DOCX, TXT, JPG, PNG, CSV, XLSX, JSON (Max 50MB per file)
          </p>
          <p className="text-[10px] text-slate-500 font-mono mt-2">
            Adversarial scanning, OCR, and deterministic claim extraction are applied automatically.
          </p>
        </div>

        {/* Staged Files Preview */}
        {selectedFiles.length > 0 && (
          <div className="pt-4 border-t border-dark-borderSubtle space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1">
                  Source Provenance / Custody Attribution (Optional)
                </label>
                <input
                  type="text"
                  value={sourceAttribution}
                  onChange={(e) => setSourceAttribution(e.target.value)}
                  placeholder="e.g. Subpoenaed from Apex Logistics, Ministry Archive, Dock Terminal 4"
                  className="w-full text-xs bg-dark-input border border-dark-cardBorder text-white rounded-lg px-3 py-2 focus:outline-none focus:border-slate-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-4 sm:pt-0">
                <button
                  onClick={() => setSelectedFiles([])}
                  className="text-xs px-3 py-2 rounded-lg border border-dark-cardBorder text-slate-300 hover:bg-dark-cardHover"
                >
                  Clear All
                </button>
                <button
                  onClick={submitUpload}
                  disabled={loading}
                  className="text-xs font-semibold px-4 py-2 rounded-lg bg-white text-black hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  <span>{loading ? 'Processing Extractor...' : `Ingest & Extract (${selectedFiles.length})`}</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {selectedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-2 bg-dark-sidebar border border-dark-cardBorder px-2.5 py-1 rounded text-xs"
                >
                  <File className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono text-slate-200 truncate max-w-[200px]">{file.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeStagedFile(idx);
                    }}
                    className="text-slate-400 hover:text-red-400 ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Ingested Evidence Inventory Table */}
      <div className="bg-dark-card border border-dark-cardBorder rounded-xl shadow-sm overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 border-b border-dark-borderSubtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-dark-sidebar/40">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold uppercase text-slate-300">
              Evidence Inventory ({filteredEvidence.length})
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search file, code, or source..."
                className="text-xs pl-8 pr-3 py-1.5 bg-dark-input border border-dark-cardBorder text-white rounded-lg focus:outline-none focus:border-slate-500 w-48 sm:w-60"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs bg-dark-input border border-dark-cardBorder text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-slate-500"
            >
              <option value="ALL">All Modalities</option>
              <option value="pdf">PDF</option>
              <option value="docx">DOCX</option>
              <option value="xlsx">XLSX</option>
              <option value="csv">CSV</option>
              <option value="png">PNG / JPG</option>
            </select>
          </div>
        </div>

        {/* Evidence Table */}
        {filteredEvidence.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-mono text-xs">
            No evidence files match the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-dark-borderSubtle text-slate-400 font-mono text-[11px] uppercase bg-dark-sidebar/20">
                  <th className="py-2.5 px-4 font-semibold">Evidence Code</th>
                  <th className="py-2.5 px-4 font-semibold">File & Modality</th>
                  <th className="py-2.5 px-4 font-semibold">Attribution</th>
                  <th className="py-2.5 px-4 font-semibold">Claims</th>
                  <th className="py-2.5 px-4 font-semibold">Reliability</th>
                  <th className="py-2.5 px-4 font-semibold">Adversarial</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-borderSubtle font-sans">
                {filteredEvidence.map((ev) => (
                  <tr key={ev.id} className="hover:bg-dark-cardHover/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-blue-400 whitespace-nowrap">
                      {ev.evidence_code}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2.5">
                        {getFileIcon(ev.file_type)}
                        <div>
                          <p className="font-medium text-white truncate max-w-[220px]">
                            {ev.filename}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {ev.file_type.toUpperCase()} • {(ev.file_size_bytes / 1024).toFixed(1)} KB • SHA:{' '}
                            {ev.sha256_hash.substring(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-300 text-xs">
                      {ev.source_attribution || (
                        <span className="text-slate-500 italic">Disclosed in discovery</span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-dark-sidebar border border-dark-cardBorder">
                        {ev.claims_count || 0} claims
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {ev.reliability_score !== undefined && ev.reliability_score !== null ? (
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                            ev.reliability_category === 'HIGH'
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-900/60'
                              : ev.reliability_category === 'MODERATE'
                              ? 'bg-sky-950/60 text-sky-300 border border-sky-900/60'
                              : ev.reliability_category === 'LOW'
                              ? 'bg-amber-950/60 text-amber-300 border border-amber-900/60'
                              : 'bg-rose-950/60 text-rose-300 border border-rose-900/60'
                          }`}
                        >
                          {ev.reliability_score}/100 ({ev.reliability_category})
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px] font-mono">Pending</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {ev.adversarial_flagged ? (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-900/60">
                          <ShieldAlert className="w-3 h-3 text-rose-400" />
                          <span>Flagged</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-900/60">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>Sanitized</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onSelectEvidence(ev)}
                          title="Inspect Document"
                          className="p-1.5 rounded hover:bg-dark-sidebar text-slate-400 hover:text-white transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(ev.id)}
                          title="Delete Evidence"
                          className="p-1.5 rounded hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
