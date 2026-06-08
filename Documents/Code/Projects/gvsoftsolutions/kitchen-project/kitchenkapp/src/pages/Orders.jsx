// src/pages/Orders.jsx
import { useEffect, useState } from "react";
import { clearOrderLog, getOrderLog } from "../utils/orderLog.js";
import "./Orders.css";

function methodLabel(m) {
  if (m === "email")    return { text: "Email",    cls: "ord-badge--email",    icon: "✉️" };
  if (m === "whatsapp") return { text: "WhatsApp", cls: "ord-badge--wa",       icon: "📱" };
  return                       { text: m || "—",   cls: "ord-badge--other",    icon: "📤" };
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
    });
  } catch {
    return iso;
  }
}

export default function Orders({ onNavigate }) {
  const [orders,   setOrders]   = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [filter,   setFilter]   = useState("all");

  const refresh = () => setOrders(getOrderLog());

  useEffect(() => {
    refresh();
    window.addEventListener("kitchenk_order_log_changed", refresh);
    return () => window.removeEventListener("kitchenk_order_log_changed", refresh);
  }, []);

  const handleClear = () => {
    if (!window.confirm("Clear all purchase order history? This cannot be undone.")) return;
    clearOrderLog();
  };

  const filtered = filter === "all"
    ? orders
    : orders.filter((o) => o.method === filter);

  const methodCounts = {
    all:       orders.length,
    whatsapp:  orders.filter((o) => o.method === "whatsapp").length,
    email:     orders.filter((o) => o.method === "email").length,
  };

  return (
    <div className="ord-page">

      {/* Header */}
      <div className="ord-head">
        <div>
          <h1 className="ord-title">Purchase Orders</h1>
          <p className="ord-sub">History of orders sent via WhatsApp and Email</p>
        </div>
        <div className="ord-head-btns">
          {orders.length > 0 && (
            <button className="ord-btn-danger" onClick={handleClear}>
              Clear History
            </button>
          )}
          <button className="ord-btn-primary" onClick={() => onNavigate?.("shop")}>
            🛒 New Order
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="ord-kpis">
        <div className="ord-kpi">
          <div className="ord-kpi-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>📋</div>
          <div>
            <div className="ord-kpi-value">{orders.length}</div>
            <div className="ord-kpi-label">Total Orders</div>
          </div>
        </div>
        <div className="ord-kpi">
          <div className="ord-kpi-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}>📱</div>
          <div>
            <div className="ord-kpi-value">{methodCounts.whatsapp}</div>
            <div className="ord-kpi-label">Via WhatsApp</div>
          </div>
        </div>
        <div className="ord-kpi">
          <div className="ord-kpi-icon" style={{ background: "#faf5ff", color: "#7c3aed" }}>✉️</div>
          <div>
            <div className="ord-kpi-value">{methodCounts.email}</div>
            <div className="ord-kpi-label">Via Email</div>
          </div>
        </div>
        <div className="ord-kpi">
          <div className="ord-kpi-icon" style={{ background: "#fff7ed", color: "#d97706" }}>📦</div>
          <div>
            <div className="ord-kpi-value">
              {orders.reduce((s, o) => s + (o.totalQty || 0), 0)}
            </div>
            <div className="ord-kpi-label">Items Ordered</div>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      {orders.length > 0 && (
        <div className="ord-filters">
          {[
            { id: "all",       label: `All (${methodCounts.all})` },
            { id: "whatsapp",  label: `WhatsApp (${methodCounts.whatsapp})` },
            { id: "email",     label: `Email (${methodCounts.email})` },
          ].map(({ id, label }) => (
            <button
              key={id}
              className={`ord-filter-btn${filter === id ? " ord-filter-btn--active" : ""}`}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Order list */}
      {orders.length === 0 ? (
        <div className="ord-panel ord-empty-state">
          <span className="ord-empty-icon">📋</span>
          <h3 className="ord-empty-title">No purchase orders yet</h3>
          <p className="ord-empty-desc">
            Purchase orders appear here automatically when you send them via WhatsApp or Email
            from the Shop page.
          </p>
          <button className="ord-btn-primary" onClick={() => onNavigate?.("shop")}>
            🛒 Go to Shop
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="ord-panel ord-empty-state">
          <span className="ord-empty-icon">🔍</span>
          <h3 className="ord-empty-title">No {filter} orders</h3>
          <p className="ord-empty-desc">
            No purchase orders were sent via {filter} yet.
          </p>
        </div>
      ) : (
        <div className="ord-panel">
          <div className="ord-table-wrap">
            <table className="ord-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Vendor</th>
                  <th>Method</th>
                  <th>Sent To</th>
                  <th className="ord-th-right">Items</th>
                  <th className="ord-th-right">Total Qty</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const m    = methodLabel(order.method);
                  const open = expanded === order.id;
                  return [
                    <tr
                      key={order.id}
                      className={`ord-row${open ? " ord-row--open" : ""}`}
                      onClick={() => setExpanded(open ? null : order.id)}
                    >
                      <td className="ord-td-date">{formatDate(order.date)}</td>
                      <td className="ord-td-vendor">{order.vendor}</td>
                      <td>
                        <span className={`ord-badge ${m.cls}`}>
                          {m.icon} {m.text}
                        </span>
                      </td>
                      <td className="ord-td-sent">{order.sentTo || <span className="ord-dash">—</span>}</td>
                      <td className="ord-td-right">{order.totalItems}</td>
                      <td className="ord-td-right">{order.totalQty}</td>
                      <td className="ord-td-expand">
                        <span className={`ord-expand-icon${open ? " ord-expand-icon--open" : ""}`}>▾</span>
                      </td>
                    </tr>,
                    open && (
                      <tr key={`${order.id}-detail`} className="ord-detail-row">
                        <td colSpan={7}>
                          <div className="ord-detail">
                            <div className="ord-detail-label">Items in this order:</div>
                            <div className="ord-item-grid">
                              {(order.items || []).map((it, i) => (
                                <div key={i} className="ord-item-chip">
                                  <span className="ord-item-name">{it.name}</span>
                                  <span className="ord-item-qty">{it.qty} {it.unit || "×"}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ),
                  ];
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
