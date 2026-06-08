// src/pages/VendorSettings.jsx
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import api from "../api/api.js";
import "./VendorSettings.css";

const EMPTY = { name: "", email: "", phone: "", whatsapp: "", logo: "" };

export default function VendorSettings() {
  const [vendors,    setVendors]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(null); // { mode: "add"|"edit", vendor? }
  const [form,       setForm]       = useState(EMPTY);
  const [saving,     setSaving]     = useState(false);
  const [confirmId,  setConfirmId]  = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [seeding,    setSeeding]    = useState(false);
  const logoInputRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/vendors");
      setVendors(res.data?.data || []);
    } catch {
      toast.error("Failed to load vendors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Modal helpers ─────────────────────────────────────────────────────────

  const openAdd = () => {
    setForm(EMPTY);
    setModal({ mode: "add" });
  };

  const openEdit = (v) => {
    setForm({ name: v.name, email: v.email || "", phone: v.phone || "", whatsapp: v.whatsapp || "", logo: v.logo || "" });
    setModal({ mode: "edit", vendor: v });
  };

  const closeModal = () => {
    if (saving) return;
    setModal(null);
    setForm(EMPTY);
  };

  const setField = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  // ── Logo file → base64 ────────────────────────────────────────────────────

  const handleLogoFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      toast.error("Logo must be JPG, PNG, WEBP, or GIF");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setForm((p) => ({ ...p, logo: ev.target.result }));
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("Vendor name is required");
    setSaving(true);
    try {
      if (modal.mode === "add") {
        const res = await api.post("/api/vendors", form);
        if (!res.data?.success) throw new Error(res.data?.message);
        toast.success(`"${form.name}" added`);
      } else {
        const res = await api.put(`/api/vendors/${modal.vendor._id}`, form);
        if (!res.data?.success) throw new Error(res.data?.message);
        toast.success(`"${form.name}" updated`);
      }
      await load();
      closeModal();
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async (v) => {
    setDeletingId(v._id);
    try {
      const res = await api.delete(`/api/vendors/${v._id}`);
      if (!res.data?.success) throw new Error(res.data?.message);
      toast.success(`"${v.name}" deleted`);
      setConfirmId(null);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || "Delete failed");
      setConfirmId(null);
    } finally {
      setDeletingId(null);
    }
  };

  // ── Seed ──────────────────────────────────────────────────────────────────

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await api.post("/api/vendors/seed");
      if (!res.data?.success) throw new Error(res.data?.message);
      const added = res.data.added ?? 0;
      toast.success(added > 0 ? `${added} default vendor(s) added` : "Default vendors already present");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || "Seed failed");
    } finally {
      setSeeding(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="vs-page">
      <div className="vs-card">

        {/* Header */}
        <div className="vs-header">
          <div>
            <h2 className="vs-title">Vendor Management</h2>
            <p className="vs-sub">
              Manage vendor profiles, emails, and phone numbers. All dropdowns and
              purchase orders pull from this list.
            </p>
          </div>
          <div className="vs-header-actions">
            <button className="vs-seed-btn" onClick={handleSeed} disabled={seeding}>
              {seeding ? "Loading…" : "Load Defaults"}
            </button>
            <button className="vs-add-btn" onClick={openAdd}>+ Add Vendor</button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="vs-loading">Loading vendors…</div>
        ) : vendors.length === 0 ? (
          <div className="vs-empty">
            <div className="vs-empty-icon">🏬</div>
            <p className="vs-empty-msg">No vendors yet.</p>
            <div className="vs-empty-actions">
              <button className="vs-add-btn" onClick={openAdd}>+ Add Vendor</button>
              <button className="vs-seed-btn" onClick={handleSeed} disabled={seeding}>
                {seeding ? "Loading…" : "Load Default Vendors"}
              </button>
            </div>
          </div>
        ) : (
          <div className="vs-table-wrap">
            <table className="vs-table">
              <thead>
                <tr>
                  <th className="vs-col-logo">Logo</th>
                  <th className="vs-col-name">Vendor Name</th>
                  <th className="vs-col-email">Email</th>
                  <th className="vs-col-phone">Phone</th>
                  <th className="vs-col-wa">WhatsApp</th>
                  <th className="vs-col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((v) => (
                  <tr key={v._id} className={confirmId === v._id ? "vs-tr-warn" : ""}>

                    {/* Logo */}
                    <td className="vs-td-logo">
                      {v.logo ? (
                        <img src={v.logo} alt={v.name} className="vs-logo-thumb" />
                      ) : (
                        <div className="vs-logo-empty">🏬</div>
                      )}
                    </td>

                    {/* Name */}
                    <td className="vs-td-name">{v.name}</td>

                    {/* Email */}
                    <td className="vs-td-email">
                      {v.email
                        ? <a href={`mailto:${v.email}`} className="vs-email-link">{v.email}</a>
                        : <span className="vs-dash">—</span>
                      }
                    </td>

                    {/* Phone */}
                    <td className="vs-td-phone">
                      {v.phone || <span className="vs-dash">—</span>}
                    </td>

                    {/* WhatsApp */}
                    <td className="vs-td-wa">
                      {v.whatsapp
                        ? <span className="vs-wa-num">📱 {v.whatsapp}</span>
                        : <span className="vs-dash">—</span>
                      }
                    </td>

                    {/* Actions */}
                    <td className="vs-td-actions">
                      {confirmId === v._id ? (
                        <div className="vs-confirm">
                          <span className="vs-confirm-msg">Delete "{v.name}"?</span>
                          <button
                            className="vs-btn-confirm-del"
                            onClick={() => handleDelete(v)}
                            disabled={deletingId === v._id}
                          >
                            {deletingId === v._id ? "Deleting…" : "Yes, Delete"}
                          </button>
                          <button className="vs-btn-cancel-del" onClick={() => setConfirmId(null)}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="vs-actions">
                          <button className="vs-btn-edit" onClick={() => openEdit(v)}>Edit</button>
                          <button className="vs-btn-del"  onClick={() => setConfirmId(v._id)}>Delete</button>
                        </div>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* ── Add / Edit Modal ────────────────────────────────────────────── */}
      {modal && (
        <div className="vs-backdrop" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="vs-modal">

            <div className="vs-modal-header">
              <h3 className="vs-modal-title">
                {modal.mode === "add" ? "Add Vendor" : `Edit — ${modal.vendor.name}`}
              </h3>
              <button className="vs-modal-close" onClick={closeModal}>×</button>
            </div>

            <div className="vs-modal-body">

              {/* Logo */}
              <div className="vs-mfield">
                <label className="vs-mlabel">Logo <span className="vs-opt">(optional)</span></label>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFile}
                  style={{ display: "none" }}
                />
                {form.logo ? (
                  <div className="vs-logo-preview">
                    <img src={form.logo} alt="logo preview" className="vs-logo-preview-img" />
                    <div className="vs-logo-preview-actions">
                      <button className="vs-logo-replace" onClick={() => logoInputRef.current?.click()}>
                        Replace
                      </button>
                      <button className="vs-logo-remove" onClick={() => setForm((p) => ({ ...p, logo: "" }))}>
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button className="vs-logo-upload-btn" onClick={() => logoInputRef.current?.click()}>
                    📷 Upload Logo
                  </button>
                )}
              </div>

              {/* Name */}
              <div className="vs-mfield">
                <label className="vs-mlabel">Vendor Name *</label>
                <input
                  className="vs-minput"
                  value={form.name}
                  onChange={setField("name")}
                  placeholder="e.g. Costco"
                  autoFocus
                />
              </div>

              {/* Email */}
              <div className="vs-mfield">
                <label className="vs-mlabel">Email <span className="vs-opt">(optional)</span></label>
                <input
                  className="vs-minput"
                  type="email"
                  value={form.email}
                  onChange={setField("email")}
                  placeholder="orders@vendor.com"
                />
                <p className="vs-mhint">Used as the To: address in purchase order emails.</p>
              </div>

              {/* Phone */}
              <div className="vs-mfield">
                <label className="vs-mlabel">Phone <span className="vs-opt">(optional)</span></label>
                <input
                  className="vs-minput"
                  type="tel"
                  value={form.phone}
                  onChange={setField("phone")}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              {/* WhatsApp Number */}
              <div className="vs-mfield">
                <label className="vs-mlabel">WhatsApp Number <span className="vs-opt">(optional)</span></label>
                <input
                  className="vs-minput"
                  type="tel"
                  value={form.whatsapp}
                  onChange={setField("whatsapp")}
                  placeholder="+1 (555) 000-0000"
                />
                <p className="vs-mhint">Used when sending purchase orders via WhatsApp. Leave blank to fall back to Phone.</p>
              </div>

            </div>

            <div className="vs-modal-footer">
              <button className="vs-modal-cancel" onClick={closeModal} disabled={saving}>
                Cancel
              </button>
              <button className="vs-modal-save" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : modal.mode === "add" ? "Add Vendor" : "Save Changes"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
