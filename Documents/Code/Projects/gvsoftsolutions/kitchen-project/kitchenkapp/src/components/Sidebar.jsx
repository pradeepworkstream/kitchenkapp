// src/components/Sidebar.jsx
import "./Layout.css";

const ADMIN_ITEMS = [
  { key: "dashboard", label: "Dashboard",  icon: "🏠" },
  { key: "shop",      label: "Shop / Cart", icon: "🛒" },
  { key: "products",  label: "Products",   icon: "📦" },
  { key: "orders",    label: "Orders",     icon: "📋" },
  { key: "users",     label: "Users",      icon: "👥" },
  { key: "reports",   label: "Reports",    icon: "📊" },
  { key: "settings",  label: "Settings",   icon: "⚙️" },
];

export default function Sidebar({ active, onNavigate, collapsed }) {
  return (
    <aside className={`kk-sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="kk-brand">{collapsed ? "KK" : "KitchenK"}</div>

      <nav className="kk-nav">
        {ADMIN_ITEMS.map((it) => (
          <button
            key={it.key}
            className={`kk-nav-item ${active === it.key ? "active" : ""}`}
            onClick={() => onNavigate(it.key)}
            type="button"
            title={collapsed ? it.label : ""}
          >
            <span className="kk-nav-icon">{it.icon}</span>
            {!collapsed && <span className="kk-nav-label">{it.label}</span>}
          </button>
        ))}
      </nav>

      <div className="kk-sidebar-footer">{collapsed ? "" : "v1.0"}</div>
    </aside>
  );
}
