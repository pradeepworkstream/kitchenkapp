// src/utils/orderLog.js
// Persists sent purchase orders to localStorage for the Orders history page.

const KEY     = "kitchenk_order_log_v1";
const MAX_LOG = 100;

export function getOrderLog() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveOrder({ vendor, method, sentTo, items }) {
  try {
    const log   = getOrderLog();
    const entry = {
      id:         Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      date:       new Date().toISOString(),
      vendor:     vendor  || "Unknown",
      method:     method  || "whatsapp",
      sentTo:     sentTo  || "",
      items:      (items  || []).map((it) => ({
        name:  it.name     || "",
        qty:   it.qty      || 1,
        unit:  it.unit     || "",
      })),
      totalItems: (items || []).length,
      totalQty:   (items || []).reduce((s, it) => s + (it.qty || 1), 0),
    };

    log.unshift(entry);
    if (log.length > MAX_LOG) log.splice(MAX_LOG);
    localStorage.setItem(KEY, JSON.stringify(log));
    window.dispatchEvent(new Event("kitchenk_order_log_changed"));
    return entry;
  } catch (e) {
    console.error("orderLog: save failed", e);
    return null;
  }
}

export function clearOrderLog() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("kitchenk_order_log_changed"));
}
