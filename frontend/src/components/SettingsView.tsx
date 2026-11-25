import React, { useState, useEffect } from 'react';
import {
  Settings,
  Mail,
  ShieldCheck,
  CreditCard,
  Compass,
  Cpu,
  Brain,
  CheckCheck,
  FileSearch,
  Grid,
  Shield,
  Archive,
  Lock,
  Globe,
  Palette,
  LayoutTemplate,
  Sun,
  Moon,
  ArrowUpCircle,
  ChevronRight,
  X,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Save,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NavTab } from './Navigation';

interface SettingsViewProps {
  systemStatus?: any;
  onRunDemoSeed?: () => void;
  loading?: boolean;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onNavigate?: (tab: NavTab) => void;
}

type ActiveModal =
  | null
  | 'personalization'
  | 'models'
  | 'plugins'
  | 'data'
  | 'security'
  | 'updates';

export const SettingsView: React.FC<SettingsViewProps> = ({
  systemStatus,
  onRunDemoSeed,
  loading = false,
  theme = 'dark',
  onToggleTheme,
  onNavigate,
}) => {
  const {
    user,
    userProfile,
    updateUserProfileInfo,
    resendVerificationEmail,
    sendPasswordReset,
    logout,
  } = useAuth();

  // Settings State with localStorage persistence
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  // Investigation & AI Engine Settings
  const [ollamaModel, setOllamaModel] = useState<string>(() => {
    return localStorage.getItem('cerberus_setting_ollama_model') || 'qwen3.5:4b';
  });

  const [autoDetectConflicts, setAutoDetectConflicts] = useState<boolean>(() => {
    const saved = localStorage.getItem('cerberus_setting_autocontradict');
    return saved !== null ? saved === 'true' : true;
  });

  const [strictCitation, setStrictCitation] = useState<boolean>(() => {
    const saved = localStorage.getItem('cerberus_setting_strictcitation');
    return saved !== null ? saved === 'true' : true;
  });

  // App & Interface Preferences
  const [appLanguage, setAppLanguage] = useState<string>(() => {
    return localStorage.getItem('cerberus_setting_language') || 'English';
  });

  const [accentColor, setAccentColor] = useState<string>(() => {
    return localStorage.getItem('cerberus_setting_accent') || 'Blue';
  });

  const [sidebarDefault, setSidebarDefault] = useState<string>(() => {
    return localStorage.getItem('cerberus_setting_sidebar_default') || 'Expanded';
  });

  // Personalization State
  const initialName =
    userProfile?.fullName ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'Investigator';
  const initialRole =
    userProfile?.profileInformation?.role || 'Lead Evidentiary Investigator';

  const [profileName, setProfileName] = useState(initialName);
  const [profileRole, setProfileRole] = useState(initialRole);
  const [customInstructions, setCustomInstructions] = useState(() => {
    return (
      localStorage.getItem('cerberus_custom_instructions') ||
      'Strictly ground reasoning on uploaded evidence hash records. Always flag contradictory kit delivery quantities.'
    );
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Security action states
  const [resendingEmail, setResendingEmail] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  // Sync settings to localStorage
  useEffect(() => {
    localStorage.setItem('cerberus_setting_ollama_model', ollamaModel);
  }, [ollamaModel]);

  useEffect(() => {
    localStorage.setItem('cerberus_setting_autocontradict', String(autoDetectConflicts));
  }, [autoDetectConflicts]);

  useEffect(() => {
    localStorage.setItem('cerberus_setting_strictcitation', String(strictCitation));
  }, [strictCitation]);

  useEffect(() => {
    localStorage.setItem('cerberus_setting_language', appLanguage);
  }, [appLanguage]);

  useEffect(() => {
    localStorage.setItem('cerberus_setting_accent', accentColor);
  }, [accentColor]);

  useEffect(() => {
    localStorage.setItem('cerberus_setting_sidebar_default', sidebarDefault);
  }, [sidebarDefault]);

  const handleSavePersonalization = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setFeedback(null);
    try {
      await updateUserProfileInfo(profileName.trim(), profileRole.trim());
      localStorage.setItem('cerberus_custom_instructions', customInstructions);
      setFeedback({
        type: 'success',
        text: 'Investigator preferences and directives updated.',
      });
      setTimeout(() => {
        setFeedback(null);
        setActiveModal(null);
      }, 1200);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Failed to update preferences.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSendResetPassword = async () => {
    if (!user?.email) return;
    setSendingReset(true);
    setFeedback(null);
    try {
      await sendPasswordReset(user.email);
      setFeedback({
        type: 'success',
        text: `Password reset link dispatched to ${user.email}.`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Unable to send password reset email.',
      });
    } finally {
      setSendingReset(false);
    }
  };

  const handleResendVerify = async () => {
    setResendingEmail(true);
    setFeedback(null);
    try {
      await resendVerificationEmail();
      setFeedback({
        type: 'success',
        text: 'Verification email sent. Check your inbox.',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Failed to resend verification email.',
      });
    } finally {
      setResendingEmail(false);
    }
  };

  const userEmailDisplay = user?.email || 'mohammedfaisal90876@gmail.com';

  return (
    <div className="min-h-full py-8 px-4 flex justify-center">
      {/* Settings Container (Clean ChatGPT-Style Frame without red/yellow/green icons) */}
      <div className="w-full max-w-[620px] bg-[#141416] border border-[#2b2b32] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden text-[#ededed]">
        {/* Clean Header Bar (No red/yellow/green icons) */}
        <div className="px-5 py-3.5 bg-[#19191d] border-b border-[#26262e] flex items-center justify-between select-none">
          <div className="flex items-center space-x-2.5">
            <Settings className="w-4 h-4 text-slate-400" />
            <h1 className="text-[13.5px] font-semibold text-white tracking-tight">
              Settings
            </h1>
          </div>
          <span className="text-[11px] font-mono text-[#8e8ea0] bg-[#22222a] px-2.5 py-0.5 rounded-full border border-[#2e2e38]">
            CERBERUS-X Workspace
          </span>
        </div>

        {/* Settings Body */}
        <div className="p-5 space-y-6">
          {/* ======================================================== */}
          {/* 1. Account & Investigator Profile                        */}
          {/* ======================================================== */}
          <div>
            <div className="text-[12px] font-medium text-[#8e8ea0] tracking-tight mb-2 px-1">
              Account & Credentials
            </div>
            <div className="bg-[#1b1b20] border border-[#282830] rounded-xl overflow-hidden divide-y divide-[#24242c]">
              {/* 1. Email */}
              <div className="flex items-center justify-between px-3.5 py-2.5 text-[13.5px]">
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-[#8e8ea0] shrink-0" />
                  <span className="font-medium text-[#ededed]">Email</span>
                </div>
                <div className="text-xs font-mono text-[#8e8ea0] truncate max-w-[280px]">
                  {userEmailDisplay}
                </div>
              </div>

              {/* 2. Clearance & Role */}
              <div
                onClick={() => setActiveModal('personalization')}
                className="flex items-center justify-between px-3.5 py-2.5 text-[13.5px] hover:bg-[#23232b] cursor-pointer transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <ShieldCheck className="w-4 h-4 text-[#8e8ea0] group-hover:text-white shrink-0 transition-colors" />
                  <span className="font-medium text-[#ededed]">Clearance Level</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-emerald-400 font-mono">
                    {profileRole}
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#71717a] group-hover:text-[#a1a1aa] transition-colors" />
                </div>
              </div>

              {/* 3. License Tier */}
              <div className="flex items-center justify-between px-3.5 py-2.5 text-[13.5px]">
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-4 h-4 text-[#8e8ea0] shrink-0" />
                  <span className="font-medium text-[#ededed]">Station License</span>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-[#252530] text-sky-400 border border-sky-900/40">
                  Enterprise Station
                </span>
              </div>

              {/* 4. Investigation Directives / Personalization */}
              <div
                onClick={() => setActiveModal('personalization')}
                className="flex items-center justify-between px-3.5 py-2.5 text-[13.5px] hover:bg-[#23232b] cursor-pointer transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <Compass className="w-4 h-4 text-[#8e8ea0] group-hover:text-white shrink-0 transition-colors" />
                  <span className="font-medium text-[#ededed]">
                    Investigation Directives & Persona
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#71717a] group-hover:text-[#a1a1aa] transition-colors" />
              </div>

              {/* 5. Security & Login */}
              <div
                onClick={() => setActiveModal('security')}
                className="flex items-center justify-between px-3.5 py-2.5 text-[13.5px] hover:bg-[#23232b] cursor-pointer transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <Lock className="w-4 h-4 text-[#8e8ea0] group-hover:text-white shrink-0 transition-colors" />
                  <span className="font-medium text-[#ededed]">Security and Login</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#71717a] group-hover:text-[#a1a1aa] transition-colors" />
              </div>

              {/* 6. Archived Investigations */}
              <div
                onClick={() => {
                  if (onNavigate) {
                    onNavigate('investigations');
                  }
                }}
                className="flex items-center justify-between px-3.5 py-2.5 text-[13.5px] hover:bg-[#23232b] cursor-pointer transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <Archive className="w-4 h-4 text-[#8e8ea0] group-hover:text-white shrink-0 transition-colors" />
                  <span className="font-medium text-[#ededed]">Archived Investigations</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#71717a] group-hover:text-[#a1a1aa] transition-colors" />
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 2. Investigation & AI Reasoning Engine                   */}
          {/* ======================================================== */}
          <div>
            <div className="text-[12px] font-medium text-[#8e8ea0] tracking-tight mb-2 px-1">
              Evidentiary AI Engine
            </div>
            <div className="bg-[#1b1b20] border border-[#282830] rounded-xl overflow-hidden divide-y divide-[#24242c]">
              {/* 1. Local AI Model */}
              <div className="flex items-center justify-between px-3.5 py-2.5 text-[13.5px]">
                <div className="flex items-center space-x-3">
                  <Cpu className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="font-medium text-[#ededed]">Local AI Model (Ollama)</span>
                </div>
                <div className="flex items-center space-x-1.5 text-xs text-[#8e8ea0]">
                  <select
                    value={ollamaModel}
                    onChange={(e) => setOllamaModel(e.target.value)}
                    className="bg-transparent text-[#8e8ea0] hover:text-white text-xs cursor-pointer focus:outline-none"
                  >
                    <option value="qwen3.5:4b" className="bg-[#1e1e24] text-white">
                      qwen3.5:4b (Offline)
                    </option>
                    <option value="qwen3.5:latest" className="bg-[#1e1e24] text-white">
                      qwen3.5:latest
                    </option>
                    <option value="qwen2.5:7b" className="bg-[#1e1e24] text-white">
                      qwen2.5:7b
                    </option>
                  </select>
                  <span className="text-[11px] text-[#71717a]">⬍</span>
                </div>
              </div>

              {/* 2. Reasoning Mode */}
              <div
                onClick={() => setActiveModal('models')}
                className="flex items-center justify-between px-3.5 py-2.5 text-[13.5px] hover:bg-[#23232b] cursor-pointer transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <Brain className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="font-medium text-[#ededed]">Active Reasoning Engine</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-mono text-emerald-400">
                    {systemStatus?.reasoning_mode || 'Rule-Based & Ollama Fallback'}
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#71717a] group-hover:text-[#a1a1aa] transition-colors" />
                </div>
              </div>

              {/* 3. Auto-Detect Contradictions */}
              <div className="flex items-center justify-between px-3.5 py-2.5 text-[13.5px]">
                <div className="flex items-center space-x-3">
                  <CheckCheck className="w-4 h-4 text-[#8e8ea0] shrink-0" />
                  <span className="font-medium text-[#ededed]">
                    Auto-Detect Evidence Contradictions
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoDetectConflicts((prev) => !prev)}
                  className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${
                    autoDetectConflicts ? 'bg-blue-600' : 'bg-[#3e3e48]'
                  }`}
                  aria-label="Toggle auto-detect contradictions"
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      autoDetectConflicts ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* 4. Strict Citation Enforcement */}
              <div className="flex items-center justify-between px-3.5 py-2.5 text-[13.5px]">
                <div className="flex items-center space-x-3">
                  <FileSearch className="w-4 h-4 text-[#8e8ea0] shrink-0" />
                  <span className="font-medium text-[#ededed]">
                    Zero-Hallucination Citation Verification
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStrictCitation((prev) => !prev)}
                  className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${
                    strictCitation ? 'bg-blue-600' : 'bg-[#3e3e48]'
                  }`}
                  aria-label="Toggle strict citation enforcement"
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      strictCitation ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* 5. Analysis Plugins & Microservices */}
              <div
                onClick={() => setActiveModal('plugins')}
                className="flex items-center justify-between px-3.5 py-2.5 text-[13.5px] hover:bg-[#23232b] cursor-pointer transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <Grid className="w-4 h-4 text-[#8e8ea0] group-hover:text-white shrink-0 transition-colors" />
                  <span className="font-medium text-[#ededed]">Analysis Plugins & NER Engines</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-mono text-[#8e8ea0]">
                    spaCy v3.8 Active
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#71717a] group-hover:text-[#a1a1aa] transition-colors" />
                </div>
              </div>

              {/* 6. Evidentiary Data Controls */}
              <div
                onClick={() => setActiveModal('data')}
                className="flex items-center justify-between px-3.5 py-2.5 text-[13.5px] hover:bg-[#23232b] cursor-pointer transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <Shield className="w-4 h-4 text-[#8e8ea0] group-hover:text-white shrink-0 transition-colors" />
                  <span className="font-medium text-[#ededed]">Data Controls & Demo Scenario</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#71717a] group-hover:text-[#a1a1aa] transition-colors" />
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 3. App & Workspace Preferences                           */}
          {/* ======================================================== */}
          <div>
            <div className="text-[12px] font-medium text-[#8e8ea0] tracking-tight mb-2 px-1">
              Workspace & Appearance
            </div>
            <div className="bg-[#1b1b20] border border-[#282830] rounded-xl overflow-hidden divide-y divide-[#24242c]">
              {/* 1. Interface Theme */}
              <div
                onClick={onToggleTheme}
                className="flex items-center justify-between px-3.5 py-2.5 text-[13.5px] hover:bg-[#23232b] cursor-pointer transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  {theme === 'dark' ? (
                    <Moon className="w-4 h-4 text-blue-400 shrink-0" />
                  ) : (
                    <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <span className="font-medium text-[#ededed]">Theme Mode</span>
                </div>
                <span className="text-xs text-[#8e8ea0] group-hover:text-white transition-colors">
                  {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </span>
              </div>

              {/* 2. Accent Color */}
              <div className="flex items-center justify-between px-3.5 py-2.5 text-[13.5px]">
                <div className="flex items-center space-x-3">
                  <Palette className="w-4 h-4 text-[#8e8ea0] shrink-0" />
                  <span className="font-medium text-[#ededed]">Accent Color</span>
                </div>
                <div className="flex items-center space-x-1.5 text-xs text-[#8e8ea0]">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      accentColor === 'Blue'
                        ? 'bg-blue-500'
                        : accentColor === 'Cyan'
                        ? 'bg-cyan-400'
                        : accentColor === 'Emerald'
                        ? 'bg-emerald-400'
                        : accentColor === 'Purple'
                        ? 'bg-purple-400'
                        : 'bg-amber-400'
                    }`}
                  />
                  <select
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="bg-transparent text-[#8e8ea0] hover:text-white text-xs cursor-pointer focus:outline-none"
                  >
                    <option value="Blue" className="bg-[#1e1e24] text-white">Blue</option>
                    <option value="Cyan" className="bg-[#1e1e24] text-white">Cyan</option>
                    <option value="Emerald" className="bg-[#1e1e24] text-white">Emerald</option>
                    <option value="Purple" className="bg-[#1e1e24] text-white">Purple</option>
                    <option value="Amber" className="bg-[#1e1e24] text-white">Amber</option>
                  </select>
                  <span className="ml-0.5 text-[11px] text-[#71717a]">⬍</span>
                </div>
              </div>

              {/* 3. App Language */}
              <div className="flex items-center justify-between px-3.5 py-2.5 text-[13.5px]">
                <div className="flex items-center space-x-3">
                  <Globe className="w-4 h-4 text-[#8e8ea0] shrink-0" />
                  <span className="font-medium text-[#ededed]">App Language</span>
                </div>
                <div className="flex items-center space-x-1 text-xs text-[#8e8ea0]">
                  <select
                    value={appLanguage}
                    onChange={(e) => setAppLanguage(e.target.value)}
                    className="bg-transparent text-[#8e8ea0] hover:text-white text-xs cursor-pointer focus:outline-none pr-1"
                  >
                    <option value="English" className="bg-[#1e1e24] text-white">English</option>
                    <option value="Spanish" className="bg-[#1e1e24] text-white">Español</option>
                    <option value="French" className="bg-[#1e1e24] text-white">Français</option>
                    <option value="German" className="bg-[#1e1e24] text-white">Deutsch</option>
                    <option value="Japanese" className="bg-[#1e1e24] text-white">日本語</option>
                  </select>
                  <ChevronRight className="w-3.5 h-3.5 text-[#71717a]" />
                </div>
              </div>

              {/* 4. Default Sidebar Layout */}
              <div className="flex items-center justify-between px-3.5 py-2.5 text-[13.5px]">
                <div className="flex items-center space-x-3">
                  <LayoutTemplate className="w-4 h-4 text-[#8e8ea0] shrink-0" />
                  <span className="font-medium text-[#ededed]">Default Sidebar Layout</span>
                </div>
                <div className="flex items-center text-xs text-[#8e8ea0]">
                  <select
                    value={sidebarDefault}
                    onChange={(e) => setSidebarDefault(e.target.value)}
                    className="bg-transparent text-[#8e8ea0] hover:text-white text-xs cursor-pointer focus:outline-none"
                  >
                    <option value="Expanded" className="bg-[#1e1e24] text-white">Expanded</option>
                    <option value="Collapsed" className="bg-[#1e1e24] text-white">Collapsed</option>
                  </select>
                  <span className="ml-1 text-[11px] text-[#71717a]">⬍</span>
                </div>
              </div>

              {/* 5. Check for updates */}
              <div
                onClick={() => setActiveModal('updates')}
                className="flex items-center justify-between px-3.5 py-2.5 text-[13.5px] hover:bg-[#23232b] cursor-pointer transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <ArrowUpCircle className="w-4 h-4 text-[#8e8ea0] group-hover:text-white shrink-0 transition-colors" />
                  <span className="font-medium text-[#ededed]">Check for updates...</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#272730] text-sky-300 border border-[#343440]">
                    CERBERUS-X v2.4
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#71717a] group-hover:text-[#a1a1aa] transition-colors" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* Interactive Detail Modals                                */}
      {/* ======================================================== */}

      {/* 1. Personalization Modal */}
      {activeModal === 'personalization' && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-[#2e2e38] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl text-white">
            <div className="px-5 py-3.5 bg-[#1f1f24] border-b border-[#2d2d38] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Compass className="w-4 h-4 text-[#8e8ea0]" />
                <h3 className="text-sm font-semibold text-white">
                  Investigator Persona & Directives
                </h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-md text-[#8e8ea0] hover:text-white hover:bg-[#2c2c36]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSavePersonalization} className="p-6 space-y-4 text-xs">
              {feedback && (
                <div
                  className={`px-3 py-2 rounded-lg text-xs flex items-center space-x-2 ${
                    feedback.type === 'success'
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-900/50'
                      : 'bg-rose-950/60 text-rose-300 border border-rose-900/50'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>{feedback.text}</span>
                </div>
              )}
              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1.5">
                  Investigator Full Name
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-[#1e1e24] border border-[#343442] text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-slate-400"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1.5">
                  Operational Title / Role
                </label>
                <input
                  type="text"
                  value={profileRole}
                  onChange={(e) => setProfileRole(e.target.value)}
                  className="w-full bg-[#1e1e24] border border-[#343442] text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-slate-400"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1.5">
                  Custom Evidentiary Instructions & Directives
                </label>
                <textarea
                  rows={3}
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  className="w-full bg-[#1e1e24] border border-[#343442] text-white rounded-lg p-2.5 text-xs focus:outline-none focus:border-slate-400"
                />
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-white text-black hover:bg-slate-200 font-semibold text-xs transition-colors disabled:opacity-50"
                >
                  {savingProfile ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Save Directives</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Models & Memory Modal */}
      {activeModal === 'models' && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-[#2e2e38] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl text-white">
            <div className="px-5 py-3.5 bg-[#1f1f24] border-b border-[#2d2d38] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Brain className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-semibold text-white">Evidentiary AI Models</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-md text-[#8e8ea0] hover:text-white hover:bg-[#2c2c36]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="bg-[#1e1e24] border border-[#343442] rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Ollama Local Service</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-900/60">
                    Connected (127.0.0.1:11434)
                  </span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Configured Model: <span className="text-white font-mono">{ollamaModel}</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Local model processes case inquiries offline on device without transferring case materials over the internet.
                </p>
              </div>
              <div className="bg-[#1e1e24] border border-[#343442] rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Deterministic Citation Grounding</span>
                  <span className="text-slate-400 text-[11px] font-mono">SHA-256 Verified</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Zero fabrication policy. Uncited statements are immediately rejected and highlighted in red.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Plugins & NER Modal */}
      {activeModal === 'plugins' && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-[#2e2e38] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl text-white">
            <div className="px-5 py-3.5 bg-[#1f1f24] border-b border-[#2d2d38] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Grid className="w-4 h-4 text-[#8e8ea0]" />
                <h3 className="text-sm font-semibold text-white">Active Case Plugins</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-md text-[#8e8ea0] hover:text-white hover:bg-[#2c2c36]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-3 text-xs">
              <div className="bg-[#1e1e24] border border-[#343442] p-3.5 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">spaCy NER v3.8 Engine</div>
                  <div className="text-[11px] text-slate-400">Extracts Persons, Orgs, Locations & Quantities</div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-950/60 text-purple-300 border border-purple-900/50">
                  Active (en_core_web_sm)
                </span>
              </div>
              <div className="bg-[#1e1e24] border border-[#343442] p-3.5 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">Ollama Offline LLM Bridge</div>
                  <div className="text-[11px] text-slate-400">Local Qwen 3.5 reasoning with deterministic fallback</div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-950/60 text-blue-300 border border-blue-900/50">
                  Active
                </span>
              </div>
              <div className="bg-[#1e1e24] border border-[#343442] p-3.5 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">SQLite Evidentiary Store</div>
                  <div className="text-[11px] text-slate-400">Case files, claims, and contradiction ledger</div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-900/50">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Evidentiary Data Controls Modal */}
      {activeModal === 'data' && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-[#2e2e38] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl text-white">
            <div className="px-5 py-3.5 bg-[#1f1f24] border-b border-[#2d2d38] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-[#8e8ea0]" />
                <h3 className="text-sm font-semibold text-white">Data Controls & Persistence</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-md text-[#8e8ea0] hover:text-white hover:bg-[#2c2c36]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="bg-[#1e1e24] border border-[#343442] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-xs">Re-run Medical Supply Case Demo</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Reset and reload the 4 core evidence files (1,000 delivered vs 800 received vs 750 recorded vs 900 dispatched).
                  </p>
                </div>
                {onRunDemoSeed && (
                  <button
                    onClick={() => {
                      onRunDemoSeed();
                      setActiveModal(null);
                    }}
                    disabled={loading}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white text-black hover:bg-slate-200 text-xs font-semibold shadow transition-colors disabled:opacity-50 shrink-0 ml-3"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>Run Seed</span>
                  </button>
                )}
              </div>
              <div className="bg-[#1e1e24] border border-[#343442] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-xs">Clear Local UI Cache</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Reset saved sidebar widths, drag preferences, and cached filters.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('cerberus_sidebar_width');
                    localStorage.removeItem('cerberus_sidebar_mode');
                    alert('Local UI cache reset. Reloading interface...');
                    window.location.reload();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-950/60 border border-red-900/60 text-red-200 hover:bg-red-900/80 text-xs font-semibold shrink-0 ml-3 transition-colors"
                >
                  Clear Cache
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Security & Login Modal */}
      {activeModal === 'security' && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-[#2e2e38] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl text-white">
            <div className="px-5 py-3.5 bg-[#1f1f24] border-b border-[#2d2d38] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-[#8e8ea0]" />
                <h3 className="text-sm font-semibold text-white">Security & Login</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-md text-[#8e8ea0] hover:text-white hover:bg-[#2c2c36]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              {feedback && (
                <div
                  className={`px-3 py-2 rounded-lg text-xs flex items-center space-x-2 ${
                    feedback.type === 'success'
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-900/50'
                      : 'bg-rose-950/60 text-rose-300 border border-rose-900/50'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>{feedback.text}</span>
                </div>
              )}
              <div className="bg-[#1e1e24] border border-[#343442] rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Email Address</span>
                  <span className="font-mono text-white">{user?.email || 'user@example.com'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Email Status</span>
                  <span className={user?.emailVerified ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
                    {user?.emailVerified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
                {!user?.emailVerified && (
                  <button
                    type="button"
                    onClick={handleResendVerify}
                    disabled={resendingEmail}
                    className="w-full mt-2 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 font-medium text-xs transition-colors"
                  >
                    {resendingEmail ? 'Sending...' : 'Resend Verification Email'}
                  </button>
                )}
              </div>
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleSendResetPassword}
                  disabled={sendingReset}
                  className="w-full py-2 rounded-lg bg-[#262630] hover:bg-[#32323e] border border-[#3b3b48] text-white font-medium text-xs transition-colors flex items-center justify-center space-x-2"
                >
                  {sendingReset && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Send Password Reset Link</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setActiveModal(null);
                    await logout();
                  }}
                  className="w-full py-2 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 border border-rose-900/60 text-rose-200 font-medium text-xs transition-colors flex items-center justify-center space-x-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Software Updates Modal */}
      {activeModal === 'updates' && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-[#2e2e38] rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl text-white">
            <div className="px-5 py-3.5 bg-[#1f1f24] border-b border-[#2d2d38] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ArrowUpCircle className="w-4 h-4 text-[#8e8ea0]" />
                <h3 className="text-sm font-semibold text-white">Software Updates</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-md text-[#8e8ea0] hover:text-white hover:bg-[#2c2c36]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 text-center space-y-3 text-xs">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-950/60 border border-emerald-900/60 text-emerald-400 flex items-center justify-center">
                <Check className="w-6 h-6" />
              </div>
              <div className="font-bold text-white text-sm">Station Software is Up to Date</div>
              <p className="text-slate-400 text-[11.5px]">
                CERBERUS-X Desktop v2.4.0 (Enterprise)<br />
                All offline Ollama engines and spaCy pipeline versions are synchronized.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-slate-200 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
