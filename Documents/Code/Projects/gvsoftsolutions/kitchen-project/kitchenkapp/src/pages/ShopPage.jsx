// src/pages/ShopPage.jsx
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../api/api.js";
import CartSidebar from "../components/CartSidebar.jsx";
import { useCart } from "../hooks/useCart.js";
import "./ShopPage.css";
import { VENDORS, VENDOR_CATEGORIES, ALL_CATEGORIES } from "../data/vendorCategories.js";
import { sendEvent, assignVariant } from "../utils/analytics.js";

const BACKEND = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/+$/, "");
function getImageUrl(imageUrl) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("http")) return imageUrl;
  return `${BACKEND}${imageUrl}`;
}

/**
 * Props:
 *   isAdmin  {boolean}
 *   onReorder {fn(cart, method)} — called when user clicks Send Order
 */
export default function ShopPage({ isAdmin = false, onReorder }) {
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [vendor,   setVendor]   = useState("");
  const [category, setCategory] = useState("");
  const [abVariant] = useState(assignVariant());
  const [cartOpen,  setCartOpen] = useState(false);

  // Vendor conflict modal state
  const [vendorConflict, setVendorConflict] = useState(null);

  const { addWithConflictCheck, isInCart, count } = useCart();

  // Auto-open cart drawer when first item added
  useEffect(() => {
    if (count === 1 && !cartOpen) setCartOpen(true);
  }, [count]); // eslint-disable-line react-hooks/exhaustive-deps

  // Static vendor/category lists
  const vendors = VENDORS;
  const categories = vendor ? (VENDOR_CATEGORIES[vendor] || []) : ALL_CATEGORIES;

  // Load inventory
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 200, search, vendor, category };
      console.log("[Shop] fetch →", params);
      const res = await api.get("/api/inventory/list", { params });
      if (!res.data?.success) throw new Error(res.data?.message || "Failed");
      const data = res.data.data || [];
      console.log("[Shop] API response — total:", res.data.total, "returned:", data.length);
      if (data.length > 0) {
        console.log("[Shop] sample item:", JSON.stringify(data[0], null, 2));
      }
      setItems(data);
    } catch (e) {
      console.error("[Shop] load error:", e?.response?.data || e.message);
      toast.error(e?.response?.data?.message || e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [search, vendor, category]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    sendEvent("page_view", { page: "shop", variant: abVariant });
  }, [abVariant]);

  // Refresh when admin changes inventory
  useEffect(() => {
    const onChange = () => load();
    window.addEventListener("inventory:changed", onChange);
    return () => window.removeEventListener("inventory:changed", onChange);
  }, [load]);

  // Group items by category
  const grouped = items.reduce((acc, item) => {
    const cat = item.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const handleAddToCart = (item) => {
    if (!item?._id && !item?.id) {
      toast.error("Unable to add vendor order: missing product id");
      return;
    }

    let hadConflict = false;

    addWithConflictCheck(item, ({ cartVendor, newVendor, confirmAdd }) => {
      hadConflict = true;
      setVendorConflict({
        cartVendor,
        newVendor,
        confirmAdd: () => {
          confirmAdd();
          setVendorConflict(null);
          toast.success(`${item.name} added to vendor order`, { autoClose: 1500 });
          sendEvent("add_to_cart", { variant: abVariant, vendor: item.vendor, category: item.category, itemId: item._id });
        },
        cancel: () => setVendorConflict(null),
      });
      setCartOpen(true);
    });

    if (!hadConflict) {
      toast.success(`${item.name} added to vendor order`, { autoClose: 1500 });
      sendEvent("add_to_cart", { variant: abVariant, vendor: item.vendor || vendor, category: item.category, itemId: item._id });
    }
  };

  const handleCheckout = (cartItems, method = "whatsapp") => {
    onReorder?.(cartItems, method);
    sendEvent("checkout", { variant: abVariant, method, count: cartItems.length });
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
            className="shop-vendor-select"
            value={vendor}
            onChange={(e) => {
              setVendor(e.target.value);
              setCategory("");
            }}
          >
            <option value="">All Vendors</option>
            {vendors.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>

          <select
            className="shop-cat-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={abVariant === "vendor-first" && !vendor}
          >
            {abVariant === "vendor-first" && !vendor ? (
              <option value="">Select vendor first</option>
            ) : (
              <>
                <option value="">All Categories</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </>
            )}
          </select>

          {/* Mobile cart toggle */}
          <button
            className="shop-cart-toggle"
            onClick={() => setCartOpen((s) => !s)}
            aria-label={`Cart, ${count} items`}
          >
            🛒
            {count > 0 && <span className="shop-cart-badge">{count > 99 ? "99+" : count}</span>}
            <span style={{ marginLeft: 4, fontSize: 13 }}>Cart</span>
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
                    const itemId = item._id || item.id || item.productId;
                    const inCart = isInCart(itemId);

                    return (
                      <div
                        key={itemId || item.name}
                        className={`shop-card ${inCart ? "shop-card--in-cart" : ""}`}
                      >
                        <div className="shop-card-icon">
                          {getImageUrl(item.imageUrl) ? (
                            <img
                              src={getImageUrl(item.imageUrl)}
                              alt={item.name}
                              className="shop-card-img"
                              onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                            />
                          ) : null}
                          <span
                            className="shop-card-emoji"
                            style={{ display: getImageUrl(item.imageUrl) ? "none" : "flex" }}
                          >
                            {getCategoryEmoji(item.category)}
                          </span>
                        </div>

                        <div className="shop-card-body">
                          <div className="shop-card-name">{item.name}</div>
                        </div>

                        <button
                          className={`shop-add-btn ${inCart ? "shop-add-btn--added" : ""}`}
                          disabled={!itemId || inCart}
                          onClick={() => !inCart && handleAddToCart({ ...item, _id: itemId })}
                        >
                          {inCart ? "✓ Added" : "Order from vendor"}
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
          vendorConflict={vendorConflict}
        />
      </div>

      {/* Mobile overlay */}
      {cartOpen && (
        <div className="shop-overlay" onClick={() => { setCartOpen(false); setVendorConflict(null); }} />
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
