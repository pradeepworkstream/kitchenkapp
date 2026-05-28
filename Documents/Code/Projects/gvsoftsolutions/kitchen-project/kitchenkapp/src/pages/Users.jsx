import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../api/api.js";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "user",
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/auth/users");
      if (res.data?.success) {
        setUsers(res.data.data || []);
      } else {
        throw new Error(res.data?.message || "Unable to load users");
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onCreateUser = async () => {
    if (!form.email || !form.password) {
      return toast.error("Email and password are required");
    }

    setSaving(true);
    try {
      const res = await api.post("/api/auth/register", {
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        role: form.role,
      });
      if (!res.data?.success) throw new Error(res.data?.message || "Create failed");
      toast.success("User created successfully");
      setForm({ fullName: "", email: "", password: "", role: "user" });
      await fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || err.message || "Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  const onDeleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      const res = await api.delete(`/api/auth/users/${id}`);
      if (!res.data?.success) throw new Error(res.data?.message || "Delete failed");
      toast.success("User deleted");
      await fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || err.message || "Failed to delete user");
    }
  };

  return (
    <div style={{ padding: "24px 26px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Users</h2>
        <p style={{ margin: "8px 0 0", color: "#6b7280" }}>
          Create and manage application users and admin accounts.
        </p>
      </div>

      <div style={{ display: "grid", gap: 16, marginBottom: 28, gridTemplateColumns: "1fr 1fr 1fr" }}>
        <div>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 700 }}>Full Name</label>
          <input
            value={form.fullName}
            onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
            placeholder="Optional full name"
            style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #d1d5db" }}
          />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 700 }}>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="user@example.com"
            style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #d1d5db" }}
          />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 700 }}>Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            placeholder="Enter a secure password"
            style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #d1d5db" }}
          />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginBottom: 32 }}>
        <div style={{ minWidth: 220 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 700 }}>Role</label>
          <select
            value={form.role}
            onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
            style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #d1d5db" }}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button
          onClick={onCreateUser}
          disabled={saving}
          style={{
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "12px 20px",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          {saving ? "Creating…" : "Create User"}
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 740 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>
              <th style={{ padding: "12px 12px 10px" }}>Name</th>
              <th style={{ padding: "12px 12px 10px" }}>Email</th>
              <th style={{ padding: "12px 12px 10px" }}>Role</th>
              <th style={{ padding: "12px 12px 10px" }}>Active</th>
              <th style={{ padding: "12px 12px 10px" }}>Created</th>
              <th style={{ padding: "12px 12px 10px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: 20, color: "#6b7280" }}>
                  Loading users…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 20, color: "#6b7280" }}>
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user._id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "14px 12px" }}>{user.fullName || "—"}</td>
                  <td style={{ padding: "14px 12px" }}>{user.email}</td>
                  <td style={{ padding: "14px 12px" }}>{user.role}</td>
                  <td style={{ padding: "14px 12px" }}>{user.isActive ? "Yes" : "No"}</td>
                  <td style={{ padding: "14px 12px" }}>{new Date(user.createdAt).toLocaleString()}</td>
                  <td style={{ padding: "14px 12px" }}>
                    <button
                      onClick={() => onDeleteUser(user._id)}
                      style={{
                        background: "#ef4444",
                        color: "#fff",
                        border: "none",
                        borderRadius: 10,
                        padding: "8px 14px",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
