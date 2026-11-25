import React, { useState, useEffect } from 'react';
import {
  Mail,
  CreditCard,
  Sparkles,
  Compass,
  BookOpen,
  Bell,
  Grid,
  Megaphone,
  Shield,
  Archive,
  Lock,
  Globe,
  AppWindow,
  Palette,
  Type,
  Link2,
  ArrowUpCircle,
  ChevronRight,
  X,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Cpu,
  Database,
  Save,
  LogOut,
  Sun,
  Moon,
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
  | 'upgrade'
  | 'personalization'
  | 'memory'
  | 'notifications'
  | 'plugins'
  | 'ads'
  | 'data'
  | 'archived'
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
    refreshAuthUser,
    logout,
  } = useAuth();

  // Settings State with localStorage persistence
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [appLanguage, setAppLanguage] = useState<string>(() => {
    return localStorage.getItem('cerberus_setting_language') || 'English';
  });
  const [showInMenuBar, setShowInMenuBar] = useState<string>(() => {
    return localStorage.getItem('cerberus_setting_menubar') || 'When app is running';
  });
  const [accentColor, setAccentColor] = useState<string>(() => {
    return localStorage.getItem('cerberus_setting_accent') || 'Blue';
  });
  const [autoCorrect, setAutoCorrect] = useState<boolean>(() => {
    return localStorage.getItem('cerberus_setting_autocorrect') === 'true';
  });
  const [openInDesktop, setOpenInDesktop] = useState<boolean>(() => {
    const saved = localStorage.getItem('cerberus_setting_openlinks');
    return saved !== null ? saved === 'true' : true;
  });

  // Personalization form state
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

  // Security actions state
  const [resendingEmail, setResendingEmail] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  // Sync settings to localStorage
  useEffect(() => {
    localStorage.setItem('cerberus_setting_language', appLanguage);
  }, [appLanguage]);

  useEffect(() => {
    localStorage.setItem('cerberus_setting_menubar', showInMenuBar);
  }, [showInMenuBar]);

  useEffect(() => {
    localStorage.setItem('cerberus_setting_accent', accentColor);
  }, [accentColor]);

  useEffect(() => {
    localStorage.setItem('cerberus_setting_autocorrect', String(autoCorrect));
  }, [autoCorrect]);

  useEffect(() => {
    localStorage.setItem('cerberus_setting_openlinks', String(openInDesktop));
  }, [openInDesktop]);

  const handleSavePersonalization = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setFeedback(null);
    try {
      await updateUserProfileInfo(profileName.trim(), profileRole.trim());
      localStorage.setItem('cerberus_custom_instructions', customInstructions);
      setFeedback({
        type: 'success',
        text: 'Personalization and investigator preferences saved.',
      });
      setTimeout(() => {
        setFeedback(null);
        setActiveModal(null);
      }, 1200);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Failed to save personalization.',
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
      {/* macOS Desktop Window Frame */}
      <div className="w-full max-w-[620px] bg-[#141416] border border-[#2b2b32] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden text-[#ededed]">
        {/* macOS Title Bar Header */}
        <div className="px-4 py-3 bg-[#19191d] border-b border-[#26262e] flex items-center select-none">
          {/* Traffic Lights */}
          <div className="flex items-center space-x-2 mr-3">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57] border border-[#e0443e]/40 shadow-xs" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e] border border-[#d89e24]/40 shadow-xs" />
            <div className="w-3 h-3 rounded-full bg-[#28c840] border border-[#1aab29]/40 shadow-xs" />
          </div>
          {/* Window Title */}
          <div className="text-[13.5px] font-semibold text-white tracking-tight">
            Settings
          </div>
        </div>

        {/* Settings Body */}
        <div className="p-5 space-y-6">
          {/* ======================================================== */}
          {/* 1. Account Section */}
          {/* ======================================================== */}
          <div>
            <div className="text-[12px] font-medium text-[#8e8ea0] tracking-tight mb-2 px-1">
              Account
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

              {/* 2. Subscription */}
              <div
                onClick={() => setActiveModal('upgrade')}
                className="flex items-center justify-between px-3.5 py-2.5 text-[13.5px] hover:bg-[#23232b] cursor-pointer transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-4 h-4 text-[#8e8ea0] group-hover:text-white shrink-0 transition-colors" />
                  <span className="font-medium text-[#ededed]">Subscription</span>
                </div>
                <button
                  type="button"
                  className="text-xs text-[#8e8ea0] group-hover:text-white flex items-center space-x-1 transition-colors"
                >
                  <span>Go</span>
                </button>
              </div>

              {/* 3. Upgrade Plan */}
              <div
                onClick={() => setActiveModal('upgrade')}
                className="flex items-center justify-between px-3.5 py-2.5 text-[13.5px] hover:bg-[#23232b] cursor-pointer transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <Sparkles className="w-4 h-4 text-[#38bdf8] shrink-0" />
                  <span className="font-medium text-[#38bdf8]">Upgrade plan</span>
                </div>
              </div>

              {/* 4. Personalization */}
              <div
                onClick={() => setActiveModal('personalization')}
                className="flex items-center justify-between px-3.5 py-2.5 text-[13.5px] hover:bg-[#23232b] cursor-pointer transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <Compass className="w-4 h-4 text-[#8e8ea0] group-hover:text-white shrink-0 transition-colors" />
                  <span className="font-medium text-[#ededed]">Personalization</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#71717a] group-hover:text-[#a1a1aa] transition-colors" />
              </div>

              {/* 5. Memory */}
              <div
                onClick={() => setActiveModal('memory')}
                className="flex items-center justify-between px-3.5 py-2.5 text-[13.5px] hover:bg-[#23232b] cursor-pointer transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <BookOpen className="w-4 h-4 text-[#8e8ea0] group-hover:text-white shrink-0 transition-colors" />
                  <span className="font-medium text-[#ededed]">Memory</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#71717a] group-hover:text-[#a1a1aa] transition-colors" />
              </div>

              {/* 6. Notifications */}
              <div
                onClick={() => setActiveModal('notifications')}
                className="flex items-center justify-between px-3.5 py-2.5 text-[13.5px] hover:bg-[#23232b] cursor-pointer transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <Bell className="w-4 h-4 text-[#8e8ea0] group-hover:text-white shrink-0 transition-colors" />
                  <span className="font-medium text-[#ededed]">Notifications</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#71717a] group-hover:text-[#a1a1aa] transition-colors" />
              </div>

              {/* 7. Plugins */}
              <div
                onClick={() => setActiveModal('plugins')}
                className="flex items-center justify-between px-3.5 py-2.5 text-[13.5px] hover:bg-[#23232b] cursor-pointer transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <Grid className="w-4 h-4 text-[#8e8ea0] group-hover:text-white shrink-0 transition-colors" />
                  <span className="font-medium text-[#ededed]">Plugins</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#71717a] group-hover:text-[#a1a1aa] transition-colors" />
              </div>

              {/* 8. Ads controls */}
              <div
                onClick={() => setActiveModal('ads')}
                className="flex items-center justify-between px-3.5 py-2.5 text-[13.5px] hover:bg-[#23232b] cursor-pointer transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <Megaphone className="w-4 h-4 text-[#8e8ea0] group-hover:text-white shrink-0 transition-colors" />
                  <span className="font-medium text-[#ededed]">Ads controls</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#71717a] group-hover:text-[#a1a1aa] transition-colors" />
              </div>

              {/* 9. Data controls */}
              <div
                onClick={() => setActiveModal('data')}
                className="flex items-center justify-between px-3.5 py-2.5 text-[13.5px] hover:bg-[#23232b] cursor-pointer transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <Shield className="w-4 h-4 text-[#8e8ea0] group-hover:text-white shrink-0 transition-colors" />
                  <span className="font-medium text-[#ededed]">Data controls</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#71717a] group-hover:text-[#a1a1aa] transition-colors" />
              </div>

              {/* 10. Archived chats */}
              <div
                onClick={() => {
                  if (onNavigate) {
                    onNavigate('investigations');
                  } else {
                    setActiveModal('archived');
                  }
                }}
                className="flex items-center justify-between px-3.5 py-2.5 text-[13.5px] hover:bg-[#23232b] cursor-pointer transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <Archive className="w-4 h-4 text-[#8e8ea0] group-hover:text-white shrink-0 transition-colors" />
                  <span className="font-medium text-[#ededed]">Archived chats</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#71717a] group-hover:text-[#a1a1aa] transition-colors" />
              </div>

              {/* 11. Security and login */}
              <div
                onClick={() => setActiveModal('security')}
                className="flex items-center justify-between px-3.5 py-2.5 text-[13.5px] hover:bg-[#23232b] cursor-pointer transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <Lock className="w-4 h-4 text-[#8e8ea0] group-hover:text-white shrink-0 transition-colors" />
                  <span className="font-medium text-[#ededed]">Security and login</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#71717a] group-hover:text-[#a1a1aa] transition-colors" />
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 2. App Section */}
          {/* ======================================================== */}
          <div>
            <div className="text-[12px] font-medium text-[#8e8ea0] tracking-tight mb-2 px-1">
              App
            </div>
            <div className="bg-[#1b1b20] border border-[#282830] rounded-xl overflow-hidden divide-y divide-[#24242c]">
              {/* 1. App language */}
              <div className="flex items-center justify-between px-3.5 py-2.5 text-[13.5px]">
                <div className="flex items-center space-x-3">
                  <Globe className="w-4 h-4 text-[#8e8ea0] shrink-0" />
                  <span className="font-medium text-[#ededed]">App language</span>
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

              {/* 2. Show in Menu Bar */}
              <div className="flex items-center justify-between px-3.5 py-2.5 text-[13.5px]">
                <div className="flex items-center space-x-3">
                  <AppWindow className="w-4 h-4 text-[#8e8ea0] shrink-0" />
                  <span className="font-medium text-[#ededed]">Show in Menu Bar</span>
                </div>
                <div className="flex items-center text-xs text-[#8e8ea0]">
                  <select
                    value={showInMenuBar}
                    onChange={(e) => setShowInMenuBar(e.target.value)}
                    className="bg-transparent text-[#8e8ea0] hover:text-white text-xs cursor-pointer focus:outline-none"
                  >
                    <option value="When app is running" className="bg-[#1e1e24] text-white">
                      When app is running
                    </option>
                    <option value="Always" className="bg-[#1e1e24] text-white">
                      Always
                    </option>
                    <option value="Never" className="bg-[#1e1e24] text-white">
                      Never
                    </option>
                  </select>
                  <span className="ml-1 text-[11px] text-[#71717a]">⬍</span>
                </div>
              </div>

              {/* 3. Accent color */}
              <div className="flex items-center justify-between px-3.5 py-2.5 text-[13.5px]">
                <div className="flex items-center space-x-3">
                  <Palette className="w-4 h-4 text-[#8e8ea0] shrink-0" />
                  <span className="font-medium text-[#ededed]">Accent color</span>
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

              {/* 4. Auto-correct spelling */}
              <div className="flex items-center justify-between px-3.5 py-2.5 text-[13.5px]">
                <div className="flex items-center space-x-3">
                  <Type className="w-4 h-4 text-[#8e8ea0] shrink-0" />
                  <span className="font-medium text-[#ededed]">Auto-correct spelling</span>
                </div>
                {/* macOS Toggle Switch (Off state in screenshot) */}
                <button
                  type="button"
                  onClick={() => setAutoCorrect((prev) => !prev)}
                  className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${
                    autoCorrect ? 'bg-blue-600' : 'bg-[#3e3e48]'
                  }`}
                  aria-label="Toggle auto-correct spelling"
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      autoCorrect ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* 5. Open links in desktop app */}
              <div className="flex items-center justify-between px-3.5 py-2.5 text-[13.5px]">
                <div className="flex items-center space-x-3">
                  <Link2 className="w-4 h-4 text-[#8e8ea0] shrink-0" />
                  <span className="font-medium text-[#ededed]">
                    Open ChatGPT links in desktop app
                  </span>
                </div>
                {/* macOS Toggle Switch (On state in screenshot) */}
                <button
                  type="button"
                  onClick={() => setOpenInDesktop((prev) => !prev)}
                  className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${
                    openInDesktop ? 'bg-blue-600' : 'bg-[#3e3e48]'
                  }`}
                  aria-label="Toggle open links in desktop app"
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      openInDesktop ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* 6. Check for updates */}
              <div
                onClick={() => setActiveModal('updates')}
                className="flex items-center justify-between px-3.5 py-2.5 text-[13.5px] hover:bg-[#23232b] cursor-pointer transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <ArrowUpCircle className="w-4 h-4 text-[#8e8ea0] group-hover:text-white shrink-0 transition-colors" />
                  <span className="font-medium text-[#ededed]">Check for updates...</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#272730] text-[#a0a0ab] border border-[#343440]">
                    ChatGPT
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#71717a] group-hover:text-[#a1a1aa] transition-colors" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* Interactive Detail Modals matching ChatGPT desktop UI   */}
      {/* ======================================================== */}

      {/* 1. Upgrade Plan Modal */}
      {activeModal === 'upgrade' && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-[#2e2e38] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl text-white">
            <div className="px-5 py-3.5 bg-[#1f1f24] border-b border-[#2d2d38] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-[#38bdf8]" />
                <h3 className="text-sm font-semibold text-white">Upgrade your plan</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-md text-[#8e8ea0] hover:text-white hover:bg-[#2c2c36]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-[#343442] bg-[#1d1d23] space-y-2">
                  <div className="text-xs font-semibold uppercase text-slate-400">Current Plan</div>
                  <div className="text-lg font-bold">Investigator Free</div>
                  <p className="text-xs text-slate-400">
                    Ollama Qwen 3.5 local inference, rule-based conflict checks, and SQLite case storage.
                  </p>
                  <div className="pt-2">
                    <span className="px-2 py-1 rounded-md text-[11px] font-mono bg-[#282834] text-emerald-400 border border-emerald-900/40">
                      Active Session
                    </span>
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-sky-500/50 bg-[#16202c] space-y-2 relative overflow-hidden">
                  <div className="text-xs font-semibold uppercase text-sky-400">Enterprise AI</div>
                  <div className="text-lg font-bold">CERBERUS-X Pro</div>
                  <p className="text-xs text-slate-300">
                    Multi-agent parallel verification, OCR handwriting ingestion, and team cloud sync.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        alert('Your instance already has CERBERUS-X Pro and offline Qwen 3.5 local model unlocked!');
                        setActiveModal(null);
                      }}
                      className="w-full py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs transition-colors"
                    >
                      Included in Workspace
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Personalization Modal */}
      {activeModal === 'personalization' && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-[#2e2e38] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl text-white">
            <div className="px-5 py-3.5 bg-[#1f1f24] border-b border-[#2d2d38] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Compass className="w-4 h-4 text-[#8e8ea0]" />
                <h3 className="text-sm font-semibold text-white">Personalization</h3>
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
                  Full Name
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
                  Role / Designation
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
                  Custom Evidentiary Instructions
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
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Memory & Evidentiary Engine Modal */}
      {activeModal === 'memory' && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-[#2e2e38] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl text-white">
            <div className="px-5 py-3.5 bg-[#1f1f24] border-b border-[#2d2d38] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-[#8e8ea0]" />
                <h3 className="text-sm font-semibold text-white">Evidentiary Memory & Models</h3>
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
                  <span className="font-semibold text-white">Ollama Local Engine</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-900/60">
                    Connected (127.0.0.1:11434)
                  </span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Model: <span className="text-white font-mono">qwen3.5:4b / qwen3.5:latest</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Offline inference activated. Case questions are answered directly on device without sending sensitive documents to external servers.
                </p>
              </div>
              <div className="bg-[#1e1e24] border border-[#343442] rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Zero Hallucination Grounding</span>
                  <span className="text-slate-400 text-[11px] font-mono">SHA-256 Anchored</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Every generated answer must match explicit citation spans from uploaded evidence. Claims without physical documents are rejected.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Notifications Modal */}
      {activeModal === 'notifications' && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-[#2e2e38] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl text-white">
            <div className="px-5 py-3.5 bg-[#1f1f24] border-b border-[#2d2d38] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-[#8e8ea0]" />
                <h3 className="text-sm font-semibold text-white">Notifications</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-md text-[#8e8ea0] hover:text-white hover:bg-[#2c2c36]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-[#2e2e38]">
                <div>
                  <div className="font-semibold text-white">Discrepancy Alerts</div>
                  <div className="text-[11px] text-slate-400">Notify when contradictory quantities are detected</div>
                </div>
                <span className="text-emerald-400 font-mono text-[11px]">Enabled</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#2e2e38]">
                <div>
                  <div className="font-semibold text-white">Case Report Export Ready</div>
                  <div className="text-[11px] text-slate-400">Trigger alert upon PDF dossier generation</div>
                </div>
                <span className="text-emerald-400 font-mono text-[11px]">Enabled</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="font-semibold text-white">Email Verification Notice</div>
                  <div className="text-[11px] text-slate-400">
                    {user?.emailVerified ? 'Account verified' : 'Action recommended'}
                  </div>
                </div>
                <span className={user?.emailVerified ? 'text-emerald-400 font-mono text-[11px]' : 'text-amber-400 font-mono text-[11px]'}>
                  {user?.emailVerified ? 'Verified' : 'Pending'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Plugins Modal */}
      {activeModal === 'plugins' && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-[#2e2e38] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl text-white">
            <div className="px-5 py-3.5 bg-[#1f1f24] border-b border-[#2d2d38] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Grid className="w-4 h-4 text-[#8e8ea0]" />
                <h3 className="text-sm font-semibold text-white">Active Plugins & Microservices</h3>
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
                  <div className="text-[11px] text-slate-400">Relational case repository & conflict index</div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-900/50">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Ads / Evidentiary Controls Modal */}
      {activeModal === 'ads' && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-[#2e2e38] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl text-white">
            <div className="px-5 py-3.5 bg-[#1f1f24] border-b border-[#2d2d38] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Megaphone className="w-4 h-4 text-[#8e8ea0]" />
                <h3 className="text-sm font-semibold text-white">Ads & Privacy Controls</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-md text-[#8e8ea0] hover:text-white hover:bg-[#2c2c36]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs text-slate-300">
              <div className="p-3 bg-[#1e1e24] border border-[#343442] rounded-xl space-y-1">
                <div className="font-semibold text-white">Zero Tracking Guarantee</div>
                <p className="text-[11px] text-slate-400">
                  CERBERUS-X does not serve commercial advertisements or share case investigation telemetry with third-party ad networks.
                </p>
              </div>
              <div className="p-3 bg-[#1e1e24] border border-[#343442] rounded-xl space-y-1">
                <div className="font-semibold text-white">Local Device Isolation</div>
                <p className="text-[11px] text-slate-400">
                  Evidence files are analyzed inside your designated sandbox and SQLite database.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Data Controls Modal */}
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
                  <h4 className="font-bold text-white text-xs">Clear Local Storage Cache</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Reset saved sidebar widths, custom layout preferences, and cached filters.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('cerberus_sidebar_width');
                    localStorage.removeItem('cerberus_sidebar_mode');
                    alert('Local UI cache reset. Refreshing page...');
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

      {/* 8. Security and Login Modal */}
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

      {/* 9. Updates Modal */}
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
              <div className="font-bold text-white text-sm">You are on the latest version</div>
              <p className="text-slate-400 text-[11.5px]">
                CERBERUS-X Desktop v2.4.0 (Build 2026.11-macOS)<br />
                All local intelligence engines and offline Ollama bridges are synchronized.
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
