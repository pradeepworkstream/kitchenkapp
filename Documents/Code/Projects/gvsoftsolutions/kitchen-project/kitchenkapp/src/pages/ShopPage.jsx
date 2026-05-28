// src/pages/ShopPage.jsx
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../api/api.js";
import CartSidebar from "../components/CartSidebar.jsx";
import { useCart } from "../hooks/useCart.js";
import "./ShopPage.css";

/**
 * Props:
 *   isAdmin {boolean}
 *   onReorder {fn(cart, method)} — called when user clicks Send Order
 */
export default function ShopPage({ isAdmin = false, onReorder }) {
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState("");
  const [cartOpen, setCartOpen] = useState(false);

  const { add, isInCart, cart, count } = useCart();

  // Auto-open cart drawer when first item added
  useEffect(() => {
    if (count === 1 && !cartOpen) setCartOpen(true);
  }, [count]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/inventory/list", {
        params: { limit: 200, search, category },
      });
      if (!res.data?.success) throw new Error(res.data?.message || "Failed");
      setItems(res.data.data || []);
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  // Group items by category
  const grouped = items.reduce((acc, item) => {
    const cat = item.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))].sort();

  const handleAddToCart = (item) => {
    add(item);
    toast.success(`${item.name} added to cart`, { autoClose: 1500 });
  };

  const handleCheckout = (cartItems, method = "whatsapp") => {
    onReorder?.(cartItems, method);
  };

  return (
    <div className="shop-layout">
      {/* Product panel */}
      <div className="shop-main">
        {/* Search + filter bar */}
        <div className="shop-bar">
          <div className="shop-search">
            <span className="shop-search-icon">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items…"
              className="shop-search-input"
            />
            {search && (
              <button className="shop-search-clear" onClick={() => setSearch("")}>×</button>
            )}
          </div>

          <select
            className="shop-cat-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Mobile cart toggle */}
          <button
            className="shop-cart-toggle"
            onClick={() => setCartOpen((s) => !s)}
          >
            🛒 {count > 0 && <span className="shop-cart-badge">{count}</span>}
          </button>
        </div>

        {/* Products */}
        {loading ? (
          <div className="shop-status">Loading inventory…</div>
        ) : items.length === 0 ? (
          <div className="shop-status">No items found.</div>
        ) : (
          <div className="shop-categories">
            {Object.entries(grouped).map(([cat, catItems]) => (
              <div key={cat} className="shop-cat-section">
                <div className="shop-cat-label">
                  <span className="shop-cat-pill">{cat}</span>
                </div>

                <div className="shop-grid">
                  {catItems.map((item) => {
                    const inCart = isInCart(item._id);
                    const outOfStock = item.stock === 0;

                    return (
                      <div
                        key={item._id}
                        className={`shop-card ${inCart ? "shop-card--in-cart" : ""} ${outOfStock ? "shop-card--out" : ""}`}
                      >
                        <div className="shop-card-icon">{getCategoryEmoji(item.category)}</div>

                        <div className="shop-card-body">
                          <div className="shop-card-name">{item.name}</div>

                          {(item.brandOptions || []).length > 0 && (
                            <div className="shop-card-brands">
                              {item.brandOptions.slice(0, 3).map((b) => (
                                <span key={b} className="shop-brand-tag">{b}</span>
                              ))}
                            </div>
                          )}

                          <div className="shop-card-meta">
                            <span className="shop-unit-tag">{item.unit}</span>
                            <span className={`shop-stock ${item.stock <= 5 ? "shop-stock--low" : ""}`}>
                              {outOfStock ? "Out of stock" : `Stock: ${item.stock}`}
                            </span>
                          </div>
                        </div>

                        <button
                          className={`shop-add-btn ${inCart ? "shop-add-btn--added" : ""}`}
                          disabled={outOfStock}
                          onClick={() => !inCart && !outOfStock && handleAddToCart(item)}
                        >
                          {outOfStock ? "Out of stock" : inCart ? "✓ Added" : "+ Add to Cart"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart sidebar — desktop always visible, mobile toggleable */}
      <div className={`shop-cart-panel ${cartOpen ? "shop-cart-panel--open" : ""}`}>
        <CartSidebar
          isAdmin={isAdmin}
          onCheckout={handleCheckout}
        />
      </div>

      {/* Mobile overlay */}
      {cartOpen && (
        <div className="shop-overlay" onClick={() => setCartOpen(false)} />
      )}
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
