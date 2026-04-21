import { useState } from 'preact/hooks';
import { User, Mail, Lock, ArrowLeft } from 'lucide-preact';
import { useLocation } from 'wouter';
import { AppLogo } from '../../components/AppLogo/AppLogo';
import { Input } from '../../components/Input/Input';
import { Button } from '../../components/Button/Button';
import type { RegisterPageProps } from './auth.types';
import { api } from '../../lib/api';
import type { ApiError } from '../../lib/api';

export function RegisterPage({ onLogin }: RegisterPageProps) {
  const [, navigate] = useLocation();

  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors]     = useState<{ username?: string; email?: string; password?: string; global?: string }>({});
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const newErrors: typeof errors = {};
    if (username.trim().length < 2) newErrors.username = 'Please enter your username.';
    if (!email.includes('@')) newErrors.email = 'Please enter a valid email address.';
    if (password.length < 8) newErrors.password = 'Password must be at least 8 characters.';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    setLoading(true);
    try {
      const res = await api.post<{ token: string }>('/auth/signup', { email, password, username });
      onLogin(res.token);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 409) {
        setErrors({ email: 'An account with this email already exists.' });
      } else {
        setErrors({ global: apiErr.message ?? 'Something went wrong. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange flex flex-col items-center justify-center px-6 py-12 gap-8">

      <AppLogo size="sm" iconColor="text-orange" subtitle="Start your memory journey" />

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-3xl p-7 flex flex-col gap-5 shadow-lg"
      >
        {errors.global && (
          <p className="text-sm text-red-500 font-medium text-center">{errors.global}</p>
        )}

        <Input
          label="Username"
          type="text"
          placeholder="Your username"
          value={username}
          onChange={setUsername}
          error={errors.username}
          icon={<User size={16} />}
        />
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
          placeholder="At least 8 characters"
          value={password}
          onChange={setPassword}
          error={errors.password}
          icon={<Lock size={16} />}
        />

        <Button type="submit" variant="primary" fullWidth disabled={loading}>
          {loading ? 'Creating account…' : 'Create Account'}
        </Button>

        <p className="text-center text-sm text-darkgrey">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-pink font-semibold hover:underline"
          >
            Log in
          </button>
        </p>
      </form>

      <div className="bg-white/90 rounded-full px-5 py-2.5 shadow-sm text-sm text-darkgrey font-medium">
        ✨ Join thousands growing their memory trees ✨
      </div>

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
