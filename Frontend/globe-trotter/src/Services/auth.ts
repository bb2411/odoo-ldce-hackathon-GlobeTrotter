export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface SignupCredentials {
  fullName: string;
  email: string;
  password: string;
}

export interface AuthUser {
  name: string;
  email: string;
}

export interface AuthResult {
  success: boolean;
  message?: string;
  user?: AuthUser;
}

// Replace the bodies of these functions with your API / Odoo backend calls.
// The signatures and return types are stable — UI code depends only on them.

export async function loginUser(credentials: LoginCredentials): Promise<AuthResult> {
  await delay(1100);
  // Example: const res = await fetch('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials), headers: { 'Content-Type': 'application/json' } });
  // const data = await res.json();
  // return { success: res.ok, user: data.user, message: data.message };
  return { success: true, user: { name: "Traveler", email: credentials.email } };
}

export async function signupUser(credentials: SignupCredentials): Promise<AuthResult> {
  await delay(1100);
  // Example: const res = await fetch('/api/auth/signup', { method: 'POST', body: JSON.stringify(credentials), headers: { 'Content-Type': 'application/json' } });
  // const data = await res.json();
  // return { success: res.ok, user: data.user, message: data.message };
  return { success: true, user: { name: credentials.fullName, email: credentials.email } };
}

export async function requestPasswordReset(email: string): Promise<AuthResult> {
  await delay(900);
  // Example: const res = await fetch('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
  return { success: true, message: "If an account exists, a reset link has been sent." };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
