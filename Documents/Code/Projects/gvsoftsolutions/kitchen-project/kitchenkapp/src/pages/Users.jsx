// src/pages/Users.jsx
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../api/api.js";
import "./Users.css";

const EMPTY_FORM = { fullName: "", email: "", password: "", role: "user" };

export default function Users() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [form,    setForm]    = useState(EMPTY_FORM);

  const setField = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

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
      toast.error(err?.response?.data?.message || err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const onCreateUser = async () => {
    if (!form.email || !form.password) return toast.error("Email and password are required");
    setSaving(true);
    try {
      const res = await api.post("/api/auth/register", {
        email:    form.email,
        password: form.password,
        fullName: form.fullName,
        role:     form.role,
      });
      if (!res.data?.success) throw new Error(res.data?.message || "Create failed");
      toast.success("User created successfully");
      setForm(EMPTY_FORM);
      await fetchUsers();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  const onDeleteUser = async (id) => {
    if (!window.confirm("Delete this user? This cannot be undone.")) return;
    try {
      const res = await api.delete(`/api/auth/users/${id}`);
      if (!res.data?.success) throw new Error(res.data?.message || "Delete failed");
      toast.success("User deleted");
      await fetchUsers();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Failed to delete user");
    }
  };

  return (
    <div className="usr-page">
      <div className="usr-inner">

        {/* Header */}
        <div className="usr-head">
          <h1 className="usr-title">Users</h1>
          <p className="usr-sub">Create and manage application users and admin accounts.</p>
        </div>

        {/* Create user form */}
        <div className="usr-create-card">
          <h2 className="usr-card-title">Create New User</h2>
          <div className="usr-form-grid">
            <div className="usr-field">
              <label className="usr-label">Full Name <span style={{ color: "#94a3b8", fontWeight: 400, textTransform: "none" }}>(optional)</span></label>
              <input
                className="usr-input"
                value={form.fullName}
                onChange={setField("fullName")}
                placeholder="Jane Doe"
              />
            </div>
            <div className="usr-field">
              <label className="usr-label">Email *</label>
              <input
                className="usr-input"
                type="email"
                value={form.email}
                onChange={setField("email")}
                placeholder="user@example.com"
              />
            </div>
            <div className="usr-field">
              <label className="usr-label">Password *</label>
              <input
                className="usr-input"
                type="password"
                value={form.password}
                onChange={setField("password")}
                placeholder="Minimum 8 characters"
              />
            </div>
            <div className="usr-field">
              <label className="usr-label">Role</label>
              <select className="usr-select" value={form.role} onChange={setField("role")}>
                <option value="user">User (Staff)</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
            <button
              className="usr-btn-create"
              style={{ width: "auto", minWidth: 160 }}
              onClick={onCreateUser}
              disabled={saving}
            >
              {saving ? "Creating…" : "+ Create User"}
            </button>
          </div>
        </div>

        {/* Users table */}
        <div className="usr-table-card">
          <div className="usr-table-head">
            <span className="usr-table-title">All Users</span>
            <span className="usr-count">{users.length} user{users.length !== 1 ? "s" : ""}</span>
          </div>

          <div className="usr-table-wrap">
            <table className="usr-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Active</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="usr-td-loading">Loading users…</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={6} className="usr-td-empty">No users found. Create one above.</td></tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id}>
                      <td className="usr-td-name">{user.fullName || <span className="usr-dash">—</span>}</td>
                      <td className="usr-td-email">{user.email}</td>
                      <td>
                        <span className={`usr-role ${user.role === "admin" ? "usr-role--admin" : "usr-role--user"}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className={`usr-active ${user.isActive !== false ? "usr-active--yes" : "usr-active--no"}`}>
                          {user.isActive !== false ? "✓ Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="usr-td-date">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                          : <span className="usr-dash">—</span>
                        }
                      </td>
                      <td>
                        <button className="usr-btn-del" onClick={() => onDeleteUser(user._id)}>
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

      </div>
    </div>
  );
}
