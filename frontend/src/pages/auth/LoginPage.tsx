import { useState } from 'preact/hooks';
import { Mail, Lock, ArrowLeft, Shield } from 'lucide-preact';
import { useLocation } from 'wouter';
import { AppLogo } from '../../components/AppLogo/AppLogo';
import { Input } from '../../components/Input/Input';
import { Button } from '../../components/Button/Button';
import type { LoginPageProps } from './auth.types';
import { api } from '../../lib/api';
import type { ApiError } from '../../lib/api';

type LoginResponse  = { token: string };
type MfaRequired    = { mfaRequired: true; mfaToken: string };
type MfaResponse    = { token: string };

export function LoginPage({ onLogin }: LoginPageProps) {
  const [, navigate] = useLocation();

  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors]         = useState<{ email?: string; password?: string; global?: string }>({});
  const [loading, setLoading]       = useState(false);

  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [mfaError, setMfaError] = useState('');

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const newErrors: typeof errors = {};
    if (!email.includes('@')) newErrors.email = 'Please enter a valid email address.';
    if (password.length < 6) newErrors.password = 'Password must be at least 6 characters.';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    setLoading(true);
    try {
      const res = await api.post<LoginResponse | MfaRequired>('/auth/login', { email, password });
      if ('mfaRequired' in res) {
        setMfaToken(res.mfaToken);
      } else {
        onLogin(res.token);
      }
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 401) {
        setErrors({ global: 'Invalid email or password.' });
      } else {
        setErrors({ global: apiErr.message ?? 'Something went wrong. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMfa = async (e: Event) => {
    e.preventDefault();
    if (totpCode.trim().length < 6) { setMfaError('Please enter your 6-digit code.'); return; }
    setMfaError('');
    setLoading(true);
    try {
      const res = await api.post<MfaResponse>('/auth/mfa', { mfaToken, code: totpCode });
      onLogin(res.token);
    } catch (err) {
      const apiErr = err as ApiError;
      setMfaError(apiErr.status === 401 ? 'Invalid code. Please try again.' : (apiErr.message ?? 'Something went wrong.'));
    } finally {
      setLoading(false);
    }
  };

  if (mfaToken !== null) {
    return (
      <div className="min-h-screen bg-blue flex flex-col items-center justify-center px-6 py-12 gap-8">
        <AppLogo size="sm" iconColor="text-blue" subtitle="Two-factor authentication" />
        <form
          onSubmit={handleMfa}
          className="w-full max-w-sm bg-white rounded-3xl p-7 flex flex-col gap-5 shadow-lg"
        >
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-darkgrey">Enter your code</h2>
            <p className="text-sm text-mediumgrey leading-relaxed">
              Open your authenticator app and enter the 6-digit code.
            </p>
          </div>
          <Input
            label="Authenticator code"
            type="text"
            placeholder="000000"
            value={totpCode}
            onChange={setTotpCode}
            error={mfaError}
            icon={<Shield size={16} />}
          />
          <Button type="submit" variant="primary" fullWidth disabled={loading}>
            {loading ? 'Verifying…' : 'Verify'}
          </Button>
          <button
            type="button"
            onClick={() => { setMfaToken(null); setTotpCode(''); setMfaError(''); }}
            className="text-sm text-mediumgrey hover:text-darkgrey transition-colors text-center"
          >
            Use a different account
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue flex flex-col items-center justify-center px-6 py-12 gap-8">

      <AppLogo size="sm" iconColor="text-blue" subtitle="Welcome back!" />

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-3xl p-7 flex flex-col gap-5 shadow-lg"
      >
        {errors.global && (
          <p className="text-sm text-red-500 font-medium text-center">{errors.global}</p>
        )}

        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={setEmail}
          error={errors.email}
          icon={<Mail size={16} />}
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={setPassword}
          error={errors.password}
          icon={<Lock size={16} />}
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe((e.target as HTMLInputElement).checked)}
              className="w-4 h-4 rounded accent-yellow cursor-pointer"
            />
            <span className="text-sm text-darkgrey">Remember me</span>
          </label>
          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="text-sm text-pink font-semibold hover:underline"
          >
            Forgot password?
          </button>
        </div>

        <Button type="submit" variant="primary" fullWidth disabled={loading}>
          {loading ? 'Logging in…' : 'Log In'}
        </Button>

        <p className="text-center text-sm text-darkgrey">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/signup')}
            className="text-pink font-semibold hover:underline"
          >
            Sign up
          </button>
        </p>
      </form>

      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1.5 text-white/70 text-sm hover:text-white transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Home
      </button>
    </div>
  );
}
