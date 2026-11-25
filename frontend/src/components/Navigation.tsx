import React, { useState } from 'react';
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
  ChevronDown,
  LogOut,
  User as UserIcon,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  PanelLeft,
  ChevronsLeft,
  Bot
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

export type SidebarMode = 'expanded' | 'collapsed' | 'hidden';

interface NavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onNewInvestigation?: () => void;
  userName?: string;
  userEmail?: string;
  userPhotoURL?: string | null;
  onOpenAccountInfo?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onLogout?: () => Promise<void> | void;
  // Flexible resizing & layout props
  sidebarWidth: number;
  sidebarMode: SidebarMode;
  isDragging: boolean;
  onStartResize: (e: React.MouseEvent) => void;
  onToggleMode: (mode?: SidebarMode) => void;
  isMobile: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  onNewInvestigation,
  userName = 'Investigator',
  userEmail,
  userPhotoURL,
  onOpenAccountInfo,
  theme = 'dark',
  onToggleTheme,
  onLogout,
  sidebarWidth,
  sidebarMode,
  isDragging,
  onStartResize,
  onToggleMode,
  isMobile,
  isMobileOpen,
  onCloseMobile,
}) => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Analysis Tools group
  const analysisTools = [
    { id: 'analysis' as NavTab, label: 'Evidence Analysis', icon: BarChart2 },
    { id: 'graph' as NavTab, label: 'Knowledge Graph', icon: Share2 },
    { id: 'conflicts' as NavTab, label: 'Conflict Detection', icon: AlertTriangle },
    { id: 'reliability' as NavTab, label: 'Reliability Scoring', icon: ShieldCheck },
    { id: 'entities' as NavTab, label: 'Entity Resolution', icon: Users },
  ];

  const isCollapsed = !isMobile && sidebarMode === 'collapsed';
  const isHidden = !isMobile && sidebarMode === 'hidden';

  // If hidden on desktop, do not render content inside normal flow
  if (isHidden) {
    return null;
  }

  // Handle tab click (also closes mobile drawer if open)
  const handleItemClick = (tab: NavTab) => {
    onTabChange(tab);
    if (isMobile) {
      onCloseMobile();
    }
  };

  const handleNewCaseClick = () => {
    if (onNewInvestigation) {
      onNewInvestigation();
    }
    if (isMobile) {
      onCloseMobile();
    }
  };

  // Reusable NavItem with floating tooltip when collapsed
  const renderNavItem = (
    id: NavTab,
    label: string,
    Icon: React.ComponentType<{ className?: string }>,
    customOnClick?: () => void
  ) => {
    const isActive = activeTab === id;
    const clickHandler = customOnClick || (() => handleItemClick(id));

    return (
      <div key={id} className="relative group/nav">
        <button
          onClick={clickHandler}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center px-2 py-2.5' : 'space-x-3 px-3 py-2'
          } rounded-xl text-xs font-medium transition-all ${
            isActive
              ? 'bg-[#262626] text-white shadow-xs font-semibold'
              : 'text-[#A0A0A0] hover:bg-[#1e1e1e] hover:text-white'
          }`}
          title={!isCollapsed ? undefined : label}
        >
          <Icon className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span className="truncate">{label}</span>}
        </button>

        {/* Floating Tooltip when Sidebar is Collapsed */}
        {isCollapsed && (
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 hidden group-hover/nav:flex items-center px-2.5 py-1 text-xs font-medium text-white bg-[#171717] border border-[#303030] rounded-lg shadow-2xl whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-100">
            <span>{label}</span>
            <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#171717] border-l border-b border-[#303030] transform rotate-45" />
          </div>
        )}
      </div>
    );
  };

  // Dynamic width style
  const sidebarInlineStyle = isMobile
    ? { width: '280px' }
    : {
        width: isCollapsed ? '68px' : `${sidebarWidth}px`,
      };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Sidebar Element */}
      <nav
        style={sidebarInlineStyle}
        className={`bg-[#171717] border-r border-[#303030] flex flex-col justify-between shrink-0 select-none text-slate-300 relative ${
          isMobile
            ? `fixed inset-y-0 left-0 z-50 h-full shadow-2xl transform transition-transform duration-200 ease-in-out ${
                isMobileOpen ? 'translate-x-0' : '-translate-x-full'
              }`
            : `min-h-screen ${isDragging ? 'transition-none' : 'transition-[width] duration-200 ease-in-out'}`
        }`}
      >
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* Brand Header */}
          <div
            className={`pt-4 px-3 pb-3 flex items-center ${
              isCollapsed ? 'justify-center flex-col space-y-2' : 'justify-between'
            } border-b border-[#303030]`}
          >
            {/* Logo & Brand Title */}
            <div
              onClick={() => handleItemClick('home')}
              className="flex items-center space-x-2.5 cursor-pointer group shrink-0"
              title="CERBERUS-X Home"
            >
              <img
                src="/logo.png"
                alt="CERBERUS-X"
                className="w-7 h-7 object-contain rounded-lg border border-white/10 group-hover:border-white/30 transition-all shadow-xs"
              />
              {!isCollapsed && (
                <span className="font-bold text-sm tracking-wider text-white font-sans truncate">
                  CERBERUS-X
                </span>
              )}
            </div>

            {/* Header Control Buttons */}
            {!isMobile && (
              <div className={`flex items-center ${isCollapsed ? 'flex-col space-y-1.5' : 'space-x-1'}`}>
                {/* New Case Button */}
                {!isCollapsed && (
                  <button
                    onClick={handleNewCaseClick}
                    title="New Investigation"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#262626] transition-colors"
                  >
                    <SquarePen className="w-4 h-4" />
                  </button>
                )}

                {/* Sidebar Collapse / Expand Toggle Button */}
                {isCollapsed ? (
                  <div className="relative group/btn">
                    <button
                      onClick={() => onToggleMode('expanded')}
                      title="Expand sidebar (⌘B)"
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#262626] transition-colors"
                    >
                      <PanelLeftOpen className="w-4 h-4" />
                    </button>
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 hidden group-hover/btn:flex items-center px-2 py-1 text-[11px] font-medium text-white bg-[#171717] border border-[#303030] rounded-md shadow-2xl whitespace-nowrap pointer-events-none">
                      Expand sidebar (⌘B)
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => onToggleMode('collapsed')}
                      title="Collapse sidebar to icon rail (⌘B)"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#262626] transition-colors"
                    >
                      <PanelLeftClose className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onToggleMode('hidden')}
                      title="Hide sidebar completely"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#262626] transition-colors"
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Primary Navigation Menu */}
          <div className="px-2 pt-3 space-y-1">
            {renderNavItem('home', 'Home', Home)}

            {/* New Investigation action */}
            {isCollapsed ? (
              <div className="relative group/nav">
                <button
                  onClick={handleNewCaseClick}
                  className="w-full flex items-center justify-center p-2.5 rounded-xl text-xs font-medium text-[#A0A0A0] hover:bg-[#1e1e1e] hover:text-white transition-all"
                  title="New Investigation"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 hidden group-hover/nav:flex items-center px-2.5 py-1 text-xs font-medium text-white bg-[#171717] border border-[#303030] rounded-lg shadow-2xl whitespace-nowrap pointer-events-none">
                  <span>New Investigation</span>
                  <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#171717] border-l border-b border-[#303030] transform rotate-45" />
                </div>
              </div>
            ) : (
              <button
                onClick={handleNewCaseClick}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium text-[#A0A0A0] hover:bg-[#1e1e1e] hover:text-white transition-all"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span className="truncate">New Investigation</span>
              </button>
            )}

            {renderNavItem('investigations', 'Investigations', Folder)}
            {renderNavItem('repository', 'Evidence Repository', Layers)}
            {renderNavItem('assistant', 'Investigation Assistant', Bot)}
          </div>

          {/* Section Divider & Label: Analysis Tools */}
          <div className="px-3 pt-5 pb-1">
            {!isCollapsed ? (
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                Analysis Tools
              </span>
            ) : (
              <div className="w-6 h-[1px] bg-[#303030] mx-auto my-1" />
            )}
          </div>

          {/* Group 2: Analysis Tools Menu */}
          <div className="px-2 space-y-1">
            {analysisTools.map((item) => renderNavItem(item.id, item.label, item.icon))}
          </div>

          {/* Section Divider & Bottom Utility Nav */}
          <div className="px-3 pt-4 pb-1">
            {!isCollapsed ? (
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                Output & System
              </span>
            ) : (
              <div className="w-6 h-[1px] bg-[#303030] mx-auto my-1" />
            )}
          </div>

          <div className="px-2 space-y-1">
            {renderNavItem('reports', 'Reports & Output', FileText)}
            {renderNavItem('settings', 'Settings', Settings)}
          </div>
        </div>

        {/* User Profile at Bottom */}
        <div className="p-2 border-t border-[#303030] relative shrink-0">
          {profileMenuOpen && (
            <div
              className={`mb-2 p-2 rounded-xl bg-[#171717] border border-[#303030] shadow-2xl space-y-1 text-xs ${
                isCollapsed
                  ? 'absolute left-full bottom-2 ml-3 w-56 z-50 animate-in fade-in zoom-in-95 duration-150'
                  : 'w-full'
              }`}
            >
              <div className="px-2 pb-2 border-b border-[#303030] mb-1">
                <div className="font-semibold text-white truncate">{userName}</div>
                {userEmail && (
                  <div className="text-[11px] text-[#A0A0A0] truncate">{userEmail}</div>
                )}
              </div>
              {onOpenAccountInfo && (
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    onOpenAccountInfo();
                  }}
                  className="w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg text-slate-200 hover:bg-[#262626] hover:text-white transition-colors"
                >
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Account Info</span>
                </button>
              )}
              {onToggleTheme && (
                <button
                  onClick={onToggleTheme}
                  className="w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg text-slate-200 hover:bg-[#262626] hover:text-white transition-colors"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                      <span>Light Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-3.5 h-3.5 text-blue-400" />
                      <span>Dark Mode</span>
                    </>
                  )}
                </button>
              )}
              {onLogout && (
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg text-rose-300 hover:bg-rose-950/50 hover:text-rose-200 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          )}

          <div
            onClick={() => setProfileMenuOpen((prev) => !prev)}
            className={`flex items-center ${
              isCollapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-2'
            } rounded-xl hover:bg-[#262626] cursor-pointer transition-colors group/prof`}
            title={isCollapsed ? userName : undefined}
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              {userPhotoURL ? (
                <img
                  src={userPhotoURL}
                  alt={userName}
                  className="w-7 h-7 rounded-full object-cover border border-[#303030] shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#262626] text-white font-semibold text-xs flex items-center justify-center border border-[#303030] shrink-0">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              {!isCollapsed && (
                <div className="min-w-0">
                  <span className="text-xs font-medium text-white truncate block max-w-[130px]">
                    {userName}
                  </span>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
                  profileMenuOpen ? 'rotate-180' : ''
                }`}
              />
            )}
          </div>
        </div>

        {/* Resizing Edge Drag Handle (Desktop Only when Expanded) */}
        {!isMobile && !isCollapsed && (
          <div
            onMouseDown={onStartResize}
            className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-blue-500/40 active:bg-blue-500 transition-colors z-30 group"
            title="Drag to resize sidebar (220px - 400px)"
          >
            <div
              className={`w-0.5 h-full mx-auto transition-all ${
                isDragging
                  ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.9)]'
                  : 'group-hover:bg-blue-400/70'
              }`}
            />
          </div>
        )}
      </nav>
    </>
  );
};
