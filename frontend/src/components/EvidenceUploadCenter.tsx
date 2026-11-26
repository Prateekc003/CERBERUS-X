import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  XCircle,
  Network,
  Split,
  Sparkles,
  Users
} from 'lucide-react';
import { EvidenceFile, Investigation } from '../types';
import { NavTab } from './Navigation';

interface EvidenceUploadCenterProps {
  evidence: EvidenceFile[];
  currentInvestigation: Investigation | null;
  onUpload: (
    files: File[],
    sourceAttribution?: string,
    clientId?: string
  ) => Promise<any>;
  onDelete: (id: number) => Promise<void>;
  onSelectEvidence: (ev: EvidenceFile) => void;
  onRefreshCase?: () => Promise<void>;
  onNavigate?: (tab: NavTab) => void;
  loading: boolean;
}

interface ProcessingStageEvent {
  stage: string;
  stage_index: number;
  total_stages: number;
  percentage: number;
  message: string;
  current_file?: string;
  file_index?: number;
  total_files?: number;
}

export const EvidenceUploadCenter: React.FC<EvidenceUploadCenterProps> = ({
  evidence,
  currentInvestigation,
  onUpload,
  onDelete,
  onSelectEvidence,
  onRefreshCase,
  onNavigate,
  loading,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [sourceAttribution, setSourceAttribution] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<ProcessingStageEvent | null>(null);
  const [successNotice, setSuccessNotice] = useState<{ message: string; filesCount: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const activeClientIdRef = useRef<string | null>(null);

  const allowedExtensions = ['.pdf', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.csv', '.xlsx', '.json', '.sql', '.sqlite', '.db'];
  const maxFileSizeBytes = 50 * 1024 * 1024; // 50MB

  // Cleanup websocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

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

  const handleFiles = (incomingFiles: File[]) => {
    setErrorMessage(null);
    setSuccessNotice(null);

    const validFiles: File[] = [];
    for (const f of incomingFiles) {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        setErrorMessage(`File '${f.name}' has an unsupported format. Supported formats: PDF, DOCX, XLSX, CSV, PNG, JPG, TXT, JSON.`);
        continue;
      }
      if (f.size > maxFileSizeBytes) {
        setErrorMessage(`File '${f.name}' exceeds the maximum allowed size of 50 MB.`);
        continue;
      }
      if (f.size === 0) {
        setErrorMessage(`File '${f.name}' is empty (0 bytes).`);
        continue;
      }
      // Check duplicate in current staging list
      if (!selectedFiles.some((sf) => sf.name === f.name && sf.size === f.size)) {
        validFiles.push(f);
      }
    }

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const cancelCurrentProcessing = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send('CANCEL');
    }
    if (activeClientIdRef.current) {
      fetch(`/api/evidence/upload/cancel/${activeClientIdRef.current}`, { method: 'POST' }).catch(() => {});
    }
    setIsProcessing(false);
    setProcessingStage(null);
    setErrorMessage('Evidence processing cancelled by investigator.');
  };

  const submitUpload = async () => {
    if (selectedFiles.length === 0 || !currentInvestigation) return;

    setErrorMessage(null);
    setSuccessNotice(null);
    setIsProcessing(true);

    const clientId = 'proc_' + Math.random().toString(36).substring(2, 10);
    activeClientIdRef.current = clientId;

    // Connect WebSocket for live 10-stage real-time progress
    try {
      const apiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '');
      let wsUrl: string;
      if (apiUrl && apiUrl.startsWith('http')) {
        const wsProto = apiUrl.startsWith('https:') ? 'wss:' : 'ws:';
        const host = apiUrl.replace(/^https?:\/\//, '');
        wsUrl = `${wsProto}//${host}/api/ws/processing/${clientId}`;
      } else {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${protocol}//${window.location.host}/api/ws/processing/${clientId}`;
      }
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'STAGE_UPDATE') {
            setProcessingStage({
              stage: data.stage,
              stage_index: data.stage_index,
              total_stages: data.total_stages,
              percentage: data.percentage,
              message: data.message,
              current_file: data.current_file,
              file_index: data.file_index,
              total_files: data.total_files,
            });
          }
        } catch {
          // Non-blocking parse error
        }
      };

      ws.onerror = () => {
        // Fallback to HTTP status if websocket is blocked
      };
    } catch {
      // Non-blocking
    }

    try {
      const fileCount = selectedFiles.length;
      await onUpload(selectedFiles, sourceAttribution, clientId);
      
      setSelectedFiles([]);
      setSourceAttribution('');
      setIsProcessing(false);
      setProcessingStage(null);
      setSuccessNotice({
        message: 'Evidence processed successfully. Analysis results have been saved.',
        filesCount: fileCount,
      });

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    } catch (err: any) {
      setIsProcessing(false);
      setProcessingStage(null);
      setErrorMessage(err.message || 'Evidence ingestion failed.');
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    }
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
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ft)) return <ImageIcon className="w-4 h-4 text-sky-400" />;
    if (['xlsx', 'xls', 'csv'].includes(ft)) return <TableIcon className="w-4 h-4 text-emerald-400" />;
    if (ft === 'docx') return <FileText className="w-4 h-4 text-blue-400" />;
    return <File className="w-4 h-4 text-slate-400" />;
  };

  const formatAttribution = (attr?: string) => {
    if (!attr || attr === 'Uploaded Evidence') return 'Direct Upload';
    return attr;
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto text-slate-200">
      {/* Header with Case Code and Sync */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#22222d] gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Evidence Repository
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated temporary ingestion pipeline for case{' '}
            <strong className="text-blue-400 font-mono">[{currentInvestigation?.case_code || 'CASE'}]</strong>.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400 flex items-center space-x-3">
          <span>Active Files: <strong className="text-white">{evidence.length}</strong></span>
          <span>•</span>
          <span className="flex items-center space-x-1 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>SHA-256 Verified</span>
          </span>
          {onRefreshCase && (
            <button
              onClick={onRefreshCase}
              disabled={loading || isProcessing}
              title="Reopen saved investigation results without uploading again"
              className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-[#1c1c24] border border-[#2e2e3a] text-slate-300 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-[11px]">Reopen Saved Results</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Notification Banner */}
      {successNotice && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-900/60 rounded-xl space-y-2 text-xs animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-300 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>{successNotice.message}</span>
            </div>
            <button
              onClick={() => setSuccessNotice(null)}
              className="text-emerald-400 hover:text-white text-sm"
            >
              ×
            </button>
          </div>
          <p className="text-[11.5px] text-slate-300">
            {successNotice.filesCount} file(s) processed. Original temporary files were securely purged from disk and memory.
            All claims, entities, conflicts, and knowledge graph structures have been stored in the database.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] text-slate-400 font-medium">Quick Links:</span>
            {onNavigate && (
              <>
                <button
                  onClick={() => onNavigate('graph')}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-[#162a22] text-emerald-300 border border-emerald-800 text-[11px] hover:bg-emerald-900/50 transition-colors"
                >
                  <Network className="w-3 h-3" />
                  <span>View Knowledge Graph</span>
                </button>
                <button
                  onClick={() => onNavigate('conflicts')}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-[#162a22] text-emerald-300 border border-emerald-800 text-[11px] hover:bg-emerald-900/50 transition-colors"
                >
                  <Split className="w-3 h-3" />
                  <span>View Detected Conflicts</span>
                </button>
                <button
                  onClick={() => onNavigate('entities')}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-[#162a22] text-emerald-300 border border-emerald-800 text-[11px] hover:bg-emerald-900/50 transition-colors"
                >
                  <Users className="w-3 h-3" />
                  <span>View Entity Resolution</span>
                </button>
                <button
                  onClick={() => onNavigate('reliability')}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-[#162a22] text-emerald-300 border border-emerald-800 text-[11px] hover:bg-emerald-900/50 transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>View Reliability Scores</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-950/40 border border-rose-900/60 rounded-xl text-xs flex items-center justify-between text-rose-300">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-white text-base ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Real-time Processing HUD (10 Meaningful Pipeline Stages) */}
      {isProcessing && (
        <div className="bg-[#14141e] border border-blue-500/40 rounded-xl p-5 shadow-lg space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
              <span className="font-semibold text-xs text-white uppercase tracking-wider font-mono">
                Pipeline Stage [{processingStage?.stage_index || 1}/10]: {processingStage?.stage || 'PROCESSING'}
              </span>
            </div>
            <button
              onClick={cancelCurrentProcessing}
              className="flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] bg-red-950/50 text-red-300 border border-red-900/60 hover:bg-red-900/60 transition-colors"
            >
              <XCircle className="w-3 h-3" />
              <span>Cancel Processing</span>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#20202c] rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 to-sky-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${processingStage?.percentage || 10}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>{processingStage?.message || 'Processing uploaded evidence through intelligence engines...'}</span>
            <span>{processingStage?.percentage || 10}%</span>
          </div>
        </div>
      )}

      {/* Upload Dropzone */}
      <div className="bg-[#14141b] border border-[#23232f] rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-medium">
          Upload Evidence (Temporary Processing Pipeline)
        </h2>

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-blue-500 bg-blue-950/20'
              : 'border-[#2c2c3a] hover:border-slate-500 bg-[#0e0e14]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.csv,.xlsx,.json,.sql,.sqlite,.db"
            onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
            className="hidden"
          />
          <UploadCloud className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-white">
            Click to upload or drag & drop evidence files here
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            PDF, DOCX, XLSX, CSV, Images, TXT, JSON (Max 50MB per file)
          </p>
          <p className="text-[10px] text-sky-400 font-mono mt-1">
            🔒 Files are temporarily processed for entity & conflict analysis and securely purged afterwards.
          </p>
        </div>

        {/* Staged Files Preview */}
        {selectedFiles.length > 0 && (
          <div className="pt-4 border-t border-[#22222d] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1">
                  Source Attribution / Custody (Optional)
                </label>
                <input
                  type="text"
                  value={sourceAttribution}
                  onChange={(e) => setSourceAttribution(e.target.value)}
                  placeholder="e.g. Ministry Official, Receiving Dock Manifest, Inventory Log"
                  className="w-full text-xs bg-[#0e0e14] border border-[#2a2a38] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-slate-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-4 sm:pt-0">
                <button
                  onClick={() => setSelectedFiles([])}
                  disabled={isProcessing}
                  className="text-xs px-3 py-2 rounded-lg border border-[#2a2a38] text-slate-300 hover:bg-[#1f1f2a] disabled:opacity-50"
                >
                  Clear All
                </button>
                <button
                  onClick={submitUpload}
                  disabled={loading || isProcessing}
                  className="text-xs font-semibold px-4 py-2 rounded-lg bg-white text-black hover:bg-slate-200 transition-colors disabled:opacity-50 flex items-center space-x-1.5"
                >
                  {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isProcessing ? 'Processing Pipeline...' : `Upload & Process (${selectedFiles.length})`}</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {selectedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-2 bg-[#0e0e14] border border-[#282836] px-2.5 py-1 rounded text-xs"
                >
                  {getFileIcon(file.name.split('.').pop() || '')}
                  <span className="font-mono text-slate-200 truncate max-w-[200px]">{file.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeStagedFile(idx);
                    }}
                    disabled={isProcessing}
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
      <div className="bg-[#14141b] border border-[#23232f] rounded-xl shadow-sm overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 border-b border-[#22222d] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#101017]">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-medium uppercase text-slate-300">
              Analyzed Evidence Files ({filteredEvidence.length})
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search files or source..."
                className="text-xs pl-8 pr-3 py-1.5 bg-[#0e0e14] border border-[#2a2a38] text-white rounded-lg focus:outline-none focus:border-slate-500 w-48 sm:w-60"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs bg-[#0e0e14] border border-[#2a2a38] text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-slate-500"
            >
              <option value="ALL">All File Types</option>
              <option value="pdf">PDF</option>
              <option value="docx">DOCX</option>
              <option value="xlsx">XLSX</option>
              <option value="csv">CSV</option>
              <option value="png">PNG / JPG</option>
              <option value="txt">TXT</option>
              <option value="json">JSON</option>
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
                <tr className="border-b border-[#22222d] text-slate-400 font-mono text-[11px] uppercase bg-[#101017]/50">
                  <th className="py-2.5 px-4 font-medium">Code</th>
                  <th className="py-2.5 px-4 font-medium">File Name</th>
                  <th className="py-2.5 px-4 font-medium">Source Attribution</th>
                  <th className="py-2.5 px-4 font-medium">Extracted Claims</th>
                  <th className="py-2.5 px-4 font-medium">Reliability</th>
                  <th className="py-2.5 px-4 font-medium">Integrity Check</th>
                  <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e28] font-sans">
                {filteredEvidence.map((ev) => (
                  <tr key={ev.id} className="hover:bg-[#181822] transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-blue-400 whitespace-nowrap">
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
                            {ev.file_type.toUpperCase()} • {(ev.file_size_bytes / 1024).toFixed(1)} KB • SHA: {ev.sha256_hash.substring(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-300 text-xs">
                      {formatAttribution(ev.source_attribution)}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-[#0e0e14] border border-[#282836] text-[11px]">
                        {ev.claims_count === 1 ? '1 claim' : `${ev.claims_count || 0} claims`}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {ev.reliability_score !== undefined && ev.reliability_score !== null ? (
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${
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
                          <span>Verified</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Inspect Extracted Information Modal (No raw file download/preview) */}
                        <button
                          onClick={() => onSelectEvidence(ev)}
                          title="View Extracted Claims & Intelligence"
                          className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#1f1f2b] border border-[#2f2f3e] hover:bg-[#272738] text-slate-300 hover:text-white transition-colors text-[11px]"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-400" />
                          <span>Inspect Claims</span>
                        </button>
                        <button
                          onClick={() => onDelete(ev.id)}
                          title="Delete Evidence Record"
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
