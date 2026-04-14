import { useState } from 'preact/hooks';
import { Mail, Check, ArrowLeft } from 'lucide-preact';
import { AppLogo } from '../../components/AppLogo/AppLogo';
import { Input } from '../../components/Input/Input';
import { Button } from '../../components/Button/Button';
import type { ForgotPasswordPageProps, ForgotStep } from './auth.types';

const SUBTITLES: Record<ForgotStep, string> = {
  'form':        'Reset your password',
  'check-email': 'Check your inbox',
  'success':     'All set!',
};

export function ForgotPasswordPage({ onNavigate }: ForgotPasswordPageProps) {

  const [step, setStep] = useState<ForgotStep>('form');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const handleSendLink = (e: Event) => {
    e.preventDefault();
    if (!email.includes('@')) { setEmailError('Please enter a valid email address.'); return; }
    setEmailError('');
    setStep('check-email');
  };

  return (
    <div className="min-h-screen bg-verylightpink flex flex-col items-center justify-center px-6 py-12 gap-8">

      <AppLogo size="sm" iconColor="text-pink" subtitle={SUBTITLES[step]} />

      <div className="w-full max-w-sm bg-white rounded-3xl p-7 shadow-lg">

        {step === 'form' && (
          <form onSubmit={handleSendLink} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold text-darkgrey">Forgot Password?</h2>
              <p className="text-sm text-mediumgrey leading-relaxed">
                No worries! Enter your email and we'll send you reset instructions.
              </p>
            </div>
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={setEmail}
              error={emailError}
              icon={<Mail size={16} />}
            />
            <Button type="submit" variant="primary" fullWidth>
              Send Reset Link
            </Button>
          </form>
        )}

        {step === 'check-email' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-verylightpink/30 rounded-full flex items-center justify-center">
              <Mail size={28} className="text-pink" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold text-darkgrey">Check your email</h2>
              <p className="text-sm text-mediumgrey">We've sent password reset instructions to:</p>
              <p className="text-sm font-semibold text-pink">{email}</p>
            </div>
            <p className="text-sm text-mediumgrey">
              Didn't receive the email? Check your spam folder or{' '}
              <button
                type="button"
                onClick={() => { setEmail(''); setStep('form'); }}
                className="text-pink font-semibold hover:underline"
              >
                try another email address.
              </button>
            </p>
            <Button variant="primary" fullWidth onClick={() => setStep('success')}>
              Try Again
            </Button>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-verylightpink/30 rounded-full flex items-center justify-center shadow-sm">
              <Check size={28} className="text-pink" strokeWidth={3} />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold text-darkgrey">Password Reset!</h2>
              <p className="text-sm text-mediumgrey leading-relaxed">
                Your password has been successfully reset. You can now log in with your new password.
              </p>
            </div>
            <Button variant="primary" fullWidth onClick={() => onNavigate('login')}>
              Go to Login
            </Button>
          </div>
        )}
      </div>

      <button
        onClick={() => onNavigate('login')}
        className="flex items-center gap-1.5 text-white/70 text-sm hover:text-white transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Login
      </button>
    </div>
  );
}
