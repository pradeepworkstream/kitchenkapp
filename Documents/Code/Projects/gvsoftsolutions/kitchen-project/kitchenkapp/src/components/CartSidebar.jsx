// src/components/CartSidebar.jsx
import { useState } from "react";
import { toast } from "react-toastify";
import { useCart } from "../hooks/useCart.js";
import "./CartSidebar.css";

/**
 * Props:
 *   isAdmin  {boolean}  — shows Edit button only for admins
 *   onCheckout {fn}     — called when "Send Order" is clicked
 */
export default function CartSidebar({ isAdmin = false, onCheckout }) {
  const { cart, count, update, remove, clear } = useCart();

  // Which item's edit panel is open (admin only)
  const [editingId, setEditingId] = useState(null);

  const totalQty = cart.reduce((s, x) => s + (x.qty || 1), 0);

  const changeQty = (item, delta) => {
    const next = (item.qty || 1) + delta;
    if (next < 1) {
      remove(item._id);
      toast.info(`${item.name} removed`);
    } else {
      update(item._id, { qty: next });
    }
  };

  const handleClear = () => {
    if (!window.confirm("Clear entire cart?")) return;
    clear();
    toast.success("Cart cleared");
  };

  if (cart.length === 0) {
    return (
      <div className="cs-wrap">
        <div className="cs-header">
          <span className="cs-title">Cart</span>
          <span className="cs-count">Empty</span>
        </div>
        <div className="cs-empty">
          <div className="cs-empty-icon">🛒</div>
          <p>Your vendor order is empty.</p>
          <p className="cs-empty-sub">Click "Order from vendor" on any product.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cs-wrap">
      {/* Header */}
      <div className="cs-header">
        <div>
          <span className="cs-title">Cart</span>
          <span className="cs-count">{count} item{count !== 1 ? "s" : ""}</span>
        </div>
        <button className="cs-clear" onClick={handleClear} title="Clear cart">
          Clear all
        </button>
      </div>

      {/* Items */}
      <div className="cs-items">
        {cart.map((item) => (
          <div key={item._id} className="cs-item">
            <div className="cs-item-icon">{getCategoryEmoji(item.category)}</div>

            <div className="cs-item-body">
              <div className="cs-item-name">{item.name}</div>
              <div className="cs-item-cat">{item.category}</div>
              {item.vendorOrder && (
                <div className="cs-item-badge">Vendor order</div>
              )}

              {/* Qty controls — available to everyone */}
                <div className="cs-item-controls">
                <div className="cs-qty">
                  <button
                    className="cs-qty-btn"
                    onClick={() => changeQty(item, -1)}
                    aria-label="Decrease"
                  >−</button>
                  <span className="cs-qty-val">{item.qty || 1}</span>
                  <button
                    className="cs-qty-btn"
                    onClick={() => changeQty(item, +1)}
                    aria-label="Increase"
                  >+</button>
                </div>

                {/* Edit button — admin only */}
                {isAdmin && (
                  <button
                    className="cs-edit-btn"
                    onClick={() => setEditingId(editingId === item._id ? null : item._id)}
                  >
                    ✏ Edit
                  </button>
                )}

                <button
                  className="cs-remove"
                  onClick={() => { remove(item._id); toast.info(`${item.name} removed`); }}
                  aria-label="Remove"
                >×</button>
              </div>

              {/* Admin edit panel */}
              {isAdmin && editingId === item._id && (
                <div className="cs-edit-panel">
                  <label className="cs-edit-label">Brand</label>
                  <select
                    className="cs-edit-select"
                    value={item.selectedBrand || ""}
                    onChange={(e) => update(item._id, { selectedBrand: e.target.value })}
                  >
                    <option value="">Any</option>
                    {(item.brandOptions || []).map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>

                  <label className="cs-edit-label" style={{ marginTop: 8 }}>Qty</label>
                  <input
                    className="cs-edit-input"
                    type="number"
                    min="1"
                    value={item.qty || 1}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      if (!isNaN(v) && v > 0) update(item._id, { qty: v });
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer summary */}
      <div className="cs-footer">
        <div className="cs-summary-row">
          <span>Items</span><span>{cart.length}</span>
        </div>
        <div className="cs-summary-row">
          <span>Total qty</span><span>{totalQty}</span>
        </div>
        <div className="cs-summary-total">
          <span>Ready to order</span>
          <span className="cs-ready-badge">✓</span>
        </div>

        <button className="cs-checkout-btn" onClick={() => onCheckout?.(cart)}>
          Send Reorder / WhatsApp →
        </button>

        {isAdmin && (
          <button
            className="cs-checkout-btn cs-email-btn"
            onClick={() => onCheckout?.(cart, "email")}
          >
            Send via Email →
          </button>
        )}
      </div>
    </div>
  );
}

function getCategoryEmoji(cat = "") {
  const c = cat.toLowerCase();
  if (c.includes("rice"))    return "🌾";
  if (c.includes("dal") || c.includes("lentil")) return "🫘";
  if (c.includes("flour"))   return "🌾";
  if (c.includes("masala") || c.includes("spice")) return "🌶";
  if (c.includes("vegetable")) return "🥦";
  if (c.includes("drink"))   return "🥤";
  return "📦";
}
