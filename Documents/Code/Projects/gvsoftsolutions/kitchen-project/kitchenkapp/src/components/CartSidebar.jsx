// src/components/CartSidebar.jsx
import { useState } from "react";
import { toast } from "react-toastify";
import { useCart } from "../hooks/useCart.js";
import EmailComposeModal from "./EmailComposeModal.jsx";
import "./CartSidebar.css";

/**
 * Props:
 *   isAdmin          {boolean}  — shows Edit button only for admins
 *   onCheckout       {fn}       — called when "Send Order" is clicked
 *   vendorConflict   {object|null}  — { cartVendor, newVendor, confirmAdd, cancel }
 *                                    passed down from parent when a vendor conflict
 *                                    is detected on add-to-cart
 */
export default function CartSidebar({ isAdmin = false, onCheckout, vendorConflict = null }) {
  const { cart, count, update, remove, clear } = useCart();

  const [editingId,      setEditingId]      = useState(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  const totalQty = cart.items ? cart.items.reduce((s, x) => s + (x.qty || 1), 0) : 0;

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

  // ── Vendor Conflict Modal ─────────────────────────────────────────────────
  if (vendorConflict) {
    return (
      <div className="cs-wrap">
        <div className="cs-conflict-overlay">
          <div className="cs-conflict-modal">
            <div className="cs-conflict-title">Vendor Change Detected</div>
            <p className="cs-conflict-msg">
              Your cart currently contains items from{" "}
              <strong>"{vendorConflict.cartVendor}"</strong>.
              <br />
              To order from <strong>"{vendorConflict.newVendor}"</strong>, the current cart must be cleared.
            </p>
            <p className="cs-conflict-question">Do you want to clear the cart and continue?</p>
            <div className="cs-conflict-btns">
              <button className="cs-conflict-cancel" onClick={vendorConflict.cancel}>
                Cancel
              </button>
              <button className="cs-conflict-confirm" onClick={vendorConflict.confirmAdd}>
                Clear Cart &amp; Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!cart.items || cart.items.length === 0) {
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

      {/* Vendor badge */}
      {cart.vendor && (
        <div className="cs-vendor-badge">
          <span className="cs-vendor-label">Vendor:</span>
          <span className="cs-vendor-name">{cart.vendor}</span>
        </div>
      )}

      {/* Items */}
      <div className="cs-items">
        {cart.items.map((item) => (
          <div key={item._id} className="cs-item">
            <div className="cs-item-icon">{getCategoryEmoji(item.category)}</div>

            <div className="cs-item-body">
              <div className="cs-item-name">{item.name}</div>
              <div className="cs-item-cat">{item.category}</div>

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

              {isAdmin && editingId === item._id && (
                <div className="cs-edit-panel">
                  <label className="cs-edit-label">Qty</label>
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
          <span>Items</span><span>{cart.items.length}</span>
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
            onClick={() => setEmailModalOpen(true)}
          >
            Send via Email →
          </button>
        )}
      </div>

      {/* Email Compose Modal */}
      <EmailComposeModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        vendor={cart.vendor}
        cartItems={cart.items}
      />
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
