import { useState, useEffect } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { Router, Switch, Route, Redirect, useLocation } from 'wouter';
import { Navbar } from './components/Navbar/Navbar';
import { WelcomePage } from './pages/auth/WelcomePage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { TodayPage } from './pages/today/TodayPage';
import { TimelinePage } from './pages/timeline/TimelinePage';
import { MemoriesPage } from './pages/memories/MemoriesPage';
import { TreePage } from './pages/tree/TreePage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { AdminPage } from './pages/admin/AdminPage';
import { GuestPage } from './pages/guest/GuestPage';
import type { SharedMemory } from './pages/guest/guest.types';
import type { User } from './pages/profile/profile.types';
import { api, setUnauthorizedHandler } from './lib/api';
import { getFormattedDate } from './lib/date';

export const TOKEN_KEY = 'capsul_token';

type RawShared = {
  id: string; date: string; content: string; mood: string | null;
  media: { url: string }[];
  contributions: { id: string; content: string; guestName: string | null; createdAt: string; contributor: { username: string; avatarUrl: string | null } | null }[];
  user: { username: string };
  shareToken: string;
};

// Loads and renders a shared memory given its id + token
function SharedMemoryRoute({ memoryId, shareToken, user, onNavigateToWelcome }: {
  memoryId: string;
  shareToken: string;
  user: User | null;
  onNavigateToWelcome: () => void;
}) {
  const [, navigate] = useLocation();
  const [sharedMemory, setSharedMemory] = useState<SharedMemory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<RawShared>(`/memories/shared/${memoryId}/${shareToken}`)
      .then(raw => setSharedMemory({
        id: raw.id,
        date: getFormattedDate(raw.date.slice(0, 10), { format: 'long', uppercase: true }),
        content: raw.content,
        media: raw.media[0]?.url ?? null,
        ownerName: raw.user.username,
        friendContributions: raw.contributions.map(c => ({
          id: c.id,
          guestName: c.guestName ?? c.contributor?.username ?? 'Anonymous',
          avatarURL: c.contributor?.avatarUrl ?? null,
          date: c.createdAt.slice(0, 10),
          content: c.content,
          media: null,
        })),
      }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [memoryId, shareToken]);

  if (loading) return null;
  if (!sharedMemory) return (
    <div className="min-h-screen flex items-center justify-center text-mediumgrey text-sm">
      Memory not found or link is invalid.
    </div>
  );
  return (
    <GuestPage
      memory={sharedMemory}
      currentUser={user ? { username: user.username, avatarUrl: user.avatarUrl } : undefined}
      onBack={() => user ? navigate('/today') : window.history.back()}
      onNavigateToWelcome={onNavigateToWelcome}
    />
  );
}

// Layout wrapper for authenticated pages
function AuthLayout({ user, children }: { user: User | null; children: ComponentChildren }) {
  return (
    <div className="min-h-screen bg-verylightorange pt-16 pb-20 md:pb-0">
      <Navbar
        user={user ? { username: user.username, avatarUrl: user.avatarUrl, isAdmin: user.isAdmin } : undefined}
      />
      <main>{children}</main>
    </div>
  );
}

// Inner app — must be inside <Router> to use useLocation
function AppInner() {
  const [location, navigate] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem(TOKEN_KEY));
  const [user, setUser]                       = useState<User | null>(null);

  // Load user on startup if already authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    api.get<User>('/users/me').then(setUser).catch(() => {
      localStorage.removeItem(TOKEN_KEY);
      setIsAuthenticated(false);
    });
  }, []);

  // Register global 401 handler
  useEffect(() => {
    setUnauthorizedHandler(() => {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      setIsAuthenticated(false);
      navigate('/');
    });
  }, []);

  const handleLogin = async (token?: string) => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    setIsAuthenticated(true);
    const u = await api.get<User>('/users/me');
    setUser(u);
    navigate('/today');
  };

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setIsAuthenticated(false);
    navigate('/');
  };

  // Shared memory route — takes priority over auth state
  const sharedMatch = location.match(/^\/memories\/([^/]+)\/([^/]+)/);
  if (sharedMatch) {
    return (
      <SharedMemoryRoute
        memoryId={sharedMatch[1]}
        shareToken={sharedMatch[2]}
        user={user}
        onNavigateToWelcome={() => navigate('/')}
      />
    );
  }

  // Still fetching user after page refresh — show nothing while loading
  if (isAuthenticated && !user) return null;

  return (
    <Switch>
      {/* Auth routes — redirect to /today if already authenticated */}
      <Route path="/">
        {isAuthenticated ? <Redirect to="/today" /> : <WelcomePage />}
      </Route>
      <Route path="/login">
        {isAuthenticated ? <Redirect to="/today" /> : <LoginPage onLogin={handleLogin} />}
      </Route>
      <Route path="/signup">
        {isAuthenticated ? <Redirect to="/today" /> : <RegisterPage onLogin={handleLogin} />}
      </Route>
      <Route path="/forgot-password">
        {isAuthenticated ? <Redirect to="/today" /> : <ForgotPasswordPage />}
      </Route>

      {/* Protected routes */}
      <Route path="/today">
        {!isAuthenticated
          ? <Redirect to="/" />
          : <AuthLayout user={user}><TodayPage /></AuthLayout>}
      </Route>
      <Route path="/timeline">
        {!isAuthenticated
          ? <Redirect to="/" />
          : <AuthLayout user={user}>
              <TimelinePage
                onNavigateToToday={() => navigate('/today')}
              />
            </AuthLayout>}
      </Route>
      <Route path="/memories">
        {!isAuthenticated
          ? <Redirect to="/" />
          : <AuthLayout user={user}><MemoriesPage /></AuthLayout>}
      </Route>
      <Route path="/tree">
        {!isAuthenticated
          ? <Redirect to="/" />
          : <AuthLayout user={user}><TreePage /></AuthLayout>}
      </Route>
      <Route path="/profile">
        {!isAuthenticated
          ? <Redirect to="/" />
          : user && <AuthLayout user={user}>
              <ProfilePage
                user={user}
                onLogout={handleLogout}
                onNavigateToAdmin={() => navigate('/admin')}
                onUserUpdate={setUser}
              />
            </AuthLayout>}
      </Route>
      <Route path="/admin">
        {!isAuthenticated
          ? <Redirect to="/" />
          : <AuthLayout user={user}>
              <AdminPage
                currentUserId={user?.id ?? ''}
                isAdmin={user?.isAdmin ?? false}
              />
            </AuthLayout>}
      </Route>

      {/* Catch-all fallback */}
      <Route>
        <Redirect to={isAuthenticated ? '/today' : '/'} />
      </Route>
    </Switch>
  );
}

const App = () => (
  <Router>
    <AppInner />
  </Router>
);

export default App;
