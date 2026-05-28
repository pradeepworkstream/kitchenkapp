// src/hooks/useCart.js
import { useCallback, useEffect, useState } from "react";
import {
  addToCart,
  clearCart,
  getCart,
  getCartCount,
  removeCartItem,
  updateCartItem,
} from "../utils/cartStore.js";

export function useCart() {
  const [cart,  setCart]  = useState(getCart);
  const [count, setCount] = useState(getCartCount);

  const refresh = useCallback(() => {
    const c = getCart();
    setCart(c);
    setCount(c.reduce((s, x) => s + (x.qty || 1), 0));
  }, []);

  useEffect(() => {
    window.addEventListener("kitchenk_cart_changed", refresh);
    return () => window.removeEventListener("kitchenk_cart_changed", refresh);
  }, [refresh]);

  const add    = useCallback((item) => { addToCart(item);          refresh(); }, [refresh]);
  const update = useCallback((id, u) => { updateCartItem(id, u);   refresh(); }, [refresh]);
  const remove = useCallback((id)   => { removeCartItem(id);       refresh(); }, [refresh]);
  const clear  = useCallback(()     => { clearCart();              refresh(); }, [refresh]);

  const isInCart = useCallback((id) => cart.some((x) => x._id === id), [cart]);

  return { cart, count, add, update, remove, clear, isInCart };
}
