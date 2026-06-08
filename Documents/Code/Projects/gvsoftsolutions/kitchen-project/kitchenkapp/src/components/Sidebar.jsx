// src/components/Sidebar.jsx
import "./Layout.css";

const ADMIN_ITEMS = [
  { key: "dashboard", label: "Dashboard",       icon: "🏠" },
  { key: "shop",      label: "Shop & Cart",      icon: "🛒" },
  { key: "products",  label: "Products",         icon: "📦" },
  { key: "orders",    label: "Purchase Orders",  icon: "📋" },
  { key: "users",     label: "Users",            icon: "👥" },
  { key: "reports",   label: "Reports",          icon: "📊" },
  { key: "settings",  label: "Vendor Settings",  icon: "⚙️" },
];

export default function Sidebar({ active, onNavigate }) {
  return (
    <aside className="kk-sidebar">
      <div className="kk-brand">
        <span className="kk-brand-icon">🍴</span>
        <span className="kk-brand-text">KitchenK</span>
      </div>

      <nav className="kk-nav">
        {ADMIN_ITEMS.map((it) => (
          <button
            key={it.key}
            className={`kk-nav-item${active === it.key ? " active" : ""}`}
            onClick={() => onNavigate(it.key)}
            type="button"
          >
            <span className="kk-nav-icon">{it.icon}</span>
            <span className="kk-nav-label">{it.label}</span>
          </button>
        ))}
      </nav>

      <div className="kk-sidebar-footer">KitchenK v1.0</div>
    </aside>
  );
}
