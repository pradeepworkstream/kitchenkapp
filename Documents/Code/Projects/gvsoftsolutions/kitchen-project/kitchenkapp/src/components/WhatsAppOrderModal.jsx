// src/components/WhatsAppOrderModal.jsx
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../api/api.js";
import { saveOrder } from "../utils/orderLog.js";
import "./WhatsAppOrderModal.css";

const LS_KEY = "wa_custom_number";

function buildMessage(vendor, items) {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
  const totalQty    = items.reduce((s, it) => s + (it.qty || 1), 0);
  const itemLines   = items.map((it) => `• ${it.name} - ${it.qty || 1} ${it.unit || "Box"}`).join("\n");

  return [
    "🛒 KitchenK Purchase Order",
    "",
    `Vendor: ${vendor || "N/A"}`,
    `Date: ${date}`,
    "",
    "Items:",
    "",
    itemLines,
    "",
    `Total Unique Items: ${items.length}`,
    `Total Quantity: ${totalQty}`,
    "",
    "Please confirm availability and pricing.",
    "",
    "Thank you,",
    "KitchenK",
  ].join("\n");
}

function stripPhone(raw) {
  return (raw || "").replace(/[^\d+]/g, "");
}

export default function WhatsAppOrderModal({ isOpen, onClose, vendor, cartItems = [] }) {
  const [loading,     setLoading]     = useState(false);
  const [vendorPhone, setVendorPhone] = useState("");
  const [customPhone, setCustomPhone] = useState(() => localStorage.getItem(LS_KEY) || "");
  const [customError, setCustomError] = useState("");

  const message = isOpen ? buildMessage(vendor, cartItems) : "";

  useEffect(() => {
    if (!isOpen || !vendor) { setVendorPhone(""); return; }
    setLoading(true);
    api.get("/api/vendors")
      .then((res) => {
        const list    = res.data?.data || [];
        const matched = list.find((v) => v.name === vendor);
        // Prefer dedicated whatsapp field, fall back to phone
        const raw = matched?.whatsapp || matched?.phone || "";
        setVendorPhone(stripPhone(raw));
      })
      .catch(() => setVendorPhone(""))
      .finally(() => setLoading(false));
  }, [isOpen, vendor]);

  if (!isOpen) return null;

  const openWA = (phone, sentTo) => {
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    saveOrder({ vendor, method: "whatsapp", sentTo: sentTo || phone, items: cartItems });
    onClose();
  };

  const handleVendorSend = () => {
    if (!vendorPhone) {
      toast.error(
        `No WhatsApp number saved for "${vendor}". Add one in Admin → Settings → Vendor Management.`,
        { autoClose: 6000 }
      );
      return;
    }
    openWA(vendorPhone, `${vendor} (${vendorPhone})`);
  };

  const handleCustomSend = () => {
    const phone = stripPhone(customPhone);
    if (!phone || phone.replace("+", "").length < 7) {
      setCustomError("Please enter a valid phone number.");
      return;
    }
    setCustomError("");
    localStorage.setItem(LS_KEY, customPhone);
    openWA(phone, customPhone);
  };

  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div className="wa-backdrop" onClick={handleBackdrop}>
      <div className="wa-modal">

        {/* Header */}
        <div className="wa-header">
          <div>
            <div className="wa-title">Send via WhatsApp</div>
            <div className="wa-subtitle">Review your order, then choose where to send it</div>
          </div>
          <button className="wa-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {/* Body */}
        <div className="wa-body">

          {/* Preview */}
          <div>
            <div className="wa-section-label">Purchase Order Preview</div>
            <pre className="wa-preview">{message}</pre>
          </div>

          {/* Option A: Vendor WhatsApp */}
          <div className="wa-option">
            <div className="wa-option-header">
              <span className="wa-option-badge wa-badge-a">Option A</span>
              <span className="wa-option-title">Send to Vendor WhatsApp</span>
            </div>

            {loading ? (
              <div className="wa-loading">Looking up vendor number…</div>
            ) : vendorPhone ? (
              <div className="wa-vendor-info">
                <span className="wa-vendor-name">{vendor}</span>
                <span className="wa-vendor-phone">
                  <span className="wa-phone-icon">📱</span>
                  {vendorPhone}
                </span>
              </div>
            ) : (
              <div className="wa-vendor-warn">
                No WhatsApp number saved for <strong>{vendor}</strong>.
                <br />
                <span className="wa-hint">Add one in Admin → Settings → Vendor Management.</span>
              </div>
            )}

            <button
              className="wa-send-btn wa-send-vendor"
              onClick={handleVendorSend}
              disabled={loading || !vendorPhone}
            >
              Send to Vendor →
            </button>
          </div>

          {/* Divider */}
          <div className="wa-divider"><span>or send to a custom number</span></div>

          {/* Option B: Custom */}
          <div className="wa-option">
            <div className="wa-option-header">
              <span className="wa-option-badge wa-badge-b">Option B</span>
              <span className="wa-option-title">Custom WhatsApp Number</span>
            </div>

            <input
              className={`wa-input${customError ? " wa-input--error" : ""}`}
              type="tel"
              value={customPhone}
              onChange={(e) => { setCustomPhone(e.target.value); setCustomError(""); }}
              placeholder="+1 (555) 000-0000"
            />
            {customError && <div className="wa-field-error">{customError}</div>}

            <button className="wa-send-btn wa-send-custom" onClick={handleCustomSend}>
              Send to Custom Number →
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="wa-footer">
          <button className="wa-cancel" onClick={onClose}>Cancel</button>
        </div>

      </div>
    </div>
  );
}
