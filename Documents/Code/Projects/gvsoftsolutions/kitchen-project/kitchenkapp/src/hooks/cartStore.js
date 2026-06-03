// src/hooks/cartStore.js
const KEY = "kitchenk_cart_v2";

const getItemId = (item) => item?._id || item?.id || item?.productId || null;

export function getCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function saveCart(cart) {
  try {
    localStorage.setItem(KEY, JSON.stringify(cart));
    window.dispatchEvent(new Event("kitchenk_cart_changed"));
  } catch (e) { console.error("cartStore: save failed", e); }
}

export function addToCart(item) {
  const id = getItemId(item);
  if (!id) return;

  const cart = getCart();
  const idx  = cart.findIndex((x) => x._id === id);
  if (idx >= 0) {
    cart[idx].qty = (cart[idx].qty || 1) + 1;
    cart[idx].vendorOrder = cart[idx].vendorOrder || Boolean(item.vendorOrder);
  } else {
    cart.push({
      _id:           id,
      name:          item.name || "",
      category:      item.category || "",
      unit:          item.unit || "",
      brandOptions:  item.brandOptions || [],
      selectedBrand: item.brandOptions?.[0] || "",
      qty:           1,
      stock:         item.stock ?? 0,
      vendorOrder:   Boolean(item.vendorOrder),
    });
  }
  saveCart(cart);
}

export function updateCartItem(id, updates) {
  if (!id) return;
  saveCart(getCart().map((x) => (x._id === id ? { ...x, ...updates } : x)));
}

export function removeCartItem(id) {
  if (!id) return;
  saveCart(getCart().filter((x) => x._id !== id));
}

export function clearCart() { saveCart([]); }

export function getCartCount() {
  return getCart().reduce((sum, x) => sum + (x.qty || 1), 0);
}