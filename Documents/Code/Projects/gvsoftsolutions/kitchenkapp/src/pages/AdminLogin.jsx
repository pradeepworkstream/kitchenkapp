import { useState } from "react";
import { toast } from "react-toastify";
import "./AdminLogin.css";
import api from "../api/api.js";

export default function AdminLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password) return toast.error("Email & password required");

    setLoading(true);
    try {
      const res = await api.post("/api/auth/login", {
        email: email.trim(),
        password,
      });

      if (!res.data?.success) throw new Error(res.data?.message || "Login failed");

      localStorage.setItem("admin_token", res.data.token);
      toast.success("Login success");
      onLoginSuccess?.();
    } catch (err) {
      console.error(err);
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
            <h2>Admin Login</h2>
            <p>Login to manage inventory items.</p>
          </div>
        </div>

        <form className="alForm" onSubmit={submit}>
          <label>
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin email"
              autoComplete="username"
            />
          </label>

          <label>
            Password
            <div className="alPassRow">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="admin password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="alMini"
                onClick={() => setShowPass((p) => !p)}
                aria-label="Toggle password"
              >
                {showPass ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          <button className="alPrimary" disabled={loading} type="submit">
            {loading ? "Signing in…" : "Login"}
          </button>

          <div className="alHint">
            Token stored in <b>localStorage</b> as <code>admin_token</code>
          </div>
        </form>
      </div>
    </div>
  );
}