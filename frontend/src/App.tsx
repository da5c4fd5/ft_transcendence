import { useState, useEffect } from 'preact/hooks';
import { Navbar } from './components/Navbar/Navbar';
import type { Page } from './components/Navbar/Navbar.types';
import type { AuthPage } from './pages/auth/auth.types';
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
import { api, getToken, clearToken } from './services/api';
import type { User as ApiUser } from './services/api';
import type { User as ProfileUser } from './pages/profile/profile.types';

function toProfileUser(u: ApiUser): ProfileUser {
  return {
    id:        u.id,
    username:  u.username,
    email:     u.email,
    avatarURL: u.avatarUrl ?? null,
    isAdmin:   u.isAdmin,
  };
}

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authPage, setAuthPage]               = useState<AuthPage>('welcome');
  const [currentUser, setCurrentUser]         = useState<ApiUser | null>(null);

  const [currentPage, setCurrentPage]           = useState<Page>('today');
  const [isAdmin, setIsAdmin]                   = useState(false);
  // TODO: supprimer showGuestPreview et showGuestPreviewAnon quand le routing /shared/:token sera implémenté
  const [guestMemory, setGuestMemory] = useState<SharedMemory | null>(null);
  const [showGuestPreviewAnon, setShowGuestPreviewAnon] = useState(false);

  // Restore session from stored token on mount
  useEffect(() => {
    if (!getToken()) return;
    api.users.getMe()
      .then(u => { setCurrentUser(u); setIsAuthenticated(true); })
      .catch(() => clearToken());
  }, []);

  const handleLogin = () => {
    api.users.getMe()
      .then(u => { setCurrentUser(u); setIsAuthenticated(true); })
      .catch(() => { clearToken(); });
  };

  const handleLogout = async () => {
    try { await api.auth.logout(); } catch { /* ignore — token cleared below */ }
    clearToken();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setAuthPage('welcome');
  };

  const handleUserUpdate = (updated: ProfileUser) => {
    if (!currentUser) return;
    setCurrentUser({
      ...currentUser,
      username:  updated.username,
      email:     updated.email,
      avatarUrl: updated.avatarURL ?? null,
    });
  };

  if (!isAuthenticated) {
    if (authPage === 'welcome')          return <WelcomePage onNavigate={setAuthPage} />;
    if (authPage === 'login')            return <LoginPage onNavigate={setAuthPage} onLogin={handleLogin} />;
    if (authPage === 'register')         return <RegisterPage onNavigate={setAuthPage} onLogin={handleLogin} />;
    if (authPage === 'forgot-password')  return <ForgotPasswordPage onNavigate={setAuthPage} />;
  }

  const profileUser: ProfileUser = currentUser
    ? toProfileUser(currentUser)
    : { id: '', username: '…', email: '', avatarURL: null, isAdmin };

  const navUser = {
    username:  profileUser.username,
    avatarURL: profileUser.avatarURL ?? undefined,
    isAdmin:   isAdmin || profileUser.isAdmin,
  };

  // TODO: supprimer ces deux blocs quand le routing /shared/:token sera implémenté
  if (guestMemory) {
    return (
      <GuestPage
        memory={guestMemory}
        currentUser={{ username: navUser.username, avatarURL: navUser.avatarURL ?? null }}
        onBack={() => { setGuestMemory(null); setCurrentPage('today'); }}
        onNavigateToWelcome={() => { setGuestMemory(null); handleLogout(); }}
      />
    );
  }
  if (showGuestPreviewAnon) {
    return (
      <GuestPage
        memory={{ id: '', date: '', content: '', media: null, ownerName: '', friendContributions: [] }}
        onBack={() => setShowGuestPreviewAnon(false)}
        onNavigateToWelcome={() => { setShowGuestPreviewAnon(false); handleLogout(); }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-verylightorange pt-16 pb-20 md:pb-0">

      <Navbar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        user={navUser}
      />

      <main>
        {currentPage === 'today'    && <TodayPage />}
        {currentPage === 'timeline' && <TimelinePage onNavigateToToday={() => setCurrentPage('today')} onPreviewGuest={(mem) => setGuestMemory({ ...mem, ownerName: navUser.username })} />}
        {currentPage === 'memories' && <MemoriesPage />}
        {currentPage === 'tree'     && <TreePage />}
        {currentPage === 'profile'  && (
          <ProfilePage
            user={profileUser}
            onLogout={handleLogout}
            onNavigateToAdmin={() => setCurrentPage('admin')}
            onUserUpdate={handleUserUpdate}
          />
        )}
        {currentPage === 'admin' && (
          <AdminPage
            currentUserId={currentUser?.id ?? 'u1'}
            isAdmin={isAdmin}
            onToggleAdmin={() => setIsAdmin(v => !v)}
            onPreviewGuestAnon={() => setShowGuestPreviewAnon(true)}
          />
        )}
      </main>
    </div>
  );
};

export default App;
