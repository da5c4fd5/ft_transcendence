import { useLocation } from 'wouter';

export function Footer() {
  const [, navigate] = useLocation();

  return (
    <footer className="w-full py-5 px-6 flex items-center justify-center gap-4 text-xs text-mediumgrey border-t border-black/5 mt-8">
      <span>© 2026 Capsul</span>
      <span className="text-black/10">·</span>
      <button
        onClick={() => navigate('/privacy')}
        className="hover:text-darkgrey transition-colors"
      >
        Privacy Policy
      </button>
      <span className="text-black/10">·</span>
      <button
        onClick={() => navigate('/terms')}
        className="hover:text-darkgrey transition-colors"
      >
        Terms of Service
      </button>
    </footer>
  );
}
