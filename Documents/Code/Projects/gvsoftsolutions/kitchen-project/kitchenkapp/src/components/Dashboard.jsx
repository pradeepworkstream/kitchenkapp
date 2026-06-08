// src/components/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../api/api.js";
import "./Dashboard.css";

const VENDOR_COLORS = ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed", "#0891b2"];
const CAT_COLORS    = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16"];

function HBar({ data }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="dash-bars">
      {data.map(({ label, value, color }) => (
        <div key={label} className="dash-bar-row">
          <span className="dash-bar-label" title={label}>{label}</span>
          <div className="dash-bar-track">
            <div
              className="dash-bar-fill"
              style={{ width: `${Math.max((value / max) * 100, 3)}%`, background: color }}
            />
          </div>
          <span className="dash-bar-val">{value}</span>
        </div>
      ))}
    </div>
  );
}

function SkeletonBars({ count = 3 }) {
  return (
    <div className="dash-bars">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="dash-bar-row">
          <div className="dash-skel dash-skel--label" />
          <div className="dash-bar-track">
            <div className="dash-skel dash-skel--fill" style={{ width: `${68 - i * 14}%` }} />
          </div>
          <div className="dash-skel dash-skel--val" />
        </div>
      ))}
    </div>
  );
}

export default function Dashboard({ onNavigate }) {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    api.get("/api/inventory/list", { params: { limit: 500 } })
      .then((res) => { if (alive) setItems(res.data?.data || []); })
      .catch((e)  => { if (alive) setError(e?.response?.data?.message || e.message || "Failed to load inventory"); })
      .finally(()  => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const stats = useMemo(() => {
    const catSet = new Set(items.map((i) => i.category).filter(Boolean));
    const venSet = new Set(items.map((i) => i.vendor).filter(Boolean));
    const low    = items.filter((i) => typeof i.stock === "number" && i.stock <= 5);

    const byVendor = {};
    items.forEach((i) => { if (i.vendor)   byVendor[i.vendor]   = (byVendor[i.vendor]   || 0) + 1; });
    const byCat = {};
    items.forEach((i) => { if (i.category) byCat[i.category]    = (byCat[i.category]    || 0) + 1; });

    return {
      total:      items.length,
      categories: catSet.size,
      vendors:    venSet.size,
      lowCount:   low.length,
      lowItems:   low.slice(0, 6),
      vendorData: Object.entries(byVendor)
        .sort((a, b) => b[1] - a[1])
        .map(([l, v], i) => ({ label: l, value: v, color: VENDOR_COLORS[i % VENDOR_COLORS.length] })),
      catData: Object.entries(byCat)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([l, v], i) => ({ label: l, value: v, color: CAT_COLORS[i % CAT_COLORS.length] })),
    };
  }, [items]);

  const kpis = [
    {
      label: "Total Products", value: stats.total,
      icon: "📦", color: "#2563eb", bg: "#eff6ff",
      nav: "products", navLabel: "View all",
    },
    {
      label: "Active Vendors", value: stats.vendors,
      icon: "🏬", color: "#16a34a", bg: "#f0fdf4",
      nav: "settings", navLabel: "Manage",
    },
    {
      label: "Categories", value: stats.categories,
      icon: "🏷️", color: "#7c3aed", bg: "#faf5ff",
      nav: null,
    },
    {
      label: "Low Stock Items", value: stats.lowCount,
      icon: stats.lowCount > 0 ? "⚠️" : "✅",
      color: stats.lowCount > 0 ? "#dc2626" : "#16a34a",
      bg:    stats.lowCount > 0 ? "#fef2f2" : "#f0fdf4",
      nav: "products", navLabel: stats.lowCount > 0 ? "Review" : null,
      danger: stats.lowCount > 0,
    },
  ];

  return (
    <div className="dash-page">

      {/* Page header */}
      <div className="dash-head">
        <div>
          <h1 className="dash-title">Dashboard</h1>
          <p className="dash-sub">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            })}
          </p>
        </div>
        <div className="dash-head-btns">
          <button className="dash-btn-outline" onClick={() => onNavigate?.("shop")}>
            🛒 New Order
          </button>
          <button className="dash-btn-primary" onClick={() => onNavigate?.("products")}>
            + Add Product
          </button>
        </div>
      </div>

      {error && <div className="dash-error">{error}</div>}

      {/* KPI cards */}
      <div className="dash-kpis">
        {kpis.map(({ label, value, icon, color, bg, nav, navLabel, danger }) => (
          <div
            key={label}
            className={`dash-kpi${danger ? " dash-kpi--danger" : ""}${nav ? " dash-kpi--link" : ""}`}
            onClick={() => nav && onNavigate?.(nav)}
            role={nav ? "button" : undefined}
            tabIndex={nav ? 0 : undefined}
            onKeyDown={nav ? (e) => e.key === "Enter" && onNavigate?.(nav) : undefined}
          >
            <div className="dash-kpi-icon" style={{ background: bg, color }}>{icon}</div>
            <div className="dash-kpi-body">
              <div className="dash-kpi-value" style={{ color: danger ? color : undefined }}>
                {loading ? <span className="dash-skel dash-skel--num" /> : value}
              </div>
              <div className="dash-kpi-label">{label}</div>
            </div>
            {navLabel && (
              <span className="dash-kpi-arrow" style={{ color }}>
                {navLabel} →
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Vendor chart + Low stock alerts */}
      <div className="dash-grid-2">

        <div className="dash-panel">
          <div className="dash-panel-head">
            <span className="dash-panel-title">Inventory by Vendor</span>
            <button className="dash-panel-link" onClick={() => onNavigate?.("settings")}>
              Manage vendors →
            </button>
          </div>
          {loading ? (
            <SkeletonBars count={3} />
          ) : stats.vendorData.length === 0 ? (
            <p className="dash-empty">
              No vendor data yet.{" "}
              <button className="dash-empty-link" onClick={() => onNavigate?.("settings")}>Add vendors →</button>
            </p>
          ) : (
            <HBar data={stats.vendorData} />
          )}
        </div>

        <div className="dash-panel">
          <div className="dash-panel-head">
            <span className="dash-panel-title">
              {!loading && stats.lowCount > 0 ? `⚠️ Low Stock (${stats.lowCount})` : "Stock Status"}
            </span>
            <button className="dash-panel-link" onClick={() => onNavigate?.("products")}>
              View products →
            </button>
          </div>
          {loading ? (
            <SkeletonBars count={3} />
          ) : stats.lowCount === 0 ? (
            <div className="dash-good">
              <span className="dash-good-icon">✅</span>
              <span>All items are well-stocked!</span>
            </div>
          ) : (
            <div className="dash-alert-list">
              {stats.lowItems.map((item) => (
                <div key={item._id} className="dash-alert-row">
                  <span className="dash-alert-dot" />
                  <div className="dash-alert-info">
                    <span className="dash-alert-name">{item.name}</span>
                    <span className="dash-alert-meta">
                      {item.category}{item.vendor ? ` · ${item.vendor}` : ""}
                    </span>
                  </div>
                  <span className="dash-alert-stock">{item.stock ?? 0} left</span>
                </div>
              ))}
              {stats.lowCount > 6 && (
                <button className="dash-alert-more" onClick={() => onNavigate?.("products")}>
                  +{stats.lowCount - 6} more items →
                </button>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Category chart */}
      <div className="dash-panel">
        <div className="dash-panel-head">
          <span className="dash-panel-title">Products by Category</span>
          <span className="dash-panel-hint">
            {stats.categories} categories · {stats.total} products total
          </span>
        </div>
        {loading ? (
          <SkeletonBars count={5} />
        ) : stats.catData.length === 0 ? (
          <p className="dash-empty">No category data yet.</p>
        ) : (
          <HBar data={stats.catData} />
        )}
      </div>

      {/* Quick actions */}
      <div className="dash-panel">
        <div className="dash-panel-head">
          <span className="dash-panel-title">Quick Actions</span>
        </div>
        <div className="dash-quick-grid">
          {[
            { icon: "🛒", label: "New Vendor Order",  desc: "Browse inventory and build a purchase order",  nav: "shop",     color: "#2563eb" },
            { icon: "📦", label: "Manage Products",   desc: "Add, edit, or remove inventory items",          nav: "products", color: "#16a34a" },
            { icon: "📊", label: "View Reports",      desc: "Analytics, vendor stats, purchase trends",      nav: "reports",  color: "#7c3aed" },
            { icon: "⚙️", label: "Vendor Settings",   desc: "Manage vendor profiles, emails & WhatsApp",     nav: "settings", color: "#d97706" },
          ].map(({ icon, label, desc, nav, color }) => (
            <button key={nav} className="dash-quick-btn" onClick={() => onNavigate?.(nav)}>
              <span className="dash-quick-icon" style={{ color }}>{icon}</span>
              <div className="dash-quick-text">
                <span className="dash-quick-label">{label}</span>
                <span className="dash-quick-desc">{desc}</span>
              </div>
              <span className="dash-quick-arrow" style={{ color }}>→</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
