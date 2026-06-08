// src/hooks/cartStore.js
const KEY = "kitchenk_cart_v2";
const EMPTY_CART = { vendor: null, items: [] };

const getItemId = (item) => item?._id || item?.id || item?.productId || null;

export function getCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!parsed || typeof parsed !== "object") return { ...EMPTY_CART };
    if (Array.isArray(parsed)) {
      return { vendor: null, items: parsed };
    }
    return {
      vendor: parsed.vendor || null,
      items: Array.isArray(parsed.items) ? parsed.items : [],
    };
  } catch {
    return { ...EMPTY_CART };
  }
}

function saveCart(cart) {
  try {
    localStorage.setItem(KEY, JSON.stringify(cart));
    window.dispatchEvent(new Event("kitchenk_cart_changed"));
  } catch (e) { console.error("cartStore: save failed", e); }
}

/**
 * Returns conflict info before actually adding.
 * { hasConflict: false }                          — cart is empty or vendors match
 * { hasConflict: true, cartVendor, newVendor }    — must prompt user
 */
export function checkVendorConflict(item) {
  const cart = getCart();
  if (!cart.items.length || !cart.vendor) return { hasConflict: false };
  const newVendor = item?.vendor || null;
  if (!newVendor) return { hasConflict: false };
  if (cart.vendor === newVendor) return { hasConflict: false };
  return { hasConflict: true, cartVendor: cart.vendor, newVendor };
}

export function addToCart(item) {
  const id = getItemId(item);
  if (!id) return;

  const cart       = getCart();
  const nextVendor = item.vendor || cart.vendor || null;
  const idx        = cart.items.findIndex((x) => x._id === id);

  if (idx >= 0) {
    cart.items[idx].qty = (cart.items[idx].qty || 1) + 1;
  } else {
    cart.items.push({
      _id:      id,
      vendor:   item.vendor || null,
      name:     item.name   || "",
      category: item.category || "",
      unit:     item.unit   || "",
      qty:      1,
    });
  }

  saveCart({ vendor: nextVendor, items: cart.items });
}

export function updateCartItem(id, updates) {
  if (!id) return;
  const cart   = getCart();
  cart.items   = cart.items.map((x) => (x._id === id ? { ...x, ...updates } : x));
  saveCart(cart);
}

export function removeCartItem(id) {
  if (!id) return;
  const cart   = getCart();
  cart.items   = cart.items.filter((x) => x._id !== id);
  if (cart.items.length === 0) cart.vendor = null;
  saveCart(cart);
}

export function clearCart() {
  saveCart({ vendor: null, items: [] });
}

export function getCartCount() {
  const cart = getCart();
  return cart.items.reduce((sum, x) => sum + (x.qty || 1), 0);
}
