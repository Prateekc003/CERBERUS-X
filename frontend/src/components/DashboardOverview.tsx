import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  Upload,
  Search,
  Share2,
  ArrowRightLeft,
  Users,
  BarChart2,
  FileCheck,
  Sun,
  Plus,
  FileText,
  Image as ImageIcon,
  Table as TableIcon,
  Database,
  Folder,
  ArrowUp,
  Sparkles
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [acceptFilter, setAcceptFilter] = useState<string>('*');

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;
    onAskQuery(promptInput.trim());
    setPromptInput('');
  };

  const handleTriggerUpload = (filter: string = '*') => {
    setAcceptFilter(filter);
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 50);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (onUploadFiles) {
        onUploadFiles(e.target.files);
      } else {
        onNavigate('repository');
      }
    }
  };

  const cards = [
    {
      id: 'upload',
      title: 'Upload Evidence',
      description: 'PDF, images, tables, datasets and more',
      icon: Upload,
      action: () => onNavigate('repository'),
    },
    {
      id: 'analyse',
      title: 'Analyse Evidence',
      description: 'Extract and understand key information',
      icon: Search,
      action: () => onNavigate('analysis'),
    },
    {
      id: 'graph',
      title: 'Build Knowledge Graph',
      description: 'Connect evidence, people, events and claims',
      icon: Share2,
      action: () => onNavigate('graph'),
    },
    {
      id: 'conflicts',
      title: 'Detect Conflicts',
      description: 'Find contradictory or mismatching claims',
      icon: ArrowRightLeft,
      action: () => onNavigate('conflicts'),
    },
    {
      id: 'reliability',
      title: 'Reliability Scoring',
      description: 'Evaluate source trustworthiness',
      icon: ShieldCheck,
      action: () => onNavigate('reliability'),
    },
    {
      id: 'entities',
      title: 'Entity Resolution',
      description: 'Identify and merge same entities',
      icon: Users,
      action: () => onNavigate('entities'),
    },
    {
      id: 'reasoning',
      title: 'Evidence Reasoning',
      description: 'Get AI-based, evidence-grounded answers',
      icon: FileCheck,
      action: () => onNavigate('assistant'),
    },
    {
      id: 'report',
      title: 'Generate Report',
      description: 'Create a complete investigation report',
      icon: BarChart2,
      action: () => onNavigate('reports'),
    },
  ];

  return (
    <div
      style={{ backgroundColor: '#0d0d12' }}
      className="min-h-screen flex flex-col justify-between p-6 md:p-8 max-w-6xl mx-auto text-white bg-[#0d0d12]"
    >
      {/* Hidden file input for quick attachments */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={acceptFilter}
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

      {/* Center Section: Logo, Title, Tagline Pill & 8 Cards */}
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
                onClick={card.action}
                style={{ backgroundColor: '#17171e', borderColor: '#23232f' }}
                className="bg-[#17171e] border border-[#23232f] hover:border-slate-600 hover:bg-[#1b1b24] p-5 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all shadow-sm group min-h-[125px] justify-center"
              >
                <div className="w-8 h-8 flex items-center justify-center text-white mb-2 group-hover:scale-105 transition-transform">
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

      {/* Bottom: ChatGPT-style AI Input Box */}
      <div className="w-full max-w-4xl mx-auto pt-4">
        <form
          onSubmit={handlePromptSubmit}
          style={{ backgroundColor: '#16161d', borderColor: '#23232f' }}
          className="rounded-2xl border border-[#23232f] p-3.5 flex flex-col space-y-3 shadow-2xl focus-within:border-slate-500 transition-colors"
        >
          {/* Top text input */}
          <input
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder="Ask about your evidence, claims, conflicts or generate a report..."
            className="bg-transparent text-xs text-white placeholder-slate-500 w-full focus:outline-none px-2 py-1"
          />

          {/* Bottom actions & send button */}
          <div className="flex items-center justify-between pt-1">
            {/* Attachment Icons in a row */}
            <div className="flex items-center space-x-1.5 text-slate-400">
              {/* + Action */}
              <button
                type="button"
                onClick={() => handleTriggerUpload('*')}
                title="Upload evidence file"
                className="p-1.5 rounded-lg hover:bg-[#22222d] hover:text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* Document icon (PDF, DOCX) */}
              <button
                type="button"
                onClick={() => handleTriggerUpload('.pdf,.docx,.txt')}
                title="Upload Documents (PDF, DOCX, TXT)"
                className="p-1.5 rounded-lg hover:bg-[#22222d] hover:text-white transition-colors"
              >
                <FileText className="w-4 h-4" />
              </button>

              {/* Image icon (JPG, PNG) */}
              <button
                type="button"
                onClick={() => handleTriggerUpload('.jpg,.jpeg,.png')}
                title="Upload Images (Receipts, Photos, Scans)"
                className="p-1.5 rounded-lg hover:bg-[#22222d] hover:text-white transition-colors"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              {/* Table icon (XLSX, CSV) */}
              <button
                type="button"
                onClick={() => handleTriggerUpload('.xlsx,.csv')}
                title="Upload Tables & Spreadsheets (XLSX, CSV)"
                className="p-1.5 rounded-lg hover:bg-[#22222d] hover:text-white transition-colors"
              >
                <TableIcon className="w-4 h-4" />
              </button>

              {/* Dataset icon (JSON) */}
              <button
                type="button"
                onClick={() => handleTriggerUpload('.json,.csv')}
                title="Upload Structured Datasets (JSON, CSV)"
                className="p-1.5 rounded-lg hover:bg-[#22222d] hover:text-white transition-colors"
              >
                <Database className="w-4 h-4" />
              </button>

              {/* Folder icon */}
              <button
                type="button"
                onClick={() => onNavigate('repository')}
                title="Browse Evidence Repository"
                className="p-1.5 rounded-lg hover:bg-[#22222d] hover:text-white transition-colors"
              >
                <Folder className="w-4 h-4" />
              </button>
            </div>

            {/* Send Button (White circle with up arrow) */}
            <button
              type="submit"
              disabled={!promptInput.trim()}
              className="w-7 h-7 rounded-full bg-white hover:bg-slate-200 text-black flex items-center justify-center transition-colors disabled:opacity-40 shrink-0 shadow"
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
