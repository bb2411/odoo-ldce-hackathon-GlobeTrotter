import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Sinup";
import ResetPassword from "./pages/ResetPassword";
import TravelApp from "./pages/TravelApp";
import { api, token } from "./Services/api";

function ProtectedApp() {
  const [state, setState] = useState("checking");
  useEffect(() => {
    if (!token()) return setState("guest");
    api("/auth/me").then(({ user }) => { localStorage.setItem("globetrotter_user", JSON.stringify(user)); setState("ready"); }).catch(() => { localStorage.removeItem("globetrotter_token"); localStorage.removeItem("globetrotter_user"); setState("guest"); });
  }, []);
  if (state === "checking") return <div className="app-loading">Preparing your travel studio…</div>;
  return state === "ready" ? <TravelApp /> : <Navigate to="/login" replace />;
}

export default function App() {
  return <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/app/*" element={<ProtectedApp />} />
    <Route path="/" element={<Navigate to={token() ? "/app/dashboard" : "/login"} replace />} />
    <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
  </Routes>;
}
