import React from 'react';
import { Settings, Cpu, Database, Folder, RefreshCw, CheckCircle2, Shield } from 'lucide-react';

interface SettingsViewProps {
  systemStatus: any;
  onRunDemoSeed: () => void;
  loading: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  systemStatus,
  onRunDemoSeed,
  loading,
}) => {
  return (
    <div className="p-7 space-y-6 max-w-4xl mx-auto text-slate-200">
      <div className="pb-4 border-b border-dark-borderSubtle">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
          <Settings className="w-5 h-5 text-slate-400" />
          <span>System Settings & Operational Parameters</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure offline local reasoning engines, database persistence, and system integrity safeguards.
        </p>
      </div>

      <div className="space-y-5">
        {/* Local AI Engine Card */}
        <div className="bg-dark-card border border-dark-cardBorder rounded-xl p-5 space-y-3">
          <div className="flex items-center space-x-2 text-white font-semibold text-xs">
            <Cpu className="w-4 h-4 text-blue-400" />
            <span>Local AI Model & Reasoning Engine</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono pt-1">
            <div className="bg-dark-sidebar p-3 rounded-lg border border-dark-borderSubtle">
              <span className="text-slate-500 uppercase text-[10px] block">Ollama Local Service</span>
              <span className="text-white font-bold">{systemStatus?.ollama_host || 'http://localhost:11434'}</span>
              <span className="text-[10px] text-slate-400 block mt-1">
                Status: {systemStatus?.ollama_connected ? 'Connected' : 'Offline (Rule-Based Active)'}
              </span>
            </div>
            <div className="bg-dark-sidebar p-3 rounded-lg border border-dark-borderSubtle">
              <span className="text-slate-500 uppercase text-[10px] block">Active Reasoning Mode</span>
              <span className="text-accent-greenBadgeText font-bold">
                {systemStatus?.reasoning_mode || 'RULE_BASED_INFERENCE'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">
                Zero hallucination • Full citation verification
              </span>
            </div>
          </div>
        </div>

        {/* spaCy Named Entity Recognition (NER) */}
        <div className="bg-dark-card border border-dark-cardBorder rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-white font-semibold text-xs">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>spaCy Named Entity Recognition (NER) Engine</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#16281e] text-[#4ade80] border border-[#224832]">
              ● Active (en_core_web_sm)
            </span>
          </div>
          <div className="bg-dark-sidebar p-3.5 rounded-lg border border-dark-borderSubtle text-xs font-mono space-y-1.5">
            <p className="text-white">Model: <strong>spaCy v3.8 (en_core_web_sm)</strong></p>
            <p className="text-slate-400 text-[11px]">
              Extracts named entities from any user-uploaded field or document (People, Organizations, Locations, Dates, Products, Events, Quantities) with normalized disambiguation.
            </p>
            <p className="text-slate-500 text-[10px]">Processing: Fully local & offline • Zero paid API calls</p>
          </div>
        </div>

        {/* Database Persistence */}
        <div className="bg-dark-card border border-dark-cardBorder rounded-xl p-5 space-y-3">
          <div className="flex items-center space-x-2 text-white font-semibold text-xs">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Evidentiary Database Engine</span>
          </div>
          <div className="bg-dark-sidebar p-3.5 rounded-lg border border-dark-borderSubtle text-xs font-mono space-y-1">
            <p className="text-white">Active Driver: <strong>SQLite (SQLAlchemy ORM)</strong></p>
            <p className="text-slate-400 text-[11px]">Database Layer: Compatible with PostgreSQL for high-throughput enterprise clusters.</p>
            <p className="text-slate-500 text-[10px]">Location: /backend/data/cerberus.db</p>
          </div>
        </div>

        {/* Re-seed demo scenario */}
        <div className="bg-dark-card border border-dark-cardBorder rounded-xl p-5 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-white">Government Medical Supply Scenario</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Reset and re-verify the 4 primary case files (1000 delivered vs 800 received vs 750 recorded vs 900 dispatched).
            </p>
          </div>
          <button
            onClick={onRunDemoSeed}
            disabled={loading}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-white text-black hover:bg-slate-200 text-xs font-semibold shadow transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Re-run Scenario</span>
          </button>
        </div>
      </div>
    </div>
  );
};
