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
    loginWithGoogle,
    loginWithGithub,
    loginWithMicrosoft,
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
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
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

  const handleOAuth = async (provider: 'google' | 'github' | 'microsoft') => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setOauthLoading(provider);
    try {
      if (provider === 'google') {
        await loginWithGoogle(rememberMe);
      } else if (provider === 'github') {
        await loginWithGithub(rememberMe);
      } else {
        await loginWithMicrosoft(rememberMe);
      }
    } catch (err: any) {
      setErrorMsg(mapFirebaseAuthError(err));
    } finally {
      setOauthLoading(null);
    }
  };

  const isBusy = submitting || Boolean(oauthLoading);

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

            {/* Shield Checkmark Icon + Brand Header */}
            <div className="flex flex-col items-center text-center mb-7">
              <div className="mb-2.5 text-white">
                {/* Shield with Checkmark matching reference image */}
                <svg
                  className="w-10 h-10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2.5L4.5 5.8v5.5c0 4.9 3.2 9.4 7.5 10.7 4.3-1.3 7.5-5.8 7.5-10.7V5.8L12 2.5z" />
                  <path d="M9 12.2l2.1 2.1 4.2-4.3" />
                </svg>
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

            {/* Divider & OAuth Buttons */}
            {mode !== 'forgot' && (
              <>
                <div className="flex items-center my-5">
                  <div className="flex-1 h-px bg-white/[0.12]" />
                  <span className="px-3 text-[11.5px] text-[#8c92a0]">
                    or continue with
                  </span>
                  <div className="flex-1 h-px bg-white/[0.12]" />
                </div>

                <div className="flex items-center justify-center gap-3.5">
                  {/* Google Login */}
                  <button
                    type="button"
                    onClick={() => handleOAuth('google')}
                    disabled={isBusy}
                    aria-label="Continue with Google"
                    title="Continue with Google"
                    className="w-[52px] h-[44px] rounded-xl bg-[#16171d] border border-white/[0.14] hover:border-white/30 hover:bg-[#1e2028] flex items-center justify-center transition-all disabled:opacity-50"
                  >
                    {oauthLoading === 'google' ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                    )}
                  </button>

                  {/* GitHub Login */}
                  <button
                    type="button"
                    onClick={() => handleOAuth('github')}
                    disabled={isBusy}
                    aria-label="Continue with GitHub"
                    title="Continue with GitHub"
                    className="w-[52px] h-[44px] rounded-xl bg-[#16171d] border border-white/[0.14] hover:border-white/30 hover:bg-[#1e2028] flex items-center justify-center transition-all disabled:opacity-50"
                  >
                    {oauthLoading === 'github' ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <svg
                        className="w-[19px] h-[19px] text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                        />
                      </svg>
                    )}
                  </button>

                  {/* Microsoft Login */}
                  <button
                    type="button"
                    onClick={() => handleOAuth('microsoft')}
                    disabled={isBusy}
                    aria-label="Continue with Microsoft"
                    title="Continue with Microsoft"
                    className="w-[52px] h-[44px] rounded-xl bg-[#16171d] border border-white/[0.14] hover:border-white/30 hover:bg-[#1e2028] flex items-center justify-center transition-all disabled:opacity-50"
                  >
                    {oauthLoading === 'microsoft' ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <svg className="w-[17px] h-[17px]" viewBox="0 0 21 21">
                        <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                        <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                        <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                        <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
                      </svg>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
