import React, { useState } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User as UserIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { useAuth, mapFirebaseAuthError } from '../context/AuthContext';

type AuthMode = 'login' | 'register' | 'forgot';

export const AuthPage: React.FC = () => {
  const {
    loginWithEmail,
    registerWithEmail,
    sendPasswordReset,
    isConfigured,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [fullName, setFullName] = useState('');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (mode === 'forgot') {
      if (!emailOrUsername.trim()) {
        setErrorMsg('Please enter your registered email address or username.');
        return;
      }
      setSubmitting(true);
      try {
        await sendPasswordReset(emailOrUsername.trim());
        setSuccessMsg(
          'Password reset email dispatched. Please check your inbox and spam folder.'
        );
      } catch (err: any) {
        setErrorMsg(mapFirebaseAuthError(err));
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (mode === 'register') {
      if (!fullName.trim()) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      if (!emailOrUsername.trim() || !emailOrUsername.includes('@')) {
        setErrorMsg('Please enter a valid email address for registration.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }

      setSubmitting(true);
      try {
        await registerWithEmail(fullName.trim(), emailOrUsername.trim(), password);
        setSuccessMsg(
          'Account created! A verification email has been sent to your inbox.'
        );
      } catch (err: any) {
        setErrorMsg(mapFirebaseAuthError(err));
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Login Mode
    if (!emailOrUsername.trim() || !password) {
      setErrorMsg('Please enter both your email/username and password.');
      return;
    }

    setSubmitting(true);
    try {
      await loginWithEmail(emailOrUsername.trim(), password, rememberMe);
    } catch (err: any) {
      setErrorMsg(mapFirebaseAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const isBusy = submitting;

  return (
    <div className="relative min-h-screen w-full bg-[#07080a] text-white flex items-center justify-center p-4 sm:p-6 overflow-hidden select-none">
      {/* Subtle organic dark background waves matching reference backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div
          className="absolute -top-48 -left-48 w-[520px] h-[520px] rounded-full opacity-25"
          style={{
            background:
              'radial-gradient(circle, rgba(38,42,54,0.65) 0%, rgba(7,8,10,0) 70%)',
          }}
        />
        <div
          className="absolute -bottom-56 -right-40 w-[620px] h-[620px] rounded-full opacity-25"
          style={{
            background:
              'radial-gradient(circle, rgba(35,38,49,0.65) 0%, rgba(7,8,10,0) 70%)',
          }}
        />
      </div>

      {/* Main Rounded Dark Charcoal Glass Card */}
      <div
        className="relative z-10 w-full max-w-[960px] rounded-[24px] border border-white/[0.12] overflow-hidden shadow-[0_32px_90px_rgba(0,0,0,0.88)] flex flex-col md:flex-row"
        style={{
          background:
            'linear-gradient(135deg, #16171d 0%, #111216 48%, #0e0f13 100%)',
        }}
      >
        {/* Subtle top-left corner specular highlight inside card */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 w-72 h-72 opacity-30"
          style={{
            background:
              'radial-gradient(circle at top left, rgba(255,255,255,0.08), transparent 68%)',
          }}
        />

        {/* LEFT PANEL: Uploaded 3D Robot Illustration */}
        <div className="hidden md:flex md:w-[47%] items-center justify-center px-6 py-10 relative">
          <div className="relative w-full max-w-[360px] flex items-center justify-center">
            <img
              src="/auth-robot.png"
              alt="CERBERUS-X Intelligent Assistant"
              className="w-full h-auto object-contain pointer-events-none"
              style={{
                maskImage:
                  'radial-gradient(ellipse 88% 88% at 50% 50%, black 58%, transparent 100%)',
                WebkitMaskImage:
                  'radial-gradient(ellipse 88% 88% at 50% 50%, black 58%, transparent 100%)',
              }}
            />
          </div>
        </div>

        {/* RIGHT PANEL: Authentication Form */}
        <div className="w-full md:w-[53%] flex flex-col justify-center px-7 py-10 sm:px-12 sm:py-12">
          <div className="w-full max-w-[350px] mx-auto">
            {/* Mobile-only compact robot avatar */}
            <div className="flex md:hidden justify-center mb-3">
              <img
                src="/auth-robot.png"
                alt="CERBERUS-X"
                className="w-24 h-24 object-contain"
                style={{
                  maskImage:
                    'radial-gradient(circle at center, black 55%, transparent 98%)',
                  WebkitMaskImage:
                    'radial-gradient(circle at center, black 55%, transparent 98%)',
                }}
              />
            </div>

            {/* Custom Brand Logo + Brand Header */}
            <div className="flex flex-col items-center text-center mb-7">
              <div className="mb-2.5 flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="CERBERUS-X Logo"
                  className="w-16 h-16 object-contain rounded-2xl drop-shadow-[0_0_20px_rgba(255,255,255,0.18)]"
                  style={{
                    maskImage:
                      'radial-gradient(circle at center, black 62%, transparent 98%)',
                    WebkitMaskImage:
                      'radial-gradient(circle at center, black 62%, transparent 98%)',
                  }}
                />
              </div>
              <h1 className="text-[26px] font-bold tracking-[0.06em] text-white leading-tight">
                CERBERUS-X
              </h1>
              <p className="text-[13px] text-[#a1a1aa] mt-1 font-normal">
                Where Evidence Meets Intelligence.
              </p>
            </div>

            {/* Firebase config guidance banner if .env is blank */}
            {!isConfigured && (
              <div className="mb-4 px-3.5 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[11.5px] leading-relaxed flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Firebase keys are not set yet. Add your Firebase Web App keys to{' '}
                  <code className="font-mono text-amber-300">frontend/.env</code>{' '}
                  to activate sign-in.
                </span>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-4 px-3.5 py-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="mb-4 px-3.5 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'forgot' && (
                <div className="flex items-center justify-between mb-1">
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="inline-flex items-center text-xs text-[#9ca3af] hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                    Back to Sign In
                  </button>
                  <span className="text-xs font-medium text-slate-300">
                    Reset Password
                  </span>
                </div>
              )}

              {/* Full Name (Registration Only) */}
              {mode === 'register' && (
                <div className="h-[44px] bg-[#16171d] border border-white/[0.14] focus-within:border-white/40 rounded-lg flex items-center px-3.5 transition-colors">
                  <UserIcon className="w-4 h-4 text-[#8c92a0] mr-3 shrink-0" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full Name"
                    disabled={isBusy}
                    autoComplete="name"
                    className="w-full bg-transparent text-[13px] text-white placeholder-[#7c8291] outline-none"
                  />
                </div>
              )}

              {/* Email or Username Input */}
              <div className="h-[44px] bg-[#16171d] border border-white/[0.14] focus-within:border-white/40 rounded-lg flex items-center px-3.5 transition-colors">
                <Mail className="w-4 h-4 text-[#8c92a0] mr-3 shrink-0" />
                <input
                  type={mode === 'register' ? 'email' : 'text'}
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  placeholder={
                    mode === 'register'
                      ? 'Email Address'
                      : mode === 'forgot'
                      ? 'Enter your email address'
                      : 'Email or Username'
                  }
                  disabled={isBusy}
                  autoComplete={mode === 'register' ? 'email' : 'username'}
                  className="w-full bg-transparent text-[13px] text-white placeholder-[#7c8291] outline-none"
                />
              </div>

              {/* Password Input */}
              {mode !== 'forgot' && (
                <div className="h-[44px] bg-[#16171d] border border-white/[0.14] focus-within:border-white/40 rounded-lg flex items-center px-3.5 transition-colors">
                  <Lock className="w-4 h-4 text-[#8c92a0] mr-3 shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    disabled={isBusy}
                    autoComplete={
                      mode === 'register' ? 'new-password' : 'current-password'
                    }
                    className="w-full bg-transparent text-[13px] text-white placeholder-[#7c8291] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="ml-2 text-[#8c92a0] hover:text-white transition-colors focus:outline-none"
                  >
                    {showPassword ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                </div>
              )}

              {/* Confirm Password (Registration Only) */}
              {mode === 'register' && (
                <div className="h-[44px] bg-[#16171d] border border-white/[0.14] focus-within:border-white/40 rounded-lg flex items-center px-3.5 transition-colors">
                  <Lock className="w-4 h-4 text-[#8c92a0] mr-3 shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    disabled={isBusy}
                    autoComplete="new-password"
                    className="w-full bg-transparent text-[13px] text-white placeholder-[#7c8291] outline-none"
                  />
                </div>
              )}

              {/* Forgot Password & Remember Me (Login Mode) */}
              {mode === 'login' && (
                <div className="space-y-2.5 pt-0.5">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-[12px] text-[#a1a1aa] hover:text-white transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <label className="inline-flex items-center space-x-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only"
                    />
                    <span
                      className={`w-[15px] h-[15px] rounded-[4px] border flex items-center justify-center transition-colors ${
                        rememberMe
                          ? 'bg-white border-white text-black'
                          : 'bg-[#16171d] border-white/30 group-hover:border-white/60'
                      }`}
                    >
                      {rememberMe && (
                        <svg
                          className="w-3 h-3"
                          viewBox="0 0 12 12"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M2.5 6l2.5 2.5 4.5-5" />
                        </svg>
                      )}
                    </span>
                    <span className="text-[12.5px] text-[#d1d5db]">
                      Remember Me
                    </span>
                  </label>
                </div>
              )}

              {/* Primary White Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isBusy}
                  className="w-full h-[44px] rounded-full bg-white hover:bg-[#e5e7eb] active:scale-[0.99] text-[#090a0d] font-semibold text-[14px] flex items-center justify-center transition-all shadow-[0_2px_20px_rgba(255,255,255,0.12)] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                  ) : mode === 'login' ? (
                    'Sign In'
                  ) : mode === 'register' ? (
                    'Create Account'
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </div>
            </form>

            {/* Toggle Sign In / Create Account */}
            <div className="mt-5 text-center text-[12.5px] text-[#9ca3af]">
              {mode === 'login' ? (
                <>
                  <span>New to CERBERUS-X?</span>
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className="ml-1.5 font-semibold text-white hover:underline"
                  >
                    Create an Account
                  </button>
                </>
              ) : (
                <>
                  <span>Already have an account?</span>
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="ml-1.5 font-semibold text-white hover:underline"
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
