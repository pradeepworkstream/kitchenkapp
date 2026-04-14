import React from "react";
import "./Layout.css";

const items = [
  { key: "dashboard", label: "Dashboard" },
  { key: "products", label: "Products" },
  { key: "orders", label: "Orders" },
  { key: "users", label: "Users" },
  { key: "reports", label: "Reports" },
];

export default function Sidebar({ active, onNavigate, collapsed }) {
  return (
    <aside className={`kk-sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="kk-brand">KitchenK</div>

      <nav className="kk-nav">
        {items.map((it) => (
          <button
            key={it.key}
            className={`kk-nav-item ${active === it.key ? "active" : ""}`}
            onClick={() => onNavigate(it.key)}
            type="button"
          >
            {it.label}
          </button>
        ))}
      </nav>

      <div className="kk-sidebar-footer">v1.0</div>
    </aside>
  );
}
