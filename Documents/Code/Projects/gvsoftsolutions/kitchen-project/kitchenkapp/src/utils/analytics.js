import api from "../api/api.js";

export const sendEvent = async (event, data = {}) => {
  try {
    const payload = { event, ...data };
    // Fire-and-forget
    api.post('/api/analytics/event', payload).catch(() => {});
  } catch {
    // ignore
  }
};

export const assignVariant = () => {
  const key = 'kk_ab_shop_variant';
  let v = localStorage.getItem(key);
  if (!v) {
    // simple 50/50 split
    v = Math.random() < 0.5 ? 'vendor-first' : 'control';
    localStorage.setItem(key, v);
  }
  return v;
};
