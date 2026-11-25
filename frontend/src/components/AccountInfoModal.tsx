import React, { useState } from 'react';
import {
  X,
  User as UserIcon,
  Mail,
  ShieldCheck,
  Calendar,
  KeyRound,
  Sun,
  Moon,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AccountInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const AccountInfoModal: React.FC<AccountInfoModalProps> = ({
  isOpen,
  onClose,
  theme,
  onToggleTheme,
}) => {
  const {
    user,
    userProfile,
    updateUserProfileInfo,
    resendVerificationEmail,
    refreshAuthUser,
    logout,
  } = useAuth();

  const initialName =
    userProfile?.fullName ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'Investigator';
  const initialRole =
    userProfile?.profileInformation?.role || 'Lead Investigator';

  const [fullName, setFullName] = useState(initialName);
  const [role, setRole] = useState(initialRole);
  const [saving, setSaving] = useState(false);
  const [resending, setResending] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  if (!isOpen || !user) return null;

  const createdRaw = user.metadata?.creationTime;
  const createdDisplay = createdRaw
    ? new Date(createdRaw).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Active Session';

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setFeedback({ type: 'error', text: 'Full name cannot be empty.' });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      await updateUserProfileInfo(fullName.trim(), role.trim());
      setFeedback({
        type: 'success',
        text: 'Account information updated successfully.',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Failed to update profile.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    setFeedback(null);
    try {
      await resendVerificationEmail();
      setFeedback({
        type: 'success',
        text: 'Verification link sent to your email address.',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Unable to resend verification email.',
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-dark-card border border-dark-cardBorder rounded-2xl shadow-2xl max-w-md w-full overflow-hidden text-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-dark-borderSubtle flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <UserIcon className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white">Account Information</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-dark-cardHover transition-colors"
            aria-label="Close account info"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {/* Identity Banner */}
          <div className="flex items-center space-x-3.5 bg-dark-sidebar p-3.5 rounded-xl border border-dark-borderSubtle">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={initialName}
                className="w-12 h-12 rounded-full object-cover border border-dark-cardBorder shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#22222d] border border-dark-cardBorder text-white font-bold text-base flex items-center justify-center shrink-0">
                {initialName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="font-bold text-white text-sm truncate">
                {initialName}
              </div>
              <div className="text-slate-400 truncate text-[11px]">
                {user.email}
              </div>
              <div className="mt-1.5 flex items-center space-x-2">
                {user.emailVerified ? (
                  <span className="inline-flex items-center space-x-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/50 text-emerald-300 border border-emerald-900/60">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified Account</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/50 text-amber-300 border border-amber-900/60">
                    <AlertCircle className="w-3 h-3" />
                    <span>Email Unverified</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {feedback && (
            <div
              className={`px-3.5 py-2.5 rounded-xl border text-xs flex items-start space-x-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-900/60 text-rose-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Profile Form */}
          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-dark-input border border-dark-cardBorder text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-slate-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                Investigator Role
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-dark-input border border-dark-cardBorder text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-slate-500"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-white text-black hover:bg-slate-200 font-semibold text-xs transition-colors disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Save Profile</span>
              </button>
            </div>
          </form>

          {/* Metadata Readout */}
          <div className="bg-dark-sidebar rounded-xl border border-dark-borderSubtle divide-y divide-dark-borderSubtle text-[11px]">
            <div className="px-3.5 py-2.5 flex items-center justify-between">
              <span className="text-slate-400 flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </span>
              <span className="text-slate-200 font-mono truncate max-w-[200px]">
                {user.email}
              </span>
            </div>
            <div className="px-3.5 py-2.5 flex items-center justify-between">
              <span className="text-slate-400 flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Username</span>
              </span>
              <span className="text-slate-200 font-mono">
                @{userProfile?.username || user.email?.split('@')[0] || 'user'}
              </span>
            </div>
            <div className="px-3.5 py-2.5 flex items-center justify-between">
              <span className="text-slate-400 flex items-center space-x-1.5">
                <KeyRound className="w-3.5 h-3.5" />
                <span>User ID</span>
              </span>
              <span className="text-slate-400 font-mono truncate max-w-[180px]">
                {user.uid}
              </span>
            </div>
            <div className="px-3.5 py-2.5 flex items-center justify-between">
              <span className="text-slate-400 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Member Since</span>
              </span>
              <span className="text-slate-200 font-mono">{createdDisplay}</span>
            </div>
          </div>

          {!user.emailVerified && (
            <div className="flex items-center justify-between bg-amber-950/30 border border-amber-900/50 rounded-xl p-3">
              <span className="text-amber-200 text-[11px]">
                Verify email to secure your workspace
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resending}
                  className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-medium text-[11px]"
                >
                  {resending ? 'Sending...' : 'Resend'}
                </button>
                <button
                  type="button"
                  onClick={() => refreshAuthUser()}
                  className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-medium text-[11px]"
                >
                  Refresh
                </button>
              </div>
            </div>
          )}

          {/* Footer: Theme Toggle & Sign Out */}
          <div className="pt-2 border-t border-dark-borderSubtle flex items-center justify-between">
            <button
              type="button"
              onClick={onToggleTheme}
              className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-dark-cardBorder hover:bg-dark-cardHover text-slate-300 hover:text-white transition-colors"
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

            <button
              type="button"
              onClick={async () => {
                onClose();
                await logout();
              }}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 border border-rose-900/60 text-rose-200 font-medium transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
