// src/components/WhatsAppSend.jsx
import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import api from "../api/api.js";
import "./WhatsAppSend.css";

const cleanPhone = (v) => String(v || "").replace(/\D/g, "");

export default function WhatsAppSend({ selectedItems = [] }) {
  const [toPhone, setToPhone] = useState("");
  const [note,    setNote]    = useState("");
  const [sending, setSending] = useState(false);

  const messageText = useMemo(() => {
    if (!selectedItems.length) return "";

    const lines = ["KitchenK Store-room Inventory", ""];
    selectedItems.forEach((it, i) => {
      const qty   = `${it.qtyNumber || ""} ${it.unit || ""}`.trim();
      const brand = (it.selectedBrand || "").trim();
      lines.push(
        `${i + 1}. ${it.name}${brand ? ` | ${brand}` : ""}${qty ? ` | ${qty}` : ""}`
      );
    });

    if (note.trim()) {
      lines.push("", `Note: ${note.trim()}`);
    }
    return lines.join("\n");
  }, [selectedItems, note]);

  const sendWhatsApp = async () => {
    const phone = cleanPhone(toPhone);
    if (!phone)               return toast.error("Enter a WhatsApp number with country code.");
    if (!selectedItems.length) return toast.error("Select at least one item.");
    if (!messageText.trim())  return toast.error("Message is empty.");

    setSending(true);
    try {
      const res = await api.post("/api/whatsapp/send-text", { toPhone: phone, text: messageText });
      if (!res.data?.success) throw new Error(res.data?.message || "WhatsApp failed");
      toast.success("WhatsApp message sent ✅");
      setToPhone("");
      setNote("");
    } catch (err) {
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
            placeholder="e.g. 14165551234"
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
