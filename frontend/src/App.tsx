/** @jsxImportSource preact */
import { useState } from 'preact/hooks';
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
import { GuestPage, MOCK_SHARED_MEMORY } from './pages/guest/GuestPage';

// TODO: Utilisateurs de test (à remplacer par les données de l'API plus tard)
const ADMIN_USER = { username: 'Alex Explorer', isAdmin: true };
const REGULAR_USER = { username: 'Sam Sparks', isAdmin: false };

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authPage, setAuthPage] = useState<AuthPage>('welcome');

  const [currentPage, setCurrentPage] = useState<Page>('today');
  const [isAdmin, setIsAdmin] = useState(true);
  // TODO: supprimer showGuestPreview et showGuestPreviewAnon quand le routing /shared/:token sera implémenté
  const [showGuestPreview, setShowGuestPreview] = useState(false);
  const [showGuestPreviewAnon, setShowGuestPreviewAnon] = useState(false);

  const user = isAdmin ? ADMIN_USER : REGULAR_USER;

  if (!isAuthenticated) {
    if (authPage === 'welcome') {
      return <WelcomePage onNavigate={setAuthPage} />;
    }
    if (authPage === 'login') {
      return <LoginPage onNavigate={setAuthPage} onLogin={() => setIsAuthenticated(true)} />;
    }
    if (authPage === 'register') {
      return <RegisterPage onNavigate={setAuthPage} onLogin={() => setIsAuthenticated(true)} />;
    }
    if (authPage === 'forgot-password') {
      return <ForgotPasswordPage onNavigate={setAuthPage} />;
    }
  }

  // TODO: supprimer ces deux blocs quand le routing /shared/:token sera implémenté
  if (showGuestPreview) {
    return (
      <GuestPage
        memory={MOCK_SHARED_MEMORY}
        currentUser={{ username: user.username, avatarURL: null }}
        onBack={() => { setShowGuestPreview(false); setCurrentPage('today'); }}
        onNavigateToWelcome={() => { setShowGuestPreview(false); setIsAuthenticated(false); setAuthPage('welcome'); }}
      />
    );
  }
  if (showGuestPreviewAnon) {
    return (
      <GuestPage
        memory={MOCK_SHARED_MEMORY}
        onBack={() => setShowGuestPreviewAnon(false)}
        onNavigateToWelcome={() => { setShowGuestPreviewAnon(false); setIsAuthenticated(false); setAuthPage('welcome'); }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-verylightorange pt-16 pb-20 md:pb-0">

      <Navbar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        user={user}
      />

      <main>
        {currentPage === 'today'    && <TodayPage />}
        {currentPage === 'timeline' && <TimelinePage onNavigateToToday={() => setCurrentPage('today')} onPreviewGuest={() => setShowGuestPreview(true)} />}
        {currentPage === 'memories' && <MemoriesPage />}
        {currentPage === 'tree'     && <TreePage />}
        {currentPage === 'profile'  && (
          <ProfilePage
            user={user}
            onLogout={() => { setIsAuthenticated(false); setAuthPage('welcome'); }}
            onNavigateToAdmin={() => setCurrentPage('admin')}
          />
        )}
        {currentPage === 'admin' && (
          <AdminPage
            currentUserId="u1"
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
