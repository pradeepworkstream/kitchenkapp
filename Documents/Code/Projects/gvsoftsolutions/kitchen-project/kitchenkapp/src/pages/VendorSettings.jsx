// src/pages/VendorSettings.jsx
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../api/api.js";
import "./VendorSettings.css";

const VENDORS = ["Costco", "Mid East Market", "Spice Bazaar"];

const VENDOR_ICONS = {
  "Costco":           "🏪",
  "Mid East Market":  "🥙",
  "Spice Bazaar":     "🌶",
};

export default function VendorSettings() {
  const [settings, setSettings] = useState(
    VENDORS.map((v) => ({ vendor: v, email: "", saving: false }))
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/settings/vendors")
      .then((res) => {
        const data = res.data?.data || [];
        setSettings(
          VENDORS.map((v) => {
            const match = data.find((d) => d.vendor === v);
            return { vendor: v, email: match?.email || "", saving: false };
          })
        );
      })
      .catch(() => toast.error("Failed to load vendor settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (vendor, email) => {
    setSettings((prev) =>
      prev.map((s) => s.vendor === vendor ? { ...s, email } : s)
    );
  };

  const handleSave = async (vendor) => {
    const entry = settings.find((s) => s.vendor === vendor);
    if (!entry) return;

    setSettings((prev) =>
      prev.map((s) => s.vendor === vendor ? { ...s, saving: true } : s)
    );

    try {
      const res = await api.put(`/api/settings/vendors/${encodeURIComponent(vendor)}`, {
        email: entry.email.trim(),
      });
      if (!res.data?.success) throw new Error(res.data?.message || "Save failed");
      toast.success(`${vendor} email saved`);
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || "Save failed");
    } finally {
      setSettings((prev) =>
        prev.map((s) => s.vendor === vendor ? { ...s, saving: false } : s)
      );
    }
  };

  return (
    <div className="vs-page">
      <div className="vs-card">

        <div className="vs-header">
          <div>
            <h2 className="vs-title">Vendor Settings</h2>
            <p className="vs-sub">
              Configure the email address for each vendor. This address will be
              pre-filled when composing a purchase order email.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="vs-loading">Loading settings…</div>
        ) : (
          <div className="vs-list">
            {settings.map(({ vendor, email, saving }) => (
              <div key={vendor} className="vs-row">
                <div className="vs-row-left">
                  <span className="vs-icon">{VENDOR_ICONS[vendor] || "🏬"}</span>
                  <div>
                    <div className="vs-vendor-name">{vendor}</div>
                    <div className="vs-vendor-hint">Purchase order email recipient</div>
                  </div>
                </div>

                <div className="vs-row-right">
                  <input
                    className="vs-input"
                    type="email"
                    value={email}
                    onChange={(e) => handleChange(vendor, e.target.value)}
                    placeholder={`orders@${vendor.toLowerCase().replace(/\s+/g, "")}.com`}
                  />
                  <button
                    className="vs-save-btn"
                    onClick={() => handleSave(vendor)}
                    disabled={saving}
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="vs-info">
          <div className="vs-info-icon">ℹ</div>
          <p>
            To enable email sending, configure <code>SMTP_HOST</code>, <code>SMTP_USER</code>,{" "}
            <code>SMTP_PASS</code>, and <code>SMTP_FROM</code> in your server <code>.env</code> file.
          </p>
        </div>

      </div>
    </div>
  );
}
