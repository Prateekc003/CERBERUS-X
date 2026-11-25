import React from 'react';
import { Shield, Cpu, Wifi, WifiOff, AlertTriangle, RefreshCw, FolderOpen, Plus } from 'lucide-react';
import { Investigation } from '../types';

interface TopBarProps {
  investigations: Investigation[];
  currentInvestigation: Investigation | null;
  onSelectInvestigation: (inv: Investigation) => void;
  onCreateInvestigation: () => void;
  onRunDemoSeed: () => void;
  systemStatus: any;
  loading: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  investigations,
  currentInvestigation,
  onSelectInvestigation,
  onCreateInvestigation,
  onRunDemoSeed,
  systemStatus,
  loading,
}) => {
  const isOllamaConnected = systemStatus?.ollama_connected;
  const activeMode = isOllamaConnected ? 'Ollama Local LLM' : 'Rule-Based Inference Engine';

  return (
    <header className="h-16 bg-navy-900 text-white border-b border-navy-800 flex items-center justify-between px-6 select-none sticky top-0 z-40">
      {/* Brand & Tagline */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded bg-blue-600 flex items-center justify-center shadow-inner">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-wider text-slate-100 font-mono">CERBERUS-X</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-900/80 text-blue-300 border border-blue-700/50">
                v1.0 INTEL
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans tracking-wide">
              “Where Evidence Meets Intelligence.”
            </p>
          </div>
        </div>

        <div className="h-8 w-px bg-navy-800 mx-2" />

        {/* Case Switcher */}
        <div className="flex items-center space-x-2">
          <FolderOpen className="w-4 h-4 text-blue-400" />
          <select
            value={currentInvestigation?.id || ''}
            onChange={(e) => {
              const selected = investigations.find((i) => i.id === Number(e.target.value));
              if (selected) onSelectInvestigation(selected);
            }}
            className="bg-navy-800 border border-navy-700 text-xs text-slate-200 rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[280px] font-mono truncate"
          >
            {investigations.map((inv) => (
              <option key={inv.id} value={inv.id}>
                [{inv.case_code}] {inv.title}
              </option>
            ))}
          </select>

          <button
            onClick={onCreateInvestigation}
            title="Create New Investigation Case"
            className="p-1.5 rounded bg-navy-800 hover:bg-navy-700 border border-navy-700 text-slate-300 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right Controls & Status */}
      <div className="flex items-center space-x-3">
        {/* Demo Seed Runner */}
        <button
          onClick={onRunDemoSeed}
          disabled={loading}
          className="flex items-center space-x-1.5 text-xs font-mono font-medium px-3 py-1.5 rounded bg-blue-950/80 hover:bg-blue-900 border border-blue-700/60 text-blue-200 transition-colors shadow-sm disabled:opacity-50"
          title="Run Medical Supply Investigation Demo with 4 real sample files"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Demo Scenario</span>
        </button>

        {/* Reasoning Mode Pill */}
        <div className="flex items-center space-x-2 bg-navy-800/90 border border-navy-700 px-3 py-1 rounded text-xs">
          <Cpu className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[11px] text-slate-300 font-mono">
            Mode: <strong className={isOllamaConnected ? "text-emerald-400" : "text-amber-400"}>{activeMode}</strong>
          </span>
        </div>

        {/* Offline-First & Network Pill */}
        <div className="flex items-center space-x-1.5 bg-navy-800/90 border border-navy-700 px-2.5 py-1 rounded text-xs font-mono text-slate-300">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px]">Offline-Ready</span>
        </div>
      </div>
    </header>
  );
};
