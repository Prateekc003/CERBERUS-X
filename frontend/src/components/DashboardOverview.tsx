import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Upload,
  FileText,
  Search,
  AlertTriangle,
  Layers,
  Clock,
  ArrowRight,
  Folder,
  File,
  Paperclip,
  Sun
} from 'lucide-react';
import { DashboardOverview as DashboardData, Investigation } from '../types';

interface DashboardOverviewProps {
  data: DashboardData | null;
  currentInvestigation: Investigation | null;
  onNavigate: (tab: any) => void;
  onNewInvestigation: () => void;
  onAskQuery: (query: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  data,
  currentInvestigation,
  onNavigate,
  onNewInvestigation,
  onAskQuery,
}) => {
  const [promptInput, setPromptInput] = useState('');

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;
    onAskQuery(promptInput.trim());
    setPromptInput('');
  };

  const totalFiles = data?.total_evidence_files ?? 4;
  const totalClaims = data?.total_extracted_claims ?? 8;
  const totalConflicts = data?.total_detected_conflicts ?? 4;
  const highRisk = data?.high_risk_evidence_count ?? 1;

  return (
    <div
      style={{ backgroundColor: '#0d0d12' }}
      className="min-h-screen flex flex-col justify-between p-8 max-w-7xl mx-auto space-y-6 text-white bg-[#0d0d12]"
    >
      <div className="space-y-6">
        {/* Top Header Controls: Theme toggle & Avatar */}
        <div className="flex items-center justify-end space-x-3.5 -mt-2">
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

        {/* Hero Welcome Banner */}
        <div className="space-y-4">
          <div className="flex items-start space-x-3.5">
            <div
              style={{ backgroundColor: '#17171e', borderColor: '#23232f' }}
              className="w-9 h-9 rounded-xl bg-[#17171e] border border-[#23232f] flex items-center justify-center shrink-0 mt-0.5"
            >
              <ShieldCheck className="w-5 h-5 text-white stroke-[1.5]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
                Welcome to CERBERUS-X
              </h1>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Where Evidence Meets Intelligence.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 pt-1">
            <button
              onClick={onNewInvestigation}
              className="flex items-center space-x-2 bg-white hover:bg-slate-100 text-black font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 text-black stroke-[2.5]" />
              <span>New Investigation</span>
            </button>

            <button
              onClick={() => onNavigate('upload')}
              style={{ backgroundColor: '#17171e', borderColor: '#262633' }}
              className="flex items-center space-x-2 bg-[#17171e] border border-[#262633] hover:bg-[#1f1f28] text-white text-xs px-4 py-2.5 rounded-xl transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-white stroke-[2]" />
              <span>Upload Evidence</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards in a Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Uploaded Files */}
          <div
            onClick={() => onNavigate('upload')}
            style={{ backgroundColor: '#17171e', borderColor: '#23232f' }}
            className="bg-[#17171e] border border-[#23232f] hover:border-slate-700 p-5 rounded-2xl flex items-center space-x-4 cursor-pointer transition-all"
          >
            <div
              style={{ backgroundColor: '#131318' }}
              className="w-10 h-10 rounded-xl bg-[#131318] flex items-center justify-center text-slate-300"
            >
              <FileText className="w-5 h-5 stroke-[1.5]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white font-mono leading-none">
                {totalFiles}
              </div>
              <div className="text-xs text-slate-400 mt-1">Uploaded Files</div>
            </div>
          </div>

          {/* Card 2: Information Found */}
          <div
            onClick={() => onNavigate('analysis')}
            style={{ backgroundColor: '#17171e', borderColor: '#23232f' }}
            className="bg-[#17171e] border border-[#23232f] hover:border-slate-700 p-5 rounded-2xl flex items-center space-x-4 cursor-pointer transition-all"
          >
            <div
              style={{ backgroundColor: '#131318' }}
              className="w-10 h-10 rounded-xl bg-[#131318] flex items-center justify-center text-slate-300"
            >
              <Search className="w-5 h-5 stroke-[1.5]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white font-mono leading-none">
                {totalClaims}
              </div>
              <div className="text-xs text-slate-400 mt-1">Information Found</div>
            </div>
          </div>

          {/* Card 3: Conflicts Detected */}
          <div
            onClick={() => onNavigate('analysis')}
            style={{ backgroundColor: '#17171e', borderColor: '#23232f' }}
            className="bg-[#17171e] border border-[#23232f] hover:border-slate-700 p-5 rounded-2xl flex items-center space-x-4 cursor-pointer transition-all"
          >
            <div
              style={{ backgroundColor: '#131318' }}
              className="w-10 h-10 rounded-xl bg-[#131318] flex items-center justify-center text-slate-300"
            >
              <AlertTriangle className="w-5 h-5 stroke-[1.5]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white font-mono leading-none">
                {totalConflicts}
              </div>
              <div className="text-xs text-slate-400 mt-1">Conflicts Detected</div>
            </div>
          </div>

          {/* Card 4: Suspicious Files */}
          <div
            onClick={() => onNavigate('upload')}
            style={{ backgroundColor: '#17171e', borderColor: '#23232f' }}
            className="bg-[#17171e] border border-[#23232f] hover:border-slate-700 p-5 rounded-2xl flex items-center space-x-4 cursor-pointer transition-all"
          >
            <div
              style={{ backgroundColor: '#131318' }}
              className="w-10 h-10 rounded-xl bg-[#131318] flex items-center justify-center text-slate-300"
            >
              <ShieldCheck className="w-5 h-5 stroke-[1.5]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white font-mono leading-none">
                {highRisk}
              </div>
              <div className="text-xs text-slate-400 mt-1">Suspicious Files</div>
            </div>
          </div>
        </div>

        {/* Two-Column Middle Section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Left Column (Span 3) */}
          <div className="lg:col-span-3 space-y-5">
            {/* Current Investigation Card */}
            <div
              style={{ backgroundColor: '#17171e', borderColor: '#23232f' }}
              className="bg-[#17171e] border border-[#23232f] rounded-2xl p-5 space-y-3.5"
            >
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-semibold text-white">Current Investigation</span>
                </div>
                <button
                  onClick={() => onNavigate('analysis')}
                  className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 transition-colors"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center space-x-3.5">
                  <div
                    style={{ backgroundColor: '#131318', borderColor: '#1f1f28' }}
                    className="w-11 h-11 rounded-xl bg-[#131318] border border-[#1f1f28] flex items-center justify-center text-slate-300"
                  >
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Government Medical Supply Investigation
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">
                      4 files • 8 claims • 4 conflicts
                    </p>
                    {/* Progress Bar */}
                    <div
                      style={{ backgroundColor: '#232330' }}
                      className="w-48 h-1.5 bg-[#232330] rounded-full mt-2.5 overflow-hidden"
                    >
                      <div className="h-full bg-white rounded-full w-3/4" />
                    </div>
                  </div>
                </div>

                {/* Analysis Complete Pill */}
                <div
                  style={{ backgroundColor: '#16281e', borderColor: '#224832', color: '#4ade80' }}
                  className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#16281e] border border-[#224832] text-[#4ade80] text-xs font-medium"
                >
                  <span className="w-2 h-2 rounded-full bg-[#22c55e] inline-block animate-pulse" />
                  <span>Analysis Complete</span>
                </div>
              </div>
            </div>

            {/* Recent Investigations List Card */}
            <div
              style={{ backgroundColor: '#17171e', borderColor: '#23232f' }}
              className="bg-[#17171e] border border-[#23232f] rounded-2xl p-5 space-y-3.5"
            >
              <div
                style={{ borderColor: '#23232f' }}
                className="flex items-center justify-between pb-2 border-b border-[#23232f]"
              >
                <div className="flex items-center space-x-2">
                  <Folder className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-semibold text-white">Recent Investigations</span>
                </div>
                <button
                  onClick={() => onNavigate('analysis')}
                  className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 transition-colors"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Table List of Recent Cases */}
              <div className="space-y-3 pt-1">
                {/* Row 1 */}
                <div
                  onClick={() => onNavigate('analysis')}
                  className="flex items-center justify-between py-1.5 text-xs hover:bg-[#1f1f28] px-2 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <File className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-200 font-medium">
                      Government Medical Supply Investigation
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-slate-400 text-xs font-mono">Today, 3:25 PM</span>
                    <span
                      style={{ backgroundColor: '#16281e', borderColor: '#224832', color: '#4ade80' }}
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#16281e] text-[#4ade80] border border-[#224832]"
                    >
                      Completed
                    </span>
                  </div>
                </div>

                {/* Row 2 */}
                <div className="flex items-center justify-between py-1.5 text-xs hover:bg-[#1f1f28] px-2 rounded-lg cursor-pointer transition-colors">
                  <div className="flex items-center space-x-3">
                    <File className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-200 font-medium">Project Alpha Verification</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-slate-400 text-xs font-mono">Yesterday, 6:10 PM</span>
                    <span
                      style={{ backgroundColor: '#2a2414', borderColor: '#443818', color: '#f59e0b' }}
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#2a2414] text-[#f59e0b] border border-[#443818]"
                    >
                      In Progress
                    </span>
                  </div>
                </div>

                {/* Row 3 */}
                <div className="flex items-center justify-between py-1.5 text-xs hover:bg-[#1f1f28] px-2 rounded-lg cursor-pointer transition-colors">
                  <div className="flex items-center space-x-3">
                    <File className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-200 font-medium">Campus Data Review</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-slate-400 text-xs font-mono">Nov 23, 2025</span>
                    <span
                      style={{ backgroundColor: '#22222d', borderColor: '#2e2e3c', color: '#94a3b8' }}
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#22222d] text-slate-400 border border-[#2e2e3c]"
                    >
                      Draft
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (Span 2) */}
          <div className="lg:col-span-2 space-y-5">
            {/* Recent Activity Timeline Card */}
            <div
              style={{ backgroundColor: '#17171e', borderColor: '#23232f' }}
              className="bg-[#17171e] border border-[#23232f] rounded-2xl p-5 space-y-4"
            >
              <div
                style={{ borderColor: '#23232f' }}
                className="flex items-center space-x-2 pb-2 border-b border-[#23232f]"
              >
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-white">Recent Activity</span>
              </div>

              {/* Vertical Timeline */}
              <div className="relative pl-5 space-y-5 pt-1">
                {/* Vertical connecting line */}
                <div
                  style={{ backgroundColor: '#334155' }}
                  className="absolute left-1.5 top-2.5 bottom-2.5 w-px bg-slate-700"
                />

                {/* Node 1 */}
                <div className="relative">
                  <div
                    style={{ backgroundColor: '#ffffff', boxShadow: '0 0 0 4px #17171e' }}
                    className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-white ring-4 ring-[#17171e]"
                  />
                  <p className="text-xs font-semibold text-white">Evidence uploaded</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    Government_Report.pdf • 2 min ago
                  </p>
                </div>

                {/* Node 2 */}
                <div className="relative">
                  <div
                    style={{ backgroundColor: '#ffffff', boxShadow: '0 0 0 4px #17171e' }}
                    className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-white ring-4 ring-[#17171e]"
                  />
                  <p className="text-xs font-semibold text-white">Analysis completed</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    4 conflicts found • 3 min ago
                  </p>
                </div>

                {/* Node 3 */}
                <div className="relative">
                  <div
                    style={{ backgroundColor: '#ffffff', boxShadow: '0 0 0 4px #17171e' }}
                    className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-white ring-4 ring-[#17171e]"
                  />
                  <p className="text-xs font-semibold text-white">Report generated</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    Ready to view • 5 min ago
                  </p>
                </div>
              </div>
            </div>

            {/* Reliable Evidence Card */}
            <div
              style={{ backgroundColor: '#17171e', borderColor: '#23232f' }}
              className="bg-[#17171e] border border-[#23232f] rounded-2xl p-5 flex items-start space-x-3.5"
            >
              <div
                style={{ backgroundColor: '#131318', borderColor: '#1f1f28' }}
                className="w-9 h-9 rounded-xl bg-[#131318] border border-[#1f1f28] flex items-center justify-center shrink-0 mt-0.5"
              >
                <ShieldCheck className="w-5 h-5 text-white stroke-[1.5]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">
                  Reliable Evidence. Confident Decisions.
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Use AI to analyse documents, detect contradictions and generate evidence-backed reports.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Persistent Bottom Assistant Prompt Bar */}
      <div className="pt-2">
        <form
          onSubmit={handlePromptSubmit}
          style={{ backgroundColor: '#16161d', borderColor: '#262633' }}
          className="bg-[#16161d] border border-[#262633] rounded-full px-5 py-3 flex items-center justify-between shadow-xl focus-within:border-slate-500 transition-colors"
        >
          <div className="flex items-center space-x-3.5 flex-1 mr-3">
            <button
              type="button"
              onClick={() => onNavigate('upload')}
              title="Attach evidence"
              className="text-slate-400 hover:text-white transition-colors"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="Ask anything about your investigation..."
              className="bg-transparent text-xs text-white placeholder-slate-500 w-full focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={!promptInput.trim()}
            className="w-7 h-7 rounded-full bg-white hover:bg-slate-200 text-black flex items-center justify-center transition-colors disabled:opacity-40 shrink-0"
          >
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </form>
      </div>
    </div>
  );
};
