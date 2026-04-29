import { useState, useMemo } from 'preact/hooks';
import { User, Mail, Lock, ArrowLeft } from 'lucide-preact';
import { useLocation } from 'wouter';
import { AppLogo } from '../../components/AppLogo/AppLogo';
import { Input } from '../../components/Input/Input';
import { Button } from '../../components/Button/Button';
import type { RegisterPageProps } from './auth.types';
import { api } from '../../lib/api';
import type { ApiError } from '../../lib/api';
import { clsx as cn } from 'clsx';

const RULES = [
  { id: 'length',    label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { id: 'uppercase', label: 'One uppercase letter',  test: (p: string) => /[A-Z]/.test(p) },
  { id: 'digit',     label: 'One number',            test: (p: string) => /[0-9]/.test(p) },
  { id: 'special',   label: 'One special character', test: (p: string) => /[^a-zA-Z0-9]/.test(p) },
];

const STRENGTH_CONFIG = [
  { label: 'Weak',   color: 'bg-pink' },
  { label: 'Fair',   color: 'bg-orange' },
  { label: 'Good',   color: 'bg-yellow' },
  { label: 'Strong', color: 'bg-yellow' },
];

export function RegisterPage({ onLogin }: RegisterPageProps) {
  const [, navigate] = useLocation();

  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors]     = useState<{ username?: string; email?: string; password?: string; global?: string }>({});
  const [loading, setLoading]   = useState(false);

  const ruleResults = useMemo(() => RULES.map(r => r.test(password)), [password]);
  const strength = ruleResults.filter(Boolean).length;
  const showStrength = password.length > 0;

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const newErrors: typeof errors = {};
    if (username.trim().length < 2) newErrors.username = 'Please enter your username.';
    if (!email.includes('@')) newErrors.email = 'Please enter a valid email address.';
    if (password.length < 8) newErrors.password = 'Password must be at least 8 characters.';
    else if (strength < 4) newErrors.password = 'Password does not meet all requirements.';
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
      } else if (apiErr.status === 422) {
        setErrors({ password: 'Password does not meet requirements.' });
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

        <div className="flex flex-col gap-2">
          <Input
            label="Password"
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={setPassword}
            error={errors.password}
            icon={<Lock size={16} />}
          />

          {showStrength && (
            <div className="flex flex-col gap-2 px-1">
              {/* Strength bar */}
              <div className="flex items-center gap-2">
                <div className="flex gap-1 flex-1">
                  {RULES.map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'h-1.5 flex-1 rounded-full transition-all duration-300',
                        i < strength ? STRENGTH_CONFIG[strength - 1].color : 'bg-lightgrey',
                      )}
                    />
                  ))}
                </div>
                <span className={cn(
                  'text-xs font-bold shrink-0 transition-colors',
                  strength === 4 ? 'text-darkgrey' : strength >= 2 ? 'text-mediumgrey' : 'text-pink',
                )}>
                  {strength > 0 ? STRENGTH_CONFIG[strength - 1].label : ''}
                </span>
              </div>

              {/* Criteria list */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                {RULES.map((rule, i) => (
                  <div key={rule.id} className="flex items-center gap-1.5">
                    <div className={cn(
                      'w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-all',
                      ruleResults[i] ? 'bg-darkgrey' : 'bg-lightgrey',
                    )}>
                      {ruleResults[i] && (
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M1.5 4L3.5 6L6.5 2" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <span className={cn(
                      'text-xs transition-colors',
                      ruleResults[i] ? 'text-darkgrey font-medium' : 'text-mediumgrey',
                    )}>
                      {rule.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

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
