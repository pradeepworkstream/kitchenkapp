import { Fragment, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "./EmailForm.css";

// ✅ Prefer env, fallback to production API
const API_URL = (import.meta.env.VITE_BACKEND_URL || "https://api.gogrocer.ca").replace(/\/+$/, "");

// ✅ Add your inbuilt emails here
const INBUILT_EMAILS = [
  "kitchenkadmin@gmail.com",
  "manager@kitchenk.com",
  "orders@kitchenk.com",
  "accounts@kitchenk.com",
  "store@kitchenk.com",
];

// ---------- helpers ----------
const normalizeEmail = (s) => String(s || "").trim().toLowerCase();
const splitEmails = (s) =>
  String(s || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

const joinEmails = (arr) => arr.filter(Boolean).join(", ");

function addEmailToField(currentValue, email) {
  const e = normalizeEmail(email);
  if (!e) return currentValue;

  const list = splitEmails(currentValue);
  const set = new Set(list.map(normalizeEmail));

  if (set.has(e)) return currentValue; // no duplicates
  return joinEmails([...list, email.trim()]);
}

const cleanPhone = (v) => String(v || "").replace(/[^\d]/g, ""); // digits only

export default function EmailForm() {
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
  const [note, setNote] = useState("");

  const [sending, setSending] = useState(false);

  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ chips target
  const [chipTarget, setChipTarget] = useState("to"); // "to" | "cc"

  // ✅ WhatsApp UI (only for phone + note)
  const [waPhone, setWaPhone] = useState("");
  const [waNote, setWaNote] = useState("");
  const [waSending, setWaSending] = useState(false);

  // ✅ Load inventory
  useEffect(() => {
    const loadInventory = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/api/inventory/list`);
        if (!res.data?.success) throw new Error(res.data?.message || "Failed");

        const normalized = (res.data.items || []).map((it) => ({
          ...it,
          // ✅ best key (Mongo _id)
          id: it._id || `${it.category || "cat"}-${it.name || "item"}`,
          selectedBrand: it.brandOptions?.[0] || "",
          qtyNumber: "",
        }));

        normalized.sort((a, b) =>
          a.category === b.category ? a.name.localeCompare(b.name) : a.category.localeCompare(b.category)
        );

        setItems(normalized);
      } catch (err) {
        console.error(err);
        toast.error("Error loading inventory.");
      } finally {
        setLoading(false);
      }
    };

    loadInventory();
  }, []);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const changeBrand = (id, brand) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, selectedBrand: brand } : it)));
  };

  const changeQtyNumber = (id, value) => {
    if (value !== "" && !/^\d+$/.test(value)) return;
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, qtyNumber: value } : it)));
  };

  const selectedItems = useMemo(() => items.filter((it) => selectedIds.includes(it.id)), [items, selectedIds]);
  const selectedCount = selectedIds.length;

  const handleChipClick = (email) => {
    if (chipTarget === "to") setTo((prev) => addEmailToField(prev, email));
    else setCc((prev) => addEmailToField(prev, email));
  };

  const validateSelected = () => {
    if (!selectedItems.length) return "Select at least one item.";
    const missingQty = selectedItems.find((it) => !String(it.qtyNumber || "").trim());
    if (missingQty) return "Enter Qty for all selected items.";
    return null;
  };

  // ✅ WhatsApp Preview text (only for UI)
  const waPreviewText = useMemo(() => {
    if (!selectedItems.length) return "";

    const sorted = [...selectedItems].sort((a, b) =>
      a.category === b.category ? a.name.localeCompare(b.name) : a.category.localeCompare(b.category)
    );

    const lines = [];
    lines.push("KitchenK Store-room Inventory");
    lines.push("");

    let lastCat = null;
    let i = 1;

    for (const it of sorted) {
      if ((it.category || "") !== lastCat) {
        lastCat = it.category || "";
        lines.push(`-- ${lastCat} --`);
      }
      const brand = (it.selectedBrand || "").trim();
      const qty = `${it.qtyNumber || ""} ${it.unit || ""}`.trim();
      lines.push(`${i}. ${it.name}${brand ? ` | ${brand}` : ""}${qty ? ` | ${qty}` : ""}`);
      i++;
    }

    if (waNote.trim()) {
      lines.push("");
      lines.push(`Note: ${waNote.trim()}`);
    }

    lines.push("");
    lines.push("PDF link will be generated when you click Share.");

    return lines.join("\n");
  }, [selectedItems, waNote]);

  // ✅ WhatsApp Share = Create PDF in backend + open wa.me with link
  const shareWhatsAppPdf = async () => {
    const phone = cleanPhone(waPhone);
    if (!phone) return toast.error("Enter WhatsApp number with country code (digits only).");

    const err = validateSelected();
    if (err) return toast.error(err);

    setWaSending(true);
    try {
      // Create PDF on backend
      const res = await axios.post(`${API_URL}/api/reports/inventory-pdf`, {
        items: selectedItems,
        note: waNote || note || "",
      });

      if (!res.data?.success) throw new Error(res.data?.message || "PDF failed");

      const downloadUrl = `${API_URL}${res.data.downloadUrl}`;

      const msg = `KitchenK Inventory PDF\n\nDownload link (one-time):\n${downloadUrl}`;
      const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;

      // open WhatsApp
      window.open(waUrl, "_blank");

      toast.success("WhatsApp opened with PDF link ✅");
      setWaPhone("");
      setWaNote("");
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || e.message || "WhatsApp share failed");
    } finally {
      setWaSending(false);
    }
  };

  const sendEmail = async () => {
    if (!to.trim()) return toast.error("Recipient email is required.");

    const err = validateSelected();
    if (err) return toast.error(err);

    const sorted = [...selectedItems].sort((a, b) =>
      a.category === b.category ? a.name.localeCompare(b.name) : a.category.localeCompare(b.category)
    );

    let lastCat = null;
    let count = 0;

    const rows = sorted
      .map((it) => {
        const catRow =
          it.category !== lastCat
            ? `
              <tr>
                <td colspan="4"
                    style="padding:10px 12px;border:1px solid #e5e7eb;background:#eef2ff;text-align:center;">
                  <span style="display:inline-block;padding:6px 14px;border-radius:999px;background:#2563eb;color:#fff;
                               font-weight:800;letter-spacing:.5px;text-transform:uppercase;font-size:12px;">
                    ${it.category || ""}
                  </span>
                </td>
              </tr>
            `
            : "";

        lastCat = it.category;
        count += 1;

        const itemRow = `
          <tr>
            <td style="padding:8px 10px;border:1px solid #e5e7eb;">${count}</td>
            <td style="padding:8px 10px;border:1px solid #e5e7eb;">${it.name || ""}</td>
            <td style="padding:8px 10px;border:1px solid #e5e7eb;">${it.selectedBrand || ""}</td>
            <td style="padding:8px 10px;border:1px solid #e5e7eb;">${it.qtyNumber || ""} ${it.unit || ""}</td>
          </tr>
        `;

        return catRow + itemRow;
      })
      .join("");

    const htmlMessage = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
        <p>Hi,</p>
        <p>Here is the selected store-room inventory list.</p>
        ${note ? `<p><strong>Note:</strong> ${note}</p>` : ""}

        <table style="border-collapse:collapse;border:1px solid #e5e7eb;font-size:14px;width:100%;">
          <thead>
            <tr style="background:#0b1220;color:#fff;">
              <th style="padding:10px;border:1px solid #e5e7eb;text-align:left;">#</th>
              <th style="padding:10px;border:1px solid #e5e7eb;text-align:left;">Product</th>
              <th style="padding:10px;border:1px solid #e5e7eb;text-align:left;">Brand</th>
              <th style="padding:10px;border:1px solid #e5e7eb;text-align:left;">Qty</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <p style="margin-top:16px;color:#6b7280;">– KitchenK Admin</p>
      </div>
    `;

    setSending(true);
    try {
      const res = await axios.post(`${API_URL}/send-email`, {
        to,
        cc,
        subject: subject || "KitchenK Store-room Inventory",
        message: htmlMessage,
      });

      if (res.data?.success) {
        toast.success("Email sent successfully!");
        setTo("");
        setCc("");
        setSubject("");
        setNote("");
        setSelectedIds([]);
        setItems((prev) => prev.map((it) => ({ ...it, qtyNumber: "" })));
      } else {
        toast.error(res.data?.message || "Failed to send email.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page">
      <div className="card">
        <div className="header">
          <div>
            <h2>Store-room Inventory</h2>
            <p className="sub">Select items → enter qty → Send Email or Share WhatsApp PDF link.</p>
          </div>

          <div className="topBtns">
            <button className="primary ghost" disabled={waSending} onClick={shareWhatsAppPdf}>
              {waSending ? "Generating…" : "Share WhatsApp (PDF Link)"}
            </button>

            <button className="primary" disabled={sending} onClick={sendEmail}>
              {sending ? "Sending…" : `Send Email (${selectedCount})`}
            </button>
          </div>
        </div>

        {/* ✅ Inbuilt emails chips */}
        <div className="chipsBar">
          <div className="chipsLeft">
            <span className="chipsLabel">Quick Emails:</span>
            <div className="chips">
              {INBUILT_EMAILS.map((email) => (
                <button
                  key={email}
                  type="button"
                  className="chip"
                  onClick={() => handleChipClick(email)}
                  title={`Add to ${chipTarget.toUpperCase()}`}
                >
                  {email}
                  <span className="chipPlus">+</span>
                </button>
              ))}
            </div>
          </div>

          <div className="chipsRight">
            <span className="chipsLabel">Add chips to:</span>
            <div className="seg">
              <button
                type="button"
                className={`segBtn ${chipTarget === "to" ? "active" : ""}`}
                onClick={() => setChipTarget("to")}
              >
                To
              </button>
              <button
                type="button"
                className={`segBtn ${chipTarget === "cc" ? "active" : ""}`}
                onClick={() => setChipTarget("cc")}
              >
                CC
              </button>
            </div>
          </div>
        </div>

        <div className="formGrid">
          <label>
            To
            <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Recipient email (comma separated)" />
          </label>

          <label>
            CC (optional)
            <input value={cc} onChange={(e) => setCc(e.target.value)} placeholder="CC email (comma separated)" />
          </label>

          <label className="span2">
            Subject
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
          </label>

          <label className="span2">
            Note (Email optional)
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Any extra note..." rows={3} />
          </label>

          {/* ✅ WhatsApp block (no API) */}
          <div className="span2 waBlock">
            <div className="waHead">
              <div>
                <h3>WhatsApp</h3>
                <p>Enter number → click “Share WhatsApp (PDF Link)”</p>
              </div>
            </div>

            <div className="waGrid">
              <label>
                WhatsApp Number (country code + number)
                <input
                  value={waPhone}
                  onChange={(e) => setWaPhone(e.target.value)}
                  placeholder="Example: 14165551234"
                  inputMode="numeric"
                />
              </label>

              <label>
                WhatsApp Note (optional)
                <input value={waNote} onChange={(e) => setWaNote(e.target.value)} placeholder="Short note…" />
              </label>

              <label className="waSpan2">
                Preview
                <textarea value={waPreviewText} readOnly rows={7} />
              </label>
            </div>
          </div>
        </div>

        <div className="tableWrap fixedTable">
          {loading ? (
            <div className="status">Loading inventory…</div>
          ) : items.length === 0 ? (
            <div className="status">No items found.</div>
          ) : (
            <div className="tableViewport">
              <table className="table">
                <thead>
                  <tr>
                    <th className="checkCol"></th>
                    <th>Product</th>
                    <th>Brand</th>
                    <th>Qty</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((it, index) => {
                    const prevCategory = index > 0 ? items[index - 1].category : null;
                    const showCategory = it.category !== prevCategory;

                    return (
                      <Fragment key={it.id}>
                        {showCategory && (
                          <tr className="catRow">
                            <td colSpan={4}>
                              <span className="catPill">{it.category}</span>
                            </td>
                          </tr>
                        )}

                        <tr className={selectedIds.includes(it.id) ? "rowSelected" : ""}>
                          <td className="checkCol">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(it.id)}
                              onChange={() => toggleSelect(it.id)}
                            />
                          </td>

                          <td className="product">{it.name}</td>

                          <td>
                            <select value={it.selectedBrand} onChange={(e) => changeBrand(it.id, e.target.value)}>
                              {(it.brandOptions || ["-"]).map((b) => (
                                <option key={b} value={b}>
                                  {b}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td>
                            <div className="qtyWrap">
                              <input
                                className="qtyInput"
                                type="text"
                                inputMode="numeric"
                                placeholder="0"
                                value={it.qtyNumber}
                                onChange={(e) => changeQtyNumber(it.id, e.target.value)}
                              />
                              <span className="qtyUnit">{it.unit || ""}</span>
                            </div>
                          </td>
                        </tr>
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="footer">
          <div className="hint">Tip: WhatsApp share generates a one-time PDF link.</div>
        </div>
      </div>
    </div>
  );
}