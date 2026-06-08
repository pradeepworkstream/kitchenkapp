// src/pages/AdminLogin.jsx
import { useState } from "react";
import { toast } from "react-toastify";
import api from "../api/api.js";
import "./AdminLogin.css";

export default function AdminLogin({ onLoginSuccess }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) return toast.error("Email and password are required");

    setLoading(true);
    try {
      const res = await api.post("/api/auth/login", { email: trimmedEmail, password });
      if (!res.data?.success) throw new Error(res.data?.message || "Login failed");
      localStorage.setItem("admin_token", res.data.token);
      toast.success("Welcome back!");
      onLoginSuccess?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="al-wrap">
      <div className="al-card">

        {/* Header */}
        <div className="al-head">
          <div className="al-logo">🍴</div>
          <h1 className="al-brand">KitchenK</h1>
          <p className="al-tagline">Inventory & Vendor Management</p>
        </div>

        {/* Form */}
        <div className="al-body">
          <p className="al-form-title">Sign in to your account</p>

          <form className="al-form" onSubmit={submit}>
            <div className="al-field">
              <label className="al-label">Email</label>
              <input
                className="al-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                autoComplete="username"
                required
              />
            </div>

            <div className="al-field">
              <label className="al-label">Password</label>
              <div className="al-pass-row">
                <input
                  className="al-input"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button type="button" className="al-toggle-pass" onClick={() => setShowPass((p) => !p)}>
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button className="al-submit" disabled={loading} type="submit">
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <div className="al-footer">
          Secure login · KitchenK Admin Portal
        </div>

      </div>
    </div>
  );
}
