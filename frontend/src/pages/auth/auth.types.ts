export interface LoginPageProps {
  onLogin: (token?: string) => void;
}

export interface RegisterPageProps {
  onLogin: (token?: string) => void;
}

export type ForgotStep = 'form' | 'check-email' | 'success';
