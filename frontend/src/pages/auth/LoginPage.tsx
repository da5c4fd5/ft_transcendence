import { useState } from 'preact/hooks';
import { Mail, Lock, ArrowLeft } from 'lucide-preact';
import { AppLogo } from '../../components/AppLogo/AppLogo';
import { Input } from '../../components/Input/Input';
import { Button } from '../../components/Button/Button';
import type { LoginPageProps } from './auth.types';
import { api, ApiError } from '../../services/api';

export function LoginPage({ onNavigate, onLogin }: LoginPageProps) {

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors]     = useState<{ email?: string; password?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const newErrors: typeof errors = {};
    if (!email.includes('@')) newErrors.email = 'Please enter a valid email address.';
    if (password.length < 6) newErrors.password = 'Password must be at least 6 characters.';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setIsLoading(true);
    setApiError(null);
    try {
      await api.auth.login(email, password);
      onLogin();
    } catch (err) {
      setApiError(
        err instanceof ApiError && err.status === 401
          ? 'Invalid email or password.'
          : 'Something went wrong. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue flex flex-col items-center justify-center px-6 py-12 gap-8">

      <AppLogo size="sm" iconColor="text-blue" subtitle="Welcome back!" />

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-3xl p-7 flex flex-col gap-5 shadow-lg"
      >
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
            onClick={() => onNavigate('forgot-password')}
            className="text-sm text-pink font-semibold hover:underline"
          >
            Forgot password?
          </button>
        </div>

        {apiError && (
          <p className="text-sm text-pink text-center font-medium">{apiError}</p>
        )}

        <Button type="submit" variant="primary" fullWidth disabled={isLoading}>
          {isLoading ? 'Logging in…' : 'Log In'}
        </Button>

        <p className="text-center text-sm text-darkgrey">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => onNavigate('register')}
            className="text-pink font-semibold hover:underline"
          >
            Sign up
          </button>
        </p>
      </form>

      <button
        onClick={() => onNavigate('welcome')}
        className="flex items-center gap-1.5 text-white/70 text-sm hover:text-white transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Home
      </button>
    </div>
  );
}
