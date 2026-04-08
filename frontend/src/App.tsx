import { useState } from 'preact/hooks';
import { Navbar } from './components/Navbar/Navbar';
import type { Page } from './components/Navbar/Navbar.types';
import type { AuthPage } from './pages/auth/auth.types';
import { WelcomePage } from './pages/auth/WelcomePage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { TodayPage } from './pages/today/TodayPage';

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

  // --- Flux authentifié ---
  return (
    <div className="min-h-screen bg-verylightorange pt-16 pb-20 md:pb-0">

      <Navbar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        user={user}
      />

      <main>
        {currentPage === 'today' && <TodayPage />}
        {currentPage !== 'today' && (
          <div className="p-6 flex flex-col gap-4 max-w-lg mx-auto">
            <h1 className="text-2xl font-bold text-darkgrey">Page : {currentPage}</h1>
            <button
              onClick={() => setIsAdmin((v) => !v)}
              className="px-4 py-2 bg-yellow rounded-full text-darkgrey font-semibold text-sm w-fit"
            >
              Switcher le rôle ({isAdmin ? 'passer en User' : 'passer en Admin'})
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
