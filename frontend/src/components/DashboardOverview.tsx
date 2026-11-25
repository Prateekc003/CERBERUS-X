import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Share2,
  ArrowRightLeft,
  Users,
  BarChart2,
  FileCheck,
  Sun,
  Plus,
  ArrowUp,
  FileText,
  FileCode,
  Image as ImageIcon,
  FileSpreadsheet,
  Table,
  Database,
  Folder,
  X,
  Upload,
} from 'lucide-react';
import { DashboardOverview as DashboardData, Investigation } from '../types';

interface DashboardOverviewProps {
  data: DashboardData | null;
  currentInvestigation: Investigation | null;
  onNavigate: (tab: any) => void;
  onNewInvestigation: () => void;
  onAskQuery: (query: string) => void;
  onUploadFiles?: (files: FileList) => Promise<void>;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  data,
  currentInvestigation,
  onNavigate,
  onNewInvestigation,
  onAskQuery,
  onUploadFiles,
}) => {
  const [promptInput, setPromptInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const [acceptFilter, setAcceptFilter] = useState<string>('*');

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(event.target as Node)) {
        setShowAttachMenu(false);
      }
    };
    if (showAttachMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAttachMenu]);

  // Valid supported extensions for CERBERUS-X
  const VALID_EXTENSIONS = [
    '.pdf',
    '.txt',
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
    '.xlsx',
    '.xls',
    '.csv',
    '.json',
    '.sql',
    '.sqlite',
    '.db',
  ];

  const isValidFile = (file: File) => {
    const name = file.name.toLowerCase();
    if (name.startsWith('.') || name === 'thumbs.db') return false;
    return VALID_EXTENSIONS.some((ext) => name.endsWith(ext));
  };

  const addFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(isValidFile);
    if (validFiles.length > 0) {
      setAttachedFiles((prev) => {
        const existingKeys = new Set(prev.map((f) => `${f.name}_${f.size}`));
        const uniqueNew = validFiles.filter((f) => !existingKeys.has(`${f.name}_${f.size}`));
        return [...prev, ...uniqueNew];
      });
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = promptInput.trim();
    if (!query && attachedFiles.length === 0) return;

    if (attachedFiles.length > 0 && onUploadFiles) {
      const dt = new DataTransfer();
      attachedFiles.forEach((f) => dt.items.add(f));
      await onUploadFiles(dt.files);
      setAttachedFiles([]);
    }

    if (query) {
      onAskQuery(query);
      setPromptInput('');
    }
  };

  const handleTriggerUpload = (filter: string) => {
    setShowAttachMenu(false);
    setAcceptFilter(filter);
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
        fileInputRef.current.click();
      }
    }, 50);
  };

  const handleTriggerFolder = () => {
    setShowAttachMenu(false);
    setTimeout(() => {
      if (folderInputRef.current) {
        folderInputRef.current.value = '';
        folderInputRef.current.click();
      }
    }, 50);
  };

  const attachmentOptions = [
    {
      id: 'pdf',
      label: 'PDF Documents',
      icon: FileText,
      action: () => handleTriggerUpload('.pdf'),
    },
    {
      id: 'txt',
      label: 'TXT Files',
      icon: FileCode,
      action: () => handleTriggerUpload('.txt'),
    },
    {
      id: 'images',
      label: 'Images (JPG, PNG)',
      icon: ImageIcon,
      action: () => handleTriggerUpload('.jpg,.jpeg,.png,.webp'),
    },
    {
      id: 'excel',
      label: 'Excel Spreadsheets (XLSX)',
      icon: FileSpreadsheet,
      action: () => handleTriggerUpload('.xlsx,.xls'),
    },
    {
      id: 'csv',
      label: 'CSV Tables',
      icon: Table,
      action: () => handleTriggerUpload('.csv'),
    },
    {
      id: 'databases',
      label: 'Databases (JSON, SQL, SQLite)',
      icon: Database,
      action: () => handleTriggerUpload('.json,.sql,.sqlite,.db'),
    },
    {
      id: 'folders',
      label: 'Folders',
      icon: Folder,
      action: () => handleTriggerFolder(),
    },
  ];

  const cards = [
    {
      id: 'upload',
      title: 'Upload Evidence',
      description: 'PDF, images, tables, datasets and more',
      icon: Upload,
    },
    {
      id: 'analyse',
      title: 'Analyse Evidence',
      description: 'Extract and understand key information',
      icon: Search,
    },
    {
      id: 'graph',
      title: 'Build Knowledge Graph',
      description: 'Connect evidence, people, events and claims',
      icon: Share2,
    },
    {
      id: 'conflicts',
      title: 'Detect Conflicts',
      description: 'Find contradictory or mismatching claims',
      icon: ArrowRightLeft,
    },
    {
      id: 'reliability',
      title: 'Reliability Scoring',
      description: 'Evaluate source trustworthiness',
      icon: ShieldCheck,
    },
    {
      id: 'entities',
      title: 'Entity Resolution',
      description: 'Identify and merge same entities',
      icon: Users,
    },
    {
      id: 'reasoning',
      title: 'Evidence Reasoning',
      description: 'Get AI-based, evidence-grounded answers',
      icon: FileCheck,
    },
    {
      id: 'report',
      title: 'Generate Report',
      description: 'Create a complete investigation report',
      icon: BarChart2,
    },
  ];

  return (
    <div
      style={{ backgroundColor: '#0d0d12' }}
      className="min-h-screen flex flex-col justify-between p-6 md:p-8 max-w-6xl mx-auto text-white bg-[#0d0d12]"
    >
      {/* Hidden file input for file selection */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
        }}
        accept={acceptFilter}
        multiple
        className="hidden"
      />

      {/* Hidden folder input for directory selection */}
      <input
        type="file"
        ref={folderInputRef}
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
        }}
        // @ts-expect-error webkitdirectory is standard in browsers
        webkitdirectory=""
        directory=""
        multiple
        className="hidden"
      />

      {/* Top Header: Theme toggle & Avatar */}
      <div className="flex items-center justify-end space-x-3.5 w-full">
        <button
          title="Theme toggle"
          className="p-1.5 rounded-full hover:bg-[#1a1a24] text-slate-400 hover:text-white transition-colors"
        >
          <Sun className="w-4 h-4 stroke-[1.5]" />
        </button>
        <div
          style={{ backgroundColor: '#22222d', borderColor: '#2b2b38' }}
          className="w-7 h-7 rounded-full bg-[#22222d] text-slate-200 text-xs font-semibold flex items-center justify-center border border-[#2b2b38]"
        >
          R
        </div>
      </div>

      {/* Center Section: Logo, Title, Tagline & 8 Cards */}
      <div className="flex-1 flex flex-col items-center justify-center my-6 space-y-6">
        {/* Brand Shield & Titles */}
        <div className="flex flex-col items-center text-center space-y-2">
          {/* Outlined Shield with Checkmark */}
          <div className="w-16 h-16 flex items-center justify-center text-white mb-1">
            <ShieldCheck className="w-16 h-16 stroke-[1.25] text-white" />
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">
            CERBERUS-X
          </h1>

          <p className="text-sm text-slate-400 font-sans tracking-wide mt-1">
            Where Evidence Meets Intelligence.
          </p>
        </div>

        {/* Eight Simple Feature Cards in 2 Rows of 4 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 max-w-5xl w-full pt-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                style={{ backgroundColor: '#17171e', borderColor: '#23232f' }}
                className="bg-[#17171e] border border-[#23232f] p-5 rounded-2xl flex flex-col items-center text-center cursor-default select-none transition-all shadow-sm min-h-[125px] justify-center"
              >
                <div className="w-8 h-8 flex items-center justify-center text-white mb-2">
                  <Icon className="w-5 h-5 stroke-[1.5] text-white" />
                </div>
                <h3 className="text-xs font-bold text-white tracking-tight">
                  {card.title}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug line-clamp-2 max-w-[190px]">
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom: ChatGPT-style AI Input Box with Custom Attachment Menu */}
      <div className="w-full max-w-4xl mx-auto pt-4 relative">
        <form
          onSubmit={handlePromptSubmit}
          style={{ backgroundColor: '#171720', borderColor: '#262633' }}
          className="rounded-3xl border border-[#262633] p-4 flex flex-col space-y-3 shadow-2xl focus-within:border-slate-500 transition-colors relative"
        >
          {/* Attached Files Chips inside the Chat Input */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-1">
              {attachedFiles.map((file, idx) => {
                const ext = file.name.split('.').pop()?.toLowerCase();
                let ChipIcon = FileText;
                if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) ChipIcon = ImageIcon;
                else if (['xlsx', 'xls'].includes(ext || '')) ChipIcon = FileSpreadsheet;
                else if (ext === 'csv') ChipIcon = Table;
                else if (['json', 'sql', 'sqlite', 'db'].includes(ext || '')) ChipIcon = Database;
                else if (ext === 'txt') ChipIcon = FileCode;

                const sizeFormatted =
                  file.size > 1024 * 1024
                    ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                    : `${Math.round(file.size / 1024)} KB`;

                return (
                  <div
                    key={`${file.name}-${idx}`}
                    style={{ backgroundColor: '#21212d', borderColor: '#2f2f3d' }}
                    className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl border border-[#2f2f3d] bg-[#21212d] text-xs text-slate-200 animate-in fade-in"
                  >
                    <ChipIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="max-w-[140px] truncate font-medium text-slate-200">
                      {file.name}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {sizeFormatted}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="p-0.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                      title="Remove attachment"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Top text input with sleek ChatGPT-style typography */}
          <input
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder="Message CERBERUS-X or ask about evidence, claims..."
            className="bg-transparent text-sm text-white placeholder-slate-400 w-full focus:outline-none px-1"
          />

          {/* Bottom actions & send button */}
          <div className="flex items-center justify-between pt-1 relative">
            {/* Attachment trigger: ONLY [+] button */}
            <div className="relative flex items-center" ref={attachMenuRef}>
              {/* + Action Button */}
              <button
                type="button"
                onClick={() => setShowAttachMenu((prev) => !prev)}
                title="Attach evidence files or folders"
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                  showAttachMenu
                    ? 'bg-[#3b3b48] text-white shadow-sm'
                    : 'bg-[#252530] hover:bg-[#30303e] text-slate-200 hover:text-white'
                }`}
              >
                <Plus className="w-4 h-4 stroke-[2]" />
              </button>

              {/* Floating dark popup menu matching ChatGPT desktop */}
              {showAttachMenu && (
                <div
                  style={{ backgroundColor: '#1e1e26', borderColor: '#2e2e3b' }}
                  className="absolute bottom-full mb-3 left-0 w-64 bg-[#1e1e26] border border-[#2e2e3b] rounded-2xl p-1.5 shadow-2xl shadow-black/80 z-50 animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="flex flex-col space-y-0.5">
                    {attachmentOptions.map((opt) => {
                      const OptIcon = opt.icon;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={opt.action}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-normal text-slate-100 hover:bg-[#282834] hover:text-white transition-colors flex items-center space-x-2.5"
                        >
                          <OptIcon className="w-4 h-4 text-slate-400 shrink-0 stroke-[1.5]" />
                          <span className="truncate">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Send Button (White circle with up arrow) */}
            <button
              type="submit"
              disabled={!promptInput.trim() && attachedFiles.length === 0}
              className="w-7 h-7 rounded-full bg-white hover:bg-slate-200 text-black flex items-center justify-center transition-colors disabled:opacity-30 shrink-0 shadow"
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
