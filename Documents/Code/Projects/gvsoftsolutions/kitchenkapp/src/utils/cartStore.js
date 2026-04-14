const KEY = "kitchenk_cart_v1";

export function getCart() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("kitchenk_cart_changed"));
}

export function upsertCartItem(item) {
  const cart = getCart();
  const idx = cart.findIndex((x) => x.id === item.id);

  if (idx >= 0) cart[idx] = { ...cart[idx], ...item };
  else cart.push(item);

  saveCart(cart);
}

export function removeCartItem(id) {
  const cart = getCart().filter((x) => x.id !== id);
  saveCart(cart);
}

export function clearCart() {
  saveCart([]);
}

// ✅ NEW: edit existing cart item
export function updateCartItem(id, updates) {
  const cart = getCart().map((x) => (x.id === id ? { ...x, ...updates } : x));
  saveCart(cart);
}