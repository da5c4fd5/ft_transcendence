import { useState } from 'preact/hooks';
import { useLocation } from 'wouter';
import { ChevronLeft, Copy, CheckCheck } from 'lucide-preact';
import { clsx as cn } from 'clsx';
import type { User } from '../profile/profile.types';
import { api, getApiErrorMessage } from '../../lib/api';

const cardBase = 'bg-white rounded-3xl p-6 flex flex-col gap-4 shadow-sm';
const ghostBtn = 'flex items-center gap-1.5 text-xs font-semibold text-darkgrey border border-black/10 rounded-full px-3 py-1.5 hover:bg-lightgrey/30 transition-colors';

type IssuedPublicApiKey = { key: string; preview: string; createdAt: string };

function PublicApiKeyCard({ user, onUserUpdate }: { user: User; onUserUpdate: (u: User) => void }) {
  const [error, setError]       = useState<string | null>(null);
  const [message, setMessage]   = useState<string | null>(null);
  const [issuing, setIssuing]   = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [copied, setCopied]     = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  const refreshUser = async () => {
    const updated = await api.get<User>('/users/me');
    onUserUpdate(updated);
  };

  const handleGenerate = async () => {
    setIssuing(true);
    setError(null);
    setMessage(null);
    setCopied(false);
    try {
      const issued = await api.post<IssuedPublicApiKey>('/users/me/public-api-key');
      setRevealedKey(issued.key);
      setMessage('New API key generated. Copy it now: it will not be shown again.');
      await refreshUser();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to generate the API key.'));
    } finally {
      setIssuing(false);
    }
  };

  const handleRevoke = async () => {
    setRevoking(true);
    setError(null);
    setMessage(null);
    setCopied(false);
    try {
      await api.delete('/users/me/public-api-key');
      setRevealedKey(null);
      setMessage('API key revoked.');
      await refreshUser();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to revoke the API key.'));
    } finally {
      setRevoking(false);
    }
  };

  const handleCopy = async () => {
    if (!revealedKey) return;
    try {
      await navigator.clipboard.writeText(revealedKey);
      setCopied(true);
    } catch {
      setError('Failed to copy the API key.');
    }
  };

  const publicApiBase = `${window.location.origin}/api/public-api`;
  const canIssue = user.emailVerified;

  return (
    <div className={cardBase}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-darkgrey">Public API</h2>
          <p className="text-sm text-mediumgrey mt-1 leading-relaxed">
            Generate an API key to access the documented rate-limited public API.
          </p>
        </div>
        <div className={cn(
          'px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase shrink-0',
          user.publicApi.enabled ? 'bg-yellow text-darkgrey' : 'bg-lightgrey text-mediumgrey'
        )}>
          {user.publicApi.enabled ? 'Active' : 'Disabled'}
        </div>
      </div>

      <div className="bg-verylightorange rounded-2xl px-4 py-3 flex flex-col gap-1">
        <p className="text-xs font-bold tracking-widest text-mediumgrey uppercase">Current key</p>
        <p className="text-sm font-semibold text-darkgrey">
          {user.publicApi.preview ?? 'No API key generated yet'}
        </p>
        {user.publicApi.createdAt && (
          <p className="text-xs text-mediumgrey">
            Generated {new Date(user.publicApi.createdAt).toLocaleString()}
          </p>
        )}
      </div>

      {!canIssue && (
        <p className="text-sm text-mediumgrey leading-relaxed">
          Verify your email before generating a public API key.
        </p>
      )}

      {revealedKey && (
        <div className="rounded-2xl border border-yellow/40 bg-yellow/5 px-4 py-3 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-widest text-darkgrey uppercase">Copy this key now</p>
              <p className="text-xs text-mediumgrey mt-1">For security reasons it is only shown once.</p>
            </div>
            <button type="button" onClick={handleCopy} className={ghostBtn}>
              {copied ? <CheckCheck size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <code className="block rounded-2xl bg-white px-4 py-3 text-xs font-mono text-darkgrey break-all border border-yellow/20">
            {revealedKey}
          </code>
        </div>
      )}

      <div className="rounded-2xl bg-lightgrey/30 px-4 py-3 flex flex-col gap-2">
        <p className="text-xs font-bold tracking-widest text-mediumgrey uppercase">Example</p>
        <code className="text-xs font-mono text-darkgrey break-all">
          {`curl -H "X-API-Key: ${revealedKey ?? 'YOUR_API_KEY'}" ${publicApiBase}/memories`}
        </code>
        <a
          href="/api/docs"
          target="_blank"
          rel="noreferrer"
          className="text-xs font-semibold text-darkgrey hover:underline"
        >
          Open API documentation
        </a>
      </div>

      {message && <p className="text-xs text-darkgrey px-1">{message}</p>}
      {error && <p className="text-xs text-pink px-1">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={issuing || !canIssue}
          className="flex-1 py-3 rounded-full bg-yellow text-darkgrey text-sm font-bold hover:bg-yellow/80 transition-colors disabled:opacity-50"
        >
          {issuing ? 'Generating…' : user.publicApi.enabled ? 'Rotate API key' : 'Generate API key'}
        </button>
        <button
          type="button"
          onClick={handleRevoke}
          disabled={revoking || !user.publicApi.enabled}
          className="flex-1 py-3 rounded-full border border-black/10 text-sm font-semibold text-darkgrey hover:bg-lightgrey/50 transition-colors disabled:opacity-50"
        >
          {revoking ? 'Revoking…' : 'Revoke'}
        </button>
      </div>
    </div>
  );
}

export function DeveloperPage({ user, onUserUpdate }: { user: User; onUserUpdate: (u: User) => void }) {
  const [, navigate] = useLocation();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 lg:py-12 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="w-9 h-9 flex items-center justify-center rounded-full border border-black/10 text-darkgrey hover:bg-lightgrey/30 transition-colors shrink-0"
        >
          <ChevronLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-darkgrey">Developer</h1>
          <p className="text-sm text-mediumgrey mt-0.5">API keys and developer tools</p>
        </div>
      </div>

      <PublicApiKeyCard user={user} onUserUpdate={onUserUpdate} />
    </div>
  );
}
