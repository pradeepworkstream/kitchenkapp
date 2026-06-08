// src/hooks/useCart.js
import { useCallback, useEffect, useState } from "react";
import {
  addToCart,
  checkVendorConflict,
  clearCart,
  getCart,
  getCartCount,
  removeCartItem,
  updateCartItem,
} from "./cartStore.js";

export function useCart() {
  const [cart,  setCart]  = useState(getCart);
  const [count, setCount] = useState(getCartCount);

  const refresh = useCallback(() => {
    setCart(getCart());
    setCount(getCartCount());
  }, []);

  useEffect(() => {
    window.addEventListener("kitchenk_cart_changed", refresh);
    return () => window.removeEventListener("kitchenk_cart_changed", refresh);
  }, [refresh]);

  const add    = useCallback((item) => { addToCart(item);        refresh(); }, [refresh]);
  const update = useCallback((id, u) => { updateCartItem(id, u); refresh(); }, [refresh]);
  const remove = useCallback((id)   => { removeCartItem(id);     refresh(); }, [refresh]);
  const clear  = useCallback(()     => { clearCart();            refresh(); }, [refresh]);

  const isInCart = useCallback((id) => cart.items.some((x) => x._id === id), [cart]);

  /**
   * Try to add an item, checking for a vendor conflict first.
   *
   * @param {object}   item          — the inventory item to add
   * @param {function} onConflict    — called with { cartVendor, newVendor, confirmAdd }
   *                                   when a conflict is detected.
   *                                   Call confirmAdd() inside the callback to proceed
   *                                   (after clearing the cart).
   */
  const addWithConflictCheck = useCallback((item, onConflict) => {
    const conflict = checkVendorConflict(item);
    if (!conflict.hasConflict) {
      addToCart(item);
      refresh();
      return;
    }
    onConflict({
      cartVendor: conflict.cartVendor,
      newVendor:  conflict.newVendor,
      confirmAdd: () => {
        clearCart();
        addToCart(item);
        refresh();
      },
    });
  }, [refresh]);

  return { cart, count, add, addWithConflictCheck, update, remove, clear, isInCart };
}
