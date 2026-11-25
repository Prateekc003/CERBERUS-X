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

  return (
    <div
      className="min-h-[100dvh] w-full bg-[#0D0D0D] text-[#FFFFFF] flex items-center justify-center px-6 sm:px-10 lg:px-16 py-6 md:py-0 overflow-x-hidden select-none"
      style={{
        backgroundImage:
          'radial-gradient(circle at 26% 50%, rgba(147, 197, 253, 0.06) 0%, rgba(13, 13, 13, 0) 48%)',
      }}
    >
      <div className="w-full max-w-[1380px] flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 lg:gap-12">
        {/* LEFT SECTION (45% width on desktop): Prominent Floating Robot Illustration */}
        <div className="w-full md:w-[45%] flex items-center justify-center">
          <div className="animate-cerberus-float flex items-center justify-center">
            <img
              src="/auth-robot-clean.png"
              alt="CERBERUS-X Intelligent Assistant"
              className="w-[200px] sm:w-[250px] md:w-[340px] lg:w-[450px] xl:w-[530px] h-auto object-contain pointer-events-none"
              style={{
                filter:
                  'drop-shadow(0 0 32px rgba(186, 230, 253, 0.14)) drop-shadow(0 28px 36px rgba(0, 0, 0, 0.85))',
              }}
            />
          </div>
        </div>

        {/* RIGHT SECTION (55% width on desktop): Clean Minimal Login Form */}
        <div className="w-full md:w-[55%] flex items-center justify-center">
          <div className="w-full max-w-[440px] lg:max-w-[460px]">
            {/* 1. CERBERUS-X Logo | 2. Heading | 3. Tagline */}
            <div className="flex flex-col items-center text-center mb-7">
              <img
                src="/auth-logo-clean.png"
                alt="CERBERUS-X Logo"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain mb-3"
                style={{
                  filter: 'drop-shadow(0 0 18px rgba(186, 230, 253, 0.2))',
                }}
              />
              <h1 className="text-[28px] sm:text-[34px] font-bold tracking-[0.06em] text-[#FFFFFF] leading-tight">
                CERBERUS-X
              </h1>
              <p className="text-[14px] text-[#A0A0A0] mt-1.5 font-normal">
                Where Evidence Meets Intelligence.
              </p>
            </div>

            {/* Configuration Notice if .env missing */}
            {!isConfigured && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-[#171717] border border-amber-500/40 text-amber-200 text-xs leading-relaxed flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Firebase configuration is missing. Add your credentials to{' '}
                  <code className="font-mono text-amber-300">frontend/.env</code>.
                </span>
              </div>
            )}

            {/* Error Alert */}
            {errorMsg && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-[#171717] border border-rose-500/40 text-rose-300 text-xs flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success Alert */}
            {successMsg && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-[#171717] border border-emerald-500/40 text-emerald-300 text-xs flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Form Inputs & Controls */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'forgot' && (
                <div className="flex items-center justify-between pb-1">
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="inline-flex items-center text-xs text-[#A0A0A0] hover:text-[#FFFFFF] transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                    Back to Sign In
                  </button>
                  <span className="text-xs font-medium text-[#FFFFFF]">
                    Reset Password
                  </span>
                </div>
              )}

              {/* Full Name (Registration Mode) */}
              {mode === 'register' && (
                <div className="h-[50px] bg-[#171717] border border-[#303030] focus-within:border-[#93c5fd]/70 focus-within:shadow-[0_0_0_3px_rgba(147,197,253,0.08)] rounded-xl flex items-center px-4 transition-all">
                  <UserIcon className="w-[18px] h-[18px] text-[#A0A0A0] mr-3.5 shrink-0" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full Name"
                    disabled={submitting}
                    autoComplete="name"
                    className="w-full bg-transparent text-[14.5px] text-[#FFFFFF] placeholder-[#A0A0A0] outline-none"
                  />
                </div>
              )}

              {/* 4. Email or Username field */}
              <div className="h-[50px] bg-[#171717] border border-[#303030] focus-within:border-[#93c5fd]/70 focus-within:shadow-[0_0_0_3px_rgba(147,197,253,0.08)] rounded-xl flex items-center px-4 transition-all">
                <Mail className="w-[18px] h-[18px] text-[#A0A0A0] mr-3.5 shrink-0" />
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
                  disabled={submitting}
                  autoComplete={mode === 'register' ? 'email' : 'username'}
                  className="w-full bg-transparent text-[14.5px] text-[#FFFFFF] placeholder-[#A0A0A0] outline-none"
                />
              </div>

              {/* 5. Password field with show/hide icon */}
              {mode !== 'forgot' && (
                <div className="h-[50px] bg-[#171717] border border-[#303030] focus-within:border-[#93c5fd]/70 focus-within:shadow-[0_0_0_3px_rgba(147,197,253,0.08)] rounded-xl flex items-center px-4 transition-all">
                  <Lock className="w-[18px] h-[18px] text-[#A0A0A0] mr-3.5 shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    disabled={submitting}
                    autoComplete={
                      mode === 'register' ? 'new-password' : 'current-password'
                    }
                    className="w-full bg-transparent text-[14.5px] text-[#FFFFFF] placeholder-[#A0A0A0] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="ml-2 text-[#A0A0A0] hover:text-[#FFFFFF] transition-colors focus:outline-none"
                  >
                    {showPassword ? (
                      <Eye className="w-[18px] h-[18px]" />
                    ) : (
                      <EyeOff className="w-[18px] h-[18px]" />
                    )}
                  </button>
                </div>
              )}

              {/* Confirm Password (Registration Mode) */}
              {mode === 'register' && (
                <div className="h-[50px] bg-[#171717] border border-[#303030] focus-within:border-[#93c5fd]/70 focus-within:shadow-[0_0_0_3px_rgba(147,197,253,0.08)] rounded-xl flex items-center px-4 transition-all">
                  <Lock className="w-[18px] h-[18px] text-[#A0A0A0] mr-3.5 shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    disabled={submitting}
                    autoComplete="new-password"
                    className="w-full bg-transparent text-[14.5px] text-[#FFFFFF] placeholder-[#A0A0A0] outline-none"
                  />
                </div>
              )}

              {/* 6. Forgot Password & 7. Remember Me */}
              {mode === 'login' && (
                <div className="space-y-3 pt-0.5">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-[13px] text-[#A0A0A0] hover:text-[#FFFFFF] transition-colors"
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
                      className={`w-[16px] h-[16px] rounded-[4px] border flex items-center justify-center transition-colors ${
                        rememberMe
                          ? 'bg-[#FFFFFF] border-[#FFFFFF] text-[#0D0D0D]'
                          : 'bg-[#171717] border-[#303030] group-hover:border-[#A0A0A0]'
                      }`}
                    >
                      {rememberMe && (
                        <svg
                          className="w-3 h-3"
                          viewBox="0 0 12 12"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M2.5 6l2.5 2.5 4.5-5" />
                        </svg>
                      )}
                    </span>
                    <span className="text-[13.5px] text-[#FFFFFF]/90">
                      Remember Me
                    </span>
                  </label>
                </div>
              )}

              {/* 8. Sign In Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-[50px] rounded-full bg-[#FFFFFF] hover:bg-[#EAEAEA] active:scale-[0.99] text-[#0D0D0D] font-semibold text-[15px] flex items-center justify-center transition-all shadow-[0_0_24px_rgba(186,230,253,0.14)] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#0D0D0D]" />
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

            {/* 9. Create Account Option */}
            <div className="mt-6 text-center text-[13.5px] text-[#A0A0A0]">
              {mode === 'login' ? (
                <>
                  <span>New to CERBERUS-X?</span>
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className="ml-1.5 font-semibold text-[#FFFFFF] hover:underline"
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
                    className="ml-1.5 font-semibold text-[#FFFFFF] hover:underline"
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
