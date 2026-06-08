// src/pages/Reports.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../api/api.js";
import "./Reports.css";

const COLORS = ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed", "#0891b2", "#ec4899", "#84cc16"];

function HBar({ data, height = 8 }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="rpt-bars">
      {data.map(({ label, value, color, pct }, i) => (
        <div key={label + i} className="rpt-bar-row">
          <span className="rpt-bar-label" title={label}>{label}</span>
          <div className="rpt-bar-track" style={{ height }}>
            <div
              className="rpt-bar-fill"
              style={{
                width: `${Math.max((value / max) * 100, 2)}%`,
                background: color || COLORS[i % COLORS.length],
                height,
              }}
            />
          </div>
          <span className="rpt-bar-val">{pct !== undefined ? `${pct}%` : value}</span>
        </div>
      ))}
    </div>
  );
}

function exportCSV(filename, headers, rows) {
  const lines = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))];
  const blob  = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url   = URL.createObjectURL(blob);
  const link  = document.createElement("a");
  link.href   = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [analytics, setAnalytics] = useState({});
  const [items,     setItems]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState("overview");

  useEffect(() => {
    let alive = true;
    setLoading(true);

    Promise.allSettled([
      api.get("/api/analytics/report"),
      api.get("/api/inventory/list", { params: { limit: 500 } }),
    ]).then(([analyticsRes, invRes]) => {
      if (!alive) return;
      if (analyticsRes.status === "fulfilled") {
        setAnalytics(analyticsRes.value.data?.data || {});
      }
      if (invRes.status === "fulfilled") {
        setItems(invRes.value.data?.data || []);
      }
    }).finally(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  }, []);

  // ── Analytics aggregations ──────────────────────────────────────────────
  const abStats = useMemo(() => {
    const entries = Object.entries(analytics);
    if (entries.length === 0) return { totals: null, variants: [] };

    const totals = entries.reduce(
      (acc, [, v]) => ({
        pageViews:  acc.pageViews  + (v.page_view    || 0),
        addToCart:  acc.addToCart  + (v.add_to_cart  || 0),
        checkouts:  acc.checkouts  + (v.checkout     || 0),
      }),
      { pageViews: 0, addToCart: 0, checkouts: 0 }
    );
    totals.addRate      = totals.pageViews  > 0 ? ((totals.addToCart / totals.pageViews) * 100).toFixed(1) : "0.0";
    totals.checkoutRate = totals.addToCart  > 0 ? ((totals.checkouts / totals.addToCart) * 100).toFixed(1) : "0.0";

    const variants = entries.map(([name, v], i) => ({
      name,
      pageViews:    v.page_view   || 0,
      addToCart:    v.add_to_cart || 0,
      checkouts:    v.checkout    || 0,
      addRate:      ((v.add_rate      || 0) * 100).toFixed(1),
      checkoutRate: ((v.checkout_rate || 0) * 100).toFixed(1),
      color:        COLORS[i % COLORS.length],
    }));

    return { totals, variants };
  }, [analytics]);

  // ── Inventory aggregations ──────────────────────────────────────────────
  const invStats = useMemo(() => {
    const byVendor = {};
    const byCat    = {};
    items.forEach((i) => {
      if (i.vendor)   byVendor[i.vendor]   = (byVendor[i.vendor]   || 0) + 1;
      if (i.category) byCat[i.category]    = (byCat[i.category]    || 0) + 1;
    });

    const total = items.length || 1;

    const vendorData = Object.entries(byVendor)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value], i) => ({
        label, value,
        pct: ((value / total) * 100).toFixed(1),
        color: COLORS[i % COLORS.length],
      }));

    const catData = Object.entries(byCat)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value], i) => ({
        label, value,
        pct: ((value / total) * 100).toFixed(1),
        color: COLORS[i % COLORS.length],
      }));

    const lowStock   = items.filter((i) => typeof i.stock === "number" && i.stock <= 5);
    const inStock    = items.filter((i) => typeof i.stock === "number" && i.stock > 5);
    const noStockData = items.filter((i) => typeof i.stock !== "number");

    return { vendorData, catData, total: items.length, lowStock, inStock, noStockData };
  }, [items]);

  // ── Export handlers ─────────────────────────────────────────────────────
  const exportInventory = () => {
    exportCSV(
      "kitchenk-inventory.csv",
      ["Name", "Vendor", "Category", "Unit", "Stock"],
      items.map((i) => [i.name, i.vendor, i.category, i.unit, i.stock ?? "N/A"])
    );
  };

  const exportVendorReport = () => {
    exportCSV(
      "kitchenk-vendor-report.csv",
      ["Vendor", "Products", "Share (%)"],
      invStats.vendorData.map((v) => [v.label, v.value, v.pct])
    );
  };

  const exportAnalytics = () => {
    if (abStats.variants.length === 0) return;
    exportCSV(
      "kitchenk-analytics.csv",
      ["Variant", "Page Views", "Add to Cart", "Checkouts", "Add Rate (%)", "Checkout Rate (%)"],
      abStats.variants.map((v) => [v.name, v.pageViews, v.addToCart, v.checkouts, v.addRate, v.checkoutRate])
    );
  };

  const TABS = [
    { id: "overview",   label: "Overview"   },
    { id: "inventory",  label: "Inventory"  },
    { id: "analytics",  label: "A/B Analytics" },
  ];

  return (
    <div className="rpt-page">

      {/* Header */}
      <div className="rpt-head">
        <div>
          <h1 className="rpt-title">Reports</h1>
          <p className="rpt-sub">Inventory analytics and purchase order trends</p>
        </div>
        <div className="rpt-head-btns">
          <button className="rpt-btn-outline" onClick={exportInventory} title="Export all inventory as CSV">
            ⬇ Export Inventory CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="rpt-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`rpt-tab${tab === t.id ? " rpt-tab--active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ─────────────────────────────────────────────────── */}
      {tab === "overview" && (
        <>
          {/* Summary KPIs */}
          <div className="rpt-kpis">
            {[
              { label: "Total Products",     value: loading ? "—" : invStats.total,              icon: "📦", color: "#2563eb", bg: "#eff6ff" },
              { label: "Vendors",            value: loading ? "—" : invStats.vendorData.length,   icon: "🏬", color: "#16a34a", bg: "#f0fdf4" },
              { label: "Categories",         value: loading ? "—" : invStats.catData.length,      icon: "🏷️", color: "#7c3aed", bg: "#faf5ff" },
              { label: "Low Stock Items",    value: loading ? "—" : invStats.lowStock.length,     icon: "⚠️", color: "#dc2626", bg: "#fef2f2", danger: invStats.lowStock.length > 0 },
            ].map(({ label, value, icon, color, bg, danger }) => (
              <div key={label} className={`rpt-kpi${danger ? " rpt-kpi--danger" : ""}`}>
                <div className="rpt-kpi-icon" style={{ background: bg, color }}>{icon}</div>
                <div>
                  <div className="rpt-kpi-value" style={{ color: danger ? color : undefined }}>{value}</div>
                  <div className="rpt-kpi-label">{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Side-by-side: vendor + category */}
          <div className="rpt-grid-2">
            <div className="rpt-panel">
              <div className="rpt-panel-head">
                <span className="rpt-panel-title">By Vendor</span>
                <button className="rpt-panel-export" onClick={exportVendorReport}>⬇ CSV</button>
              </div>
              {loading ? <div className="rpt-loading">Loading…</div>
                : invStats.vendorData.length === 0 ? <p className="rpt-empty">No data</p>
                : <HBar data={invStats.vendorData} />
              }
            </div>

            <div className="rpt-panel">
              <div className="rpt-panel-head">
                <span className="rpt-panel-title">By Category</span>
              </div>
              {loading ? <div className="rpt-loading">Loading…</div>
                : invStats.catData.length === 0 ? <p className="rpt-empty">No data</p>
                : <HBar data={invStats.catData} />
              }
            </div>
          </div>

          {/* Stock health */}
          <div className="rpt-panel">
            <div className="rpt-panel-head">
              <span className="rpt-panel-title">Stock Health</span>
            </div>
            <div className="rpt-stock-health">
              {[
                { label: "Well Stocked",     count: invStats.inStock.length,    color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
                { label: "Low Stock (≤ 5)",  count: invStats.lowStock.length,   color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
                { label: "No Stock Data",    count: invStats.noStockData.length, color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
              ].map(({ label, count, color, bg, border }) => (
                <div key={label} className="rpt-health-card" style={{ background: bg, border: `1px solid ${border}` }}>
                  <div className="rpt-health-val" style={{ color }}>{loading ? "—" : count}</div>
                  <div className="rpt-health-label" style={{ color }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── INVENTORY TAB ────────────────────────────────────────────────── */}
      {tab === "inventory" && (
        <>
          <div className="rpt-panel">
            <div className="rpt-panel-head">
              <span className="rpt-panel-title">Full Inventory List</span>
              <div className="rpt-panel-actions">
                <span className="rpt-count">{invStats.total} products</span>
                <button className="rpt-btn-outline rpt-btn-sm" onClick={exportInventory}>⬇ Export CSV</button>
              </div>
            </div>

            <div className="rpt-table-wrap">
              <table className="rpt-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Vendor</th>
                    <th>Category</th>
                    <th>Unit</th>
                    <th>Stock</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="rpt-td-loading">Loading inventory…</td></tr>
                  ) : items.length === 0 ? (
                    <tr><td colSpan={6} className="rpt-td-empty">No inventory data found.</td></tr>
                  ) : (
                    items.map((item) => {
                      const isLow    = typeof item.stock === "number" && item.stock <= 5;
                      const noStock  = typeof item.stock !== "number";
                      return (
                        <tr key={item._id} className={isLow ? "rpt-row--warn" : ""}>
                          <td className="rpt-td-name">{item.name}</td>
                          <td>{item.vendor || <span className="rpt-dash">—</span>}</td>
                          <td>{item.category || <span className="rpt-dash">—</span>}</td>
                          <td>{item.unit || <span className="rpt-dash">—</span>}</td>
                          <td className="rpt-td-stock">{noStock ? <span className="rpt-dash">—</span> : item.stock}</td>
                          <td>
                            {noStock   ? <span className="rpt-badge rpt-badge--na">No Data</span>
                            : isLow   ? <span className="rpt-badge rpt-badge--low">Low Stock</span>
                            :           <span className="rpt-badge rpt-badge--ok">OK</span>
                            }
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Vendor breakdown table */}
          <div className="rpt-grid-2">
            <div className="rpt-panel">
              <div className="rpt-panel-head">
                <span className="rpt-panel-title">Vendor Breakdown</span>
                <button className="rpt-panel-export" onClick={exportVendorReport}>⬇ CSV</button>
              </div>
              <div className="rpt-table-wrap">
                <table className="rpt-table">
                  <thead>
                    <tr><th>Vendor</th><th className="rpt-th-right">Products</th><th className="rpt-th-right">Share</th></tr>
                  </thead>
                  <tbody>
                    {invStats.vendorData.map(({ label, value, pct, color }) => (
                      <tr key={label}>
                        <td><span className="rpt-dot" style={{ background: color }} />{label}</td>
                        <td className="rpt-td-right">{value}</td>
                        <td className="rpt-td-right">{pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rpt-panel">
              <div className="rpt-panel-head">
                <span className="rpt-panel-title">Category Breakdown</span>
              </div>
              <div className="rpt-table-wrap">
                <table className="rpt-table">
                  <thead>
                    <tr><th>Category</th><th className="rpt-th-right">Products</th><th className="rpt-th-right">Share</th></tr>
                  </thead>
                  <tbody>
                    {invStats.catData.map(({ label, value, pct, color }) => (
                      <tr key={label}>
                        <td><span className="rpt-dot" style={{ background: color }} />{label}</td>
                        <td className="rpt-td-right">{value}</td>
                        <td className="rpt-td-right">{pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── A/B ANALYTICS TAB ─────────────────────────────────────────────── */}
      {tab === "analytics" && (
        <>
          {abStats.totals ? (
            <>
              {/* Totals KPIs */}
              <div className="rpt-kpis">
                {[
                  { label: "Total Page Views",  value: abStats.totals.pageViews,  icon: "👁️",  color: "#2563eb", bg: "#eff6ff" },
                  { label: "Add to Cart",        value: abStats.totals.addToCart,  icon: "🛒", color: "#16a34a", bg: "#f0fdf4" },
                  { label: "Checkouts",          value: abStats.totals.checkouts,  icon: "✅", color: "#7c3aed", bg: "#faf5ff" },
                  { label: "Checkout Rate",      value: `${abStats.totals.checkoutRate}%`, icon: "📈", color: "#d97706", bg: "#fffbeb" },
                ].map(({ label, value, icon, color, bg }) => (
                  <div key={label} className="rpt-kpi">
                    <div className="rpt-kpi-icon" style={{ background: bg, color }}>{icon}</div>
                    <div>
                      <div className="rpt-kpi-value">{value}</div>
                      <div className="rpt-kpi-label">{label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Per-variant cards */}
              <div className="rpt-panel">
                <div className="rpt-panel-head">
                  <span className="rpt-panel-title">A/B Variant Performance</span>
                  <button className="rpt-panel-export" onClick={exportAnalytics}>⬇ Export CSV</button>
                </div>
                <div className="rpt-variant-grid">
                  {abStats.variants.map((v) => (
                    <div key={v.name} className="rpt-variant-card" style={{ borderTopColor: v.color }}>
                      <div className="rpt-variant-name" style={{ color: v.color }}>{v.name}</div>
                      <div className="rpt-variant-stats">
                        <div className="rpt-variant-stat">
                          <span className="rpt-variant-val">{v.pageViews.toLocaleString()}</span>
                          <span className="rpt-variant-lbl">Page Views</span>
                        </div>
                        <div className="rpt-variant-stat">
                          <span className="rpt-variant-val">{v.addToCart.toLocaleString()}</span>
                          <span className="rpt-variant-lbl">Add to Cart</span>
                        </div>
                        <div className="rpt-variant-stat">
                          <span className="rpt-variant-val">{v.checkouts.toLocaleString()}</span>
                          <span className="rpt-variant-lbl">Checkouts</span>
                        </div>
                      </div>
                      <div className="rpt-variant-rates">
                        <div className="rpt-rate-row">
                          <span className="rpt-rate-label">Add Rate</span>
                          <div className="rpt-rate-bar-track">
                            <div className="rpt-rate-bar-fill" style={{ width: `${v.addRate}%`, background: v.color }} />
                          </div>
                          <span className="rpt-rate-pct">{v.addRate}%</span>
                        </div>
                        <div className="rpt-rate-row">
                          <span className="rpt-rate-label">Checkout Rate</span>
                          <div className="rpt-rate-bar-track">
                            <div className="rpt-rate-bar-fill" style={{ width: `${v.checkoutRate}%`, background: v.color }} />
                          </div>
                          <span className="rpt-rate-pct">{v.checkoutRate}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Compare chart */}
                <div style={{ marginTop: 24 }}>
                  <p className="rpt-panel-title" style={{ marginBottom: 12 }}>Add Rate Comparison</p>
                  <HBar
                    data={abStats.variants.map((v) => ({
                      label: v.name,
                      value: parseFloat(v.addRate),
                      pct:   v.addRate,
                      color: v.color,
                    }))}
                    height={10}
                  />
                </div>
              </div>

              {/* Raw data table */}
              <div className="rpt-panel">
                <div className="rpt-panel-head">
                  <span className="rpt-panel-title">Raw Analytics Data</span>
                </div>
                <div className="rpt-table-wrap">
                  <table className="rpt-table">
                    <thead>
                      <tr>
                        <th>Variant</th>
                        <th className="rpt-th-right">Page Views</th>
                        <th className="rpt-th-right">Add to Cart</th>
                        <th className="rpt-th-right">Checkouts</th>
                        <th className="rpt-th-right">Add Rate</th>
                        <th className="rpt-th-right">Checkout Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {abStats.variants.map((v) => (
                        <tr key={v.name}>
                          <td>
                            <span className="rpt-dot" style={{ background: v.color }} />
                            {v.name}
                          </td>
                          <td className="rpt-td-right">{v.pageViews.toLocaleString()}</td>
                          <td className="rpt-td-right">{v.addToCart.toLocaleString()}</td>
                          <td className="rpt-td-right">{v.checkouts.toLocaleString()}</td>
                          <td className="rpt-td-right">{v.addRate}%</td>
                          <td className="rpt-td-right">{v.checkoutRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="rpt-panel">
              <div className="rpt-analytics-empty">
                <span className="rpt-empty-icon">📊</span>
                <h3>No Analytics Data Yet</h3>
                <p>
                  Analytics data will appear here once users start browsing the shop.
                  Data is collected automatically when users visit the shop page.
                </p>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}
