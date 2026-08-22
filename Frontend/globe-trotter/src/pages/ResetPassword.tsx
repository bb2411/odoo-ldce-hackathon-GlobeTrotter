import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Compass, Lock } from "lucide-react";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const token = params.get("token");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return setMessage("This password-reset link is incomplete.");
    if (password.length < 8) return setMessage("Use at least 8 characters for your new password.");
    if (password !== confirmPassword) return setMessage("Passwords do not match.");
    setBusy(true); setMessage("");
    try {
      const base = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${base}/auth/reset-password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
      const data = await response.json();
      if (!response.ok) return setMessage(data.message || "Unable to update your password.");
      setMessage("Password updated. Redirecting you to sign in…");
      setTimeout(() => navigate("/login"), 1200);
    } catch { setMessage("Unable to reach the GlobeTrotter server. Please try again."); }
    finally { setBusy(false); }
  }

  return <main className="reset-page"><Link className="reset-brand" to="/login"><Compass /> Globe<span>Trotter</span></Link><form onSubmit={submit} className="reset-card"><div className="reset-icon"><Lock /></div><p className="eyebrow">Account recovery</p><h1>Create a new password</h1><p>Choose something secure that you’ll remember for the next adventure.</p>{message && <div className="reset-message">{message}</div>}<label>New password<input type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} /></label><label>Confirm new password<input type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} /></label><button className="button" disabled={busy}>{busy ? "Updating…" : "Update password"}</button><Link to="/login">Back to sign in</Link></form></main>;
}
