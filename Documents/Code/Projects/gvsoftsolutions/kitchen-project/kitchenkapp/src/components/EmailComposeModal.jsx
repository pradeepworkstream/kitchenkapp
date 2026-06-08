// src/components/EmailComposeModal.jsx
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import api from "../api/api.js";
import "./EmailComposeModal.css";

function esc(val) {
  return String(val ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildSubject(vendor) {
  return vendor ? `KitchenK Purchase Order - ${vendor}` : "KitchenK Purchase Order";
}

function buildHtmlEmail(vendor, items) {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const safeItems = items || [];
  const uniqueItems = safeItems.length;
  const totalQty = safeItems.reduce((sum, it) => sum + (Number(it.qty) || 1), 0);

  const rows = safeItems.map((item, i) => {
    const bg = i % 2 === 0 ? "#ffffff" : "#f8fafc";
    const qty  = item.qty  ?? 1;
    const unit = item.unit || "Box";
    return `
      <tr bgcolor="${bg}" style="background-color:${bg};">
        <td style="padding:11px 14px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0f172a;border-bottom:1px solid #e5e7eb;">${esc(item.name)}</td>
        <td style="padding:11px 14px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0f172a;font-weight:bold;border-bottom:1px solid #e5e7eb;">${esc(qty)}</td>
        <td style="padding:11px 14px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#64748b;border-bottom:1px solid #e5e7eb;">${esc(unit)}</td>
      </tr>`;
  }).join("");

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>KitchenK Purchase Order</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;">
    <tr>
      <td align="center" style="padding:24px 16px;">

        <!-- ── Main card ─────────────────────────────────────────────── -->
        <table width="600" cellpadding="0" cellspacing="0" border="0"
               style="max-width:600px;width:100%;background-color:#ffffff;">

          <!-- HEADER -->
          <tr>
            <td bgcolor="#0b1220" align="center"
                style="padding:30px 36px;background-color:#0b1220;text-align:center;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:26px;
                         font-weight:bold;color:#ffffff;letter-spacing:4px;">KITCHENK</p>
              <p style="margin:6px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;
                         color:#94a3b8;letter-spacing:4px;text-transform:uppercase;">PURCHASE ORDER</p>
            </td>
          </tr>

          <!-- GREETING -->
          <tr>
            <td style="padding:28px 36px 0;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;
                         color:#374151;line-height:1.7;">Hello,</p>
              <p style="margin:10px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;
                         color:#374151;line-height:1.7;">Please find our purchase order below.</p>
            </td>
          </tr>

          <!-- ORDER META -->
          <tr>
            <td style="padding:20px 36px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                     bgcolor="#f8fafc"
                     style="background-color:#f8fafc;border:1px solid #e5e7eb;border-collapse:collapse;">
                <tr>
                  <td style="padding:12px 18px;border-bottom:1px solid #e5e7eb;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#64748b;">Vendor</td>
                        <td align="right"
                            style="font-family:Arial,Helvetica,sans-serif;font-size:13px;
                                   color:#0f172a;font-weight:bold;text-align:right;">${esc(vendor || "N/A")}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 18px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#64748b;">Date</td>
                        <td align="right"
                            style="font-family:Arial,Helvetica,sans-serif;font-size:13px;
                                   color:#0f172a;text-align:right;">${esc(date)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ITEMS LABEL -->
          <tr>
            <td style="padding:24px 36px 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;
                        font-weight:bold;color:#0f172a;text-transform:uppercase;letter-spacing:1px;">
              Items Requested
            </td>
          </tr>

          <!-- ITEMS TABLE -->
          <tr>
            <td style="padding:0 36px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="border-collapse:collapse;border:1px solid #e5e7eb;">
                <thead>
                  <tr bgcolor="#0b1220" style="background-color:#0b1220;">
                    <th align="left"
                        style="padding:11px 14px;font-family:Arial,Helvetica,sans-serif;font-size:11px;
                               font-weight:bold;color:#ffffff;text-transform:uppercase;letter-spacing:1px;">
                      Product
                    </th>
                    <th width="80" align="center"
                        style="padding:11px 14px;font-family:Arial,Helvetica,sans-serif;font-size:11px;
                               font-weight:bold;color:#ffffff;text-transform:uppercase;letter-spacing:1px;
                               text-align:center;">
                      Qty
                    </th>
                    <th width="80" align="center"
                        style="padding:11px 14px;font-family:Arial,Helvetica,sans-serif;font-size:11px;
                               font-weight:bold;color:#ffffff;text-transform:uppercase;letter-spacing:1px;
                               text-align:center;">
                      Unit
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${rows}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- TOTALS -->
          <tr>
            <td style="padding:12px 36px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                     bgcolor="#f0fdf4"
                     style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-collapse:collapse;">
                <tr>
                  <td style="padding:10px 18px;border-bottom:1px solid #bbf7d0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#065f46;">
                          Total Unique Items
                        </td>
                        <td align="right"
                            style="font-family:Arial,Helvetica,sans-serif;font-size:13px;
                                   color:#065f46;font-weight:bold;text-align:right;">${uniqueItems}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 18px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#065f46;">
                          Total Quantity
                        </td>
                        <td align="right"
                            style="font-family:Arial,Helvetica,sans-serif;font-size:13px;
                                   color:#065f46;font-weight:bold;text-align:right;">${totalQty}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- DIVIDER + NOTE -->
          <tr>
            <td style="padding:24px 36px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-top:2px solid #e5e7eb;padding-top:20px;
                              font-family:Arial,Helvetica,sans-serif;font-size:14px;
                              color:#374151;line-height:1.7;">
                    Please confirm availability and pricing.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- SIGNATURE -->
          <tr>
            <td style="padding:16px 36px 0;font-family:Arial,Helvetica,sans-serif;
                        font-size:14px;color:#374151;line-height:2.0;">
              Thank you,<br />
              <strong style="color:#0f172a;">KitchenK</strong><br />
              <a href="mailto:kitchenkancham@gmail.com"
                 style="color:#2563eb;text-decoration:none;font-size:13px;">
                kitchenkancham@gmail.com
              </a>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td bgcolor="#f8fafc" align="center"
                style="padding:24px 36px;background-color:#f8fafc;border-top:1px solid #e5e7eb;
                        text-align:center;font-family:Arial,Helvetica,sans-serif;
                        font-size:12px;color:#94a3b8;">
              This is an automated purchase order from KitchenK.
            </td>
          </tr>

        </table>
        <!-- ── /Main card ─────────────────────────────────────────────── -->

      </td>
    </tr>
  </table>

</body>
</html>`;
}

export default function EmailComposeModal({ isOpen, onClose, vendor, cartItems = [] }) {
  const [toEmail, setToEmail] = useState("");
  const [ccEmail, setCcEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [noEmail, setNoEmail] = useState(false);

  const htmlBody = useMemo(
    () => buildHtmlEmail(vendor, cartItems),
    [vendor, cartItems], // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    if (!isOpen) return;
    setSubject(buildSubject(vendor));
    setCcEmail("");
    setSending(false);

    if (!vendor) { setToEmail(""); setNoEmail(false); return; }

    setLoading(true);
    api.get("/api/settings/vendors")
      .then((res) => {
        const list  = res.data?.data || [];
        const match = list.find((s) => s.vendor === vendor);
        const email = match?.email || "";
        setToEmail(email);
        setNoEmail(!email);
      })
      .catch(() => { setToEmail(""); setNoEmail(false); })
      .finally(() => setLoading(false));
  }, [isOpen, vendor]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  const handleSend = async () => {
    const to = toEmail.trim();
    if (!to)             { toast.error("Please enter a recipient email address."); return; }
    if (!subject.trim()) { toast.error("Subject is required.");                   return; }

    setSending(true);
    try {
      const res = await api.post("/api/email/send", {
        to,
        cc:      ccEmail.trim() || undefined,
        subject: subject.trim(),
        message: htmlBody,
      });
      if (!res.data?.success) throw new Error(res.data?.message || "Send failed");
      toast.success("Purchase order sent via email!");
      onClose();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Email send failed.", { autoClose: 6000 });
    } finally {
      setSending(false);
    }
  };

  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

  const autoSizeFrame = (e) => {
    try {
      const doc = e.target.contentDocument;
      e.target.style.height = doc.documentElement.scrollHeight + "px";
    } catch (_) { /* cross-origin — keep CSS height */ }
  };

  return (
    <div className="ecm-backdrop" onClick={handleBackdrop}>
      <div className="ecm-modal">

        {/* Header */}
        <div className="ecm-header">
          <div>
            <div className="ecm-title">Compose Email</div>
            <div className="ecm-subtitle">Review and send your purchase order</div>
          </div>
          <button className="ecm-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {/* No-email warning */}
        {noEmail && (
          <div className="ecm-warning">
            No email configured for <strong>{vendor}</strong>. Enter an address below
            or save one in <em>Admin → Settings</em>.
          </div>
        )}

        {/* Body */}
        <div className="ecm-body">
          {loading ? (
            <div className="ecm-loading">Loading vendor settings…</div>
          ) : (
            <>
              {/* To */}
              <div className="ecm-field">
                <label className="ecm-label">To *</label>
                <input
                  className="ecm-input"
                  type="email"
                  value={toEmail}
                  onChange={(e) => { setToEmail(e.target.value); setNoEmail(false); }}
                  placeholder="vendor@example.com"
                />
              </div>

              {/* CC */}
              <div className="ecm-field">
                <label className="ecm-label">CC <span className="ecm-optional">(optional)</span></label>
                <input
                  className="ecm-input"
                  type="email"
                  value={ccEmail}
                  onChange={(e) => setCcEmail(e.target.value)}
                  placeholder="cc@example.com"
                />
              </div>

              {/* Subject */}
              <div className="ecm-field">
                <label className="ecm-label">Subject *</label>
                <input
                  className="ecm-input"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              {/* Email Preview */}
              <div className="ecm-field">
                <label className="ecm-label">Email Preview</label>
                <div className="ecm-preview-wrap">
                  <iframe
                    className="ecm-preview-frame"
                    title="Email Preview"
                    srcDoc={htmlBody}
                    sandbox="allow-same-origin"
                    onLoad={autoSizeFrame}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="ecm-footer">
          <button className="ecm-btn-cancel" onClick={onClose} disabled={sending}>
            Cancel
          </button>
          <button
            className="ecm-btn-send"
            onClick={handleSend}
            disabled={sending || loading}
          >
            {sending ? "Sending…" : "Send Email"}
          </button>
        </div>

      </div>
    </div>
  );
}
