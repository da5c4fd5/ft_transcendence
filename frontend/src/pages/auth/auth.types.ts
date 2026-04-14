export type AuthPage = 'welcome' | 'login' | 'register' | 'forgot-password';

export interface WelcomePageProps {
  onNavigate: (page: AuthPage) => void;
}

export interface LoginPageProps {
  onNavigate: (page: AuthPage) => void;
  onLogin: () => void;
}

export interface RegisterPageProps {
  onNavigate: (page: AuthPage) => void;
  onLogin: () => void;
}

export interface ForgotPasswordPageProps {
  onNavigate: (page: AuthPage) => void;
}

export type ForgotStep = 'form' | 'check-email' | 'success';
