import React from 'react';
import {
  Home,
  Upload,
  BarChart2,
  Share2,
  FileText,
  Settings,
  ShieldCheck,
  SquarePen,
  ChevronDown
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'upload'
  | 'analysis'
  | 'graph'
  | 'reports'
  | 'settings';

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
  const menuItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: Home },
    { id: 'upload' as NavTab, label: 'Upload Evidence', icon: Upload },
    { id: 'analysis' as NavTab, label: 'Evidence Analysis', icon: BarChart2 },
    { id: 'graph' as NavTab, label: 'Knowledge Graph', icon: Share2 },
    { id: 'reports' as NavTab, label: 'Investigation Report', icon: FileText },
  ];

  return (
    <nav
      style={{ backgroundColor: '#131318', borderColor: '#1f1f28' }}
      className="w-64 bg-[#131318] border-r border-[#1f1f28] flex flex-col justify-between shrink-0 select-none min-h-screen text-slate-300"
    >
      <div>
        {/* macOS Window Controls */}
        <div className="pt-4 px-5 flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
        </div>

        {/* Brand Header */}
        <div className="pt-6 px-5 pb-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wider text-white font-sans block leading-tight">
                CERBERUS-X
              </span>
              <span className="text-[9px] text-slate-400 font-sans tracking-tight block">
                Where Evidence Meets Intelligence.
              </span>
            </div>
          </div>

          <button
            onClick={onNewInvestigation}
            title="Create New Investigation"
            className="p-1 rounded text-slate-400 hover:text-white transition-colors"
          >
            <SquarePen className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="px-3 pt-1 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                style={isActive ? { backgroundColor: '#22222d' } : {}}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#22222d] text-white font-semibold'
                    : 'text-slate-400 hover:bg-[#1a1a22] hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Settings Item */}
        <div className="px-3 pt-6">
          <button
            onClick={() => onTabChange('settings')}
            style={activeTab === 'settings' ? { backgroundColor: '#22222d' } : {}}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'settings'
                ? 'bg-[#22222d] text-white font-semibold'
                : 'text-slate-400 hover:bg-[#1a1a22] hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* User Profile at Bottom */}
      <div style={{ borderColor: '#1f1f28' }} className="p-4 border-t border-[#1f1f28]">
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
