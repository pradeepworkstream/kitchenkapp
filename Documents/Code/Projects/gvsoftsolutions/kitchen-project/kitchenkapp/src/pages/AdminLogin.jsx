// src/pages/AdminLogin.jsx
import { useState } from "react";
import { toast } from "react-toastify";
import "./AdminLogin.css";
import api from "../api/api.js";

export default function AdminLogin({ onLoginSuccess }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) return toast.error("Email & password required");

    setLoading(true);
    try {
      const res = await api.post("/api/auth/login", { email: trimmedEmail, password });
      if (!res.data?.success) throw new Error(res.data?.message || "Login failed");

      localStorage.setItem("admin_token", res.data.token);
      toast.success("Login successful");
      onLoginSuccess?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="alWrap">
      <div className="alCard">
        <div className="alHead">
          <div>
            <h2>KitchenK Admin</h2>
            <p>Sign in to manage inventory.</p>
          </div>
        </div>

        <form className="alForm" onSubmit={submit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              autoComplete="username"
              required
            />
          </label>

          <label>
            Password
            <div className="alPassRow">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <button type="button" className="alMini" onClick={() => setShowPass((p) => !p)}>
                {showPass ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          <button className="alPrimary" disabled={loading} type="submit">
            {loading ? "Signing in…" : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
