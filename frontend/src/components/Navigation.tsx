import React from 'react';
import {
  Home,
  Plus,
  Folder,
  Layers,
  BarChart2,
  Share2,
  AlertTriangle,
  ShieldCheck,
  Users,
  FileText,
  Settings,
  SquarePen,
  ChevronDown
} from 'lucide-react';

export type NavTab =
  | 'home'
  | 'investigations'
  | 'repository'
  | 'analysis'
  | 'graph'
  | 'conflicts'
  | 'reliability'
  | 'entities'
  | 'reports'
  | 'settings'
  | 'assistant';

interface NavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onNewInvestigation?: () => void;
  userName?: string;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  onNewInvestigation,
  userName = 'Raghavendra',
}) => {
  // Top main nav group
  const primaryItems = [
    { id: 'home' as NavTab, label: 'Home', icon: Home },
  ];

  // Analysis Tools group
  const analysisTools = [
    { id: 'analysis' as NavTab, label: 'Evidence Analysis', icon: BarChart2 },
    { id: 'graph' as NavTab, label: 'Knowledge Graph', icon: Share2 },
    { id: 'conflicts' as NavTab, label: 'Conflict Detection', icon: AlertTriangle },
    { id: 'reliability' as NavTab, label: 'Reliability Scoring', icon: ShieldCheck },
    { id: 'entities' as NavTab, label: 'Entity Resolution', icon: Users },
  ];

  return (
    <nav
      style={{ backgroundColor: '#131318', borderColor: '#1f1f28' }}
      className="w-64 bg-[#131318] border-r border-[#1f1f28] flex flex-col justify-between shrink-0 select-none min-h-screen text-slate-300"
    >
      <div>
        {/* Brand Header */}
        <div className="pt-5 px-4 pb-4 flex items-center justify-between border-b border-[#1f1f28]/60">
          <div
            onClick={() => onTabChange('home')}
            className="flex items-center space-x-2.5 cursor-pointer"
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-sm tracking-wider text-white font-sans">
              CERBERUS-X
            </span>
          </div>

          <button
            onClick={onNewInvestigation}
            title="Create New Investigation"
            className="p-1 rounded text-slate-400 hover:text-white transition-colors"
          >
            <SquarePen className="w-4 h-4 text-slate-400 hover:text-white" />
          </button>
        </div>

        {/* Primary Navigation Menu */}
        <div className="px-3 pt-3 space-y-1">
          {/* Home */}
          <button
            onClick={() => onTabChange('home')}
            style={activeTab === 'home' ? { backgroundColor: '#202028' } : {}}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'home'
                ? 'bg-[#202028] text-white shadow-xs'
                : 'text-slate-300 hover:bg-[#1a1a22] hover:text-white'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </button>

          {/* New Investigation */}
          <button
            onClick={onNewInvestigation}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-[#1a1a22] hover:text-white transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Investigation</span>
          </button>

          {/* Investigations */}
          <button
            onClick={() => onTabChange('investigations')}
            style={activeTab === 'investigations' ? { backgroundColor: '#202028' } : {}}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'investigations'
                ? 'bg-[#202028] text-white shadow-xs'
                : 'text-slate-300 hover:bg-[#1a1a22] hover:text-white'
            }`}
          >
            <Folder className="w-4 h-4" />
            <span>Investigations</span>
          </button>

          {/* Evidence Repository */}
          <button
            onClick={() => onTabChange('repository')}
            style={activeTab === 'repository' ? { backgroundColor: '#202028' } : {}}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'repository'
                ? 'bg-[#202028] text-white shadow-xs'
                : 'text-slate-300 hover:bg-[#1a1a22] hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Evidence Repository</span>
          </button>
        </div>

        {/* Section Label: Analysis Tools */}
        <div className="px-4 pt-5 pb-1">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Analysis Tools
          </span>
        </div>

        {/* Group 2: Analysis Tools Menu */}
        <div className="px-3 space-y-1">
          {analysisTools.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                style={isActive ? { backgroundColor: '#202028' } : {}}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#202028] text-white shadow-xs'
                    : 'text-slate-300 hover:bg-[#1a1a22] hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Divider & Bottom Utility Nav */}
        <div className="px-3 pt-4 space-y-1">
          {/* Reports & Output */}
          <button
            onClick={() => onTabChange('reports')}
            style={activeTab === 'reports' ? { backgroundColor: '#202028' } : {}}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'reports'
                ? 'bg-[#202028] text-white shadow-xs'
                : 'text-slate-300 hover:bg-[#1a1a22] hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Reports & Output</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => onTabChange('settings')}
            style={activeTab === 'settings' ? { backgroundColor: '#202028' } : {}}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'settings'
                ? 'bg-[#202028] text-white shadow-xs'
                : 'text-slate-300 hover:bg-[#1a1a22] hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* User Profile at Bottom */}
      <div style={{ borderColor: '#1f1f28' }} className="p-3 border-t border-[#1f1f28]">
        <div className="flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-[#1a1a22] cursor-pointer transition-colors">
          <div className="flex items-center space-x-2.5">
            <div
              style={{ backgroundColor: '#22222d', borderColor: '#2b2b38' }}
              className="w-7 h-7 rounded-full bg-[#22222d] text-slate-200 font-semibold text-xs flex items-center justify-center border border-[#2b2b38]"
            >
              {userName.charAt(0)}
            </div>
            <span className="text-xs font-medium text-slate-200 truncate max-w-[120px]">
              {userName}
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
        </div>
      </div>
    </nav>
  );
};
