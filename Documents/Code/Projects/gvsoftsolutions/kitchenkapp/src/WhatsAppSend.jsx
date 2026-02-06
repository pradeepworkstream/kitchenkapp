import { useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "./WhatsAppSend.css";

const API_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5001").replace(/\/+$/, "");

const cleanPhone = (v) => String(v || "").replace(/[^\d]/g, ""); // digits only

export default function WhatsAppSend({ selectedItems = [] }) {
  const [toPhone, setToPhone] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  // Build a nice WhatsApp text message from selected items
  const messageText = useMemo(() => {
    if (!selectedItems?.length) return "";

    const lines = [];
    lines.push("KitchenK Store-room Inventory");
    lines.push("");

    let i = 1;
    for (const it of selectedItems) {
      const qty = `${it.qtyNumber || ""} ${it.unit || ""}`.trim();
      const brand = (it.selectedBrand || "").trim();
      lines.push(`${i}. ${it.name}${brand ? ` | ${brand}` : ""}${qty ? ` | ${qty}` : ""}`);
      i++;
    }

    if (note.trim()) {
      lines.push("");
      lines.push(`Note: ${note.trim()}`);
    }

    return lines.join("\n");
  }, [selectedItems, note]);

  const sendWhatsApp = async () => {
    const phone = cleanPhone(toPhone);

    if (!phone) return toast.error("Enter WhatsApp number (digits only with country code).");
    if (!selectedItems.length) return toast.error("Select at least one item.");
    if (!messageText.trim()) return toast.error("Message is empty.");

    setSending(true);
    try {
      const res = await axios.post(`${API_URL}/api/whatsapp/send-text`, {
        toPhone: phone,
        text: messageText,
      });

      if (!res.data?.success) throw new Error(res.data?.message || "WhatsApp failed");
      toast.success("WhatsApp message sent ✅");
      setToPhone("");
      setNote("");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || err.message || "WhatsApp send failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="waCard">
      <div className="waHead">
        <div>
          <h3>Send WhatsApp</h3>
          <p>Send selected inventory list to a WhatsApp number.</p>
        </div>

        <button className="waBtn" disabled={sending} onClick={sendWhatsApp}>
          {sending ? "Sending…" : "Send WhatsApp"}
        </button>
      </div>

      <div className="waGrid">
        <label>
          WhatsApp Number (with country code)
          <input
            value={toPhone}
            onChange={(e) => setToPhone(e.target.value)}
            placeholder="Example: 14165551234"
            inputMode="numeric"
          />
        </label>

        <label className="span2">
          Optional Note
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Any short note…" />
        </label>

        <label className="span2">
          Preview
          <textarea value={messageText} readOnly rows={8} />
        </label>
      </div>
    </div>
  );
}