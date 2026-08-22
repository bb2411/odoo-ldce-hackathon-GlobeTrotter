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
  resetUrl?: string;
}

// Replace the bodies of these functions with your API / Odoo backend calls.
// The signatures and return types are stable — UI code depends only on them.

export async function loginUser(credentials: LoginCredentials): Promise<AuthResult> {
  return authenticate("/auth/login", { email: credentials.email, password: credentials.password });
}

export async function signupUser(credentials: SignupCredentials): Promise<AuthResult> {
  return authenticate("/auth/register", { name: credentials.fullName, email: credentials.email, password: credentials.password });
}

export async function requestPasswordReset(email: string): Promise<AuthResult> {
  try {
    const base = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const response = await fetch(`${base}/auth/forgot-password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const data = await response.json();
    return { success: response.ok, message: data.message, resetUrl: data.resetUrl };
  } catch {
    return { success: false, message: "Unable to reach the GlobeTrotter server. Please try again." };
  }
}

async function authenticate(path: string, payload: object): Promise<AuthResult> {
  try {
    const base = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const response = await fetch(`${base}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok) return { success: false, message: data.message };
    localStorage.setItem("globetrotter_token", data.token);
    localStorage.setItem("globetrotter_user", JSON.stringify(data.user));
    return { success: true, user: data.user };
  } catch {
    return { success: false, message: "Unable to reach the GlobeTrotter server. Please start the backend and try again." };
  }
}
