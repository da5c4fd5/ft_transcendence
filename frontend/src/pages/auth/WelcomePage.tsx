import { Clock, Sparkles, Sprout, Heart } from 'lucide-preact';
import { AppLogo } from '../../components/AppLogo/AppLogo';
import { Button } from '../../components/Button/Button';
import type { AuthPage } from './auth.types';

interface WelcomePageProps {
  onNavigate: (page: AuthPage) => void;
}

function FeatureCard({
  icon,
  iconBg,
  title,
  description,
}: {
  icon: preact.ComponentChildren;
  iconBg: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-3xl p-5 flex flex-col items-center gap-3 shadow-sm">
      <div className={`w-12 h-12 ${iconBg} rounded-2xl flex items-center justify-center`}>
        {icon}
      </div>
      <h3 className="text-darkgrey font-bold text-base">{title}</h3>
      <p className="self-start text-darkgrey text-sm leading-relaxed">{description}</p>
    </div>
  );
}

export function WelcomePage({ onNavigate }: WelcomePageProps) {
  return (
    <div className="min-h-screen bg-blue flex flex-col items-center justify-center px-6 py-12 gap-8">

      <AppLogo
        size="lg"
        iconColor="text-pink"
        subtitle="One sentence a day, so you never forget your life"
      />

      <div className="flex items-center gap-3">
        <Button variant="white" size="md" onClick={() => onNavigate('register')}>
          Start Your Journey
        </Button>
        <Button variant="outline" size="md" className="text-white" onClick={() => onNavigate('login')}>
          Log In
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
        <FeatureCard
          iconBg="bg-yellow"
          icon={<Sprout size={22} className="text-darkgrey" />}
          title="Grow Your Tree"
          description="Watch your tree flourish as you capture daily moments. The more you write, the healthier it becomes."
        />
        <FeatureCard
          iconBg="bg-orange"
          icon={<Clock size={22} className="text-darkgrey" />}
          title="Life Calendar"
          description="Visualize your year with color-coded moods. See patterns and track your emotional journey."
        />
        <FeatureCard
          iconBg="bg-lightpink"
          icon={<Sparkles size={22} className="text-white" />}
          title="Memory Resurface"
          description="Rediscover random memories from your past. Nostalgia on demand!"
        />
      </div>

      <div className="flex items-center gap-2 bg-white/90 rounded-full px-5 py-2.5 shadow-sm">
        <Heart size={16} className="text-pink" fill="currentColor" />
        <span className="text-darkgrey text-sm font-medium">
          Loved by <span className="text-pink font-bold">10,000+</span> memory keepers worldwide
        </span>
      </div>
    </div>
  );
}
