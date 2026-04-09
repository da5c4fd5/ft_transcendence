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
import { GuestPage, MOCK_SHARED_MEMORY } from './pages/guest/GuestPage';

// ---------------------------------------------------------------------------
// Utilisateurs de test (à remplacer par les données de l'API plus tard)
// ---------------------------------------------------------------------------
const ADMIN_USER = { name: 'Alex Explorer', isAdmin: true };
const REGULAR_USER = { name: 'Sam Sparks', isAdmin: false };

// ---------------------------------------------------------------------------
// App — routeur racine
// ---------------------------------------------------------------------------
// Architecture simple sans librairie de routing :
//   - Si non connecté → pages auth (pas de Navbar)
//   - Si connecté    → app principale avec Navbar
//
// Le state "authPage" contrôle quelle page auth est affichée.
// Le state "isAuthenticated" bascule entre auth et app.
// ---------------------------------------------------------------------------
const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authPage, setAuthPage] = useState<AuthPage>('welcome');

  const [currentPage, setCurrentPage] = useState<Page>('today');
  const [isAdmin, setIsAdmin] = useState(true);
  // TODO: supprimer showGuestPreview et showGuestPreviewAnon quand le routing /shared/:token sera implémenté
  const [showGuestPreview, setShowGuestPreview] = useState(false);
  const [showGuestPreviewAnon, setShowGuestPreviewAnon] = useState(false);

  const user = isAdmin ? ADMIN_USER : REGULAR_USER;

  // --- Flux non authentifié ---
  if (!isAuthenticated) {
    // Rendu conditionnel simple : chaque page auth est un composant indépendant.
    // onNavigate : pour changer de page auth (ex: login → forgot-password)
    // onLogin    : appelé quand l'auth réussit, bascule vers l'app
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
        currentUser={{ name: user.name, avatar: null }}
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

  // --- Flux authentifié ---
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
        {currentPage !== 'today' && currentPage !== 'timeline' && (
          <div className="p-6 flex flex-col gap-4 max-w-lg mx-auto">
            <h1 className="text-2xl font-bold text-darkgrey">Page : {currentPage}</h1>
            <button
              onClick={() => setIsAdmin((v) => !v)}
              className="px-4 py-2 bg-yellow rounded-full text-darkgrey font-semibold text-sm w-fit"
            >
              Switcher le rôle ({isAdmin ? 'passer en User' : 'passer en Admin'})
            </button>
            {/* TODO: supprimer ce bouton quand le routing /shared/:token sera implémenté */}
            <button
              onClick={() => setShowGuestPreviewAnon(true)}
              className="px-4 py-2 bg-blue rounded-full text-darkgrey font-semibold text-sm w-fit"
            >
              Preview vue invité (non connecté)
            </button>
            <button
              onClick={() => { setIsAuthenticated(false); setAuthPage('welcome'); }}
              className="px-4 py-2 bg-lightpink rounded-full text-pink font-semibold text-sm w-fit"
            >
              Se déconnecter
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
