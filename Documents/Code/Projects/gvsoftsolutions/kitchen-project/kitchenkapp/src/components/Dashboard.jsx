// src/components/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import productsService from "../api/productsService.js";
import "./Dashboard.css";

export default function Dashboard({ onNavigate }) {
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    productsService
      .list({ page: 1, limit: 100 })
      .then((res) => {
        if (!mounted) return;
        if (!res?.success) throw new Error(res?.message || "Failed to load");
        // backend returns { data: [...] }  (not items:[])
        setItems(res.data || []);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e?.response?.data?.message || e.message || "Load failed");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, []);

  const metrics = useMemo(() => {
    const cats     = new Set(items.map((i) => i.category).filter(Boolean));
    const active   = items.filter((i) => i.isActive !== false).length;
    const lowStock = items.filter((i) => typeof i.stock === "number" && i.stock <= 5).length;
    return { total: items.length, categories: cats.size, active, lowStock };
  }, [items]);

  return (
    <div className="page">
      <div className="card">
        <div className="header">
          <div>
            <h2>Admin Dashboard</h2>
            <p className="sub">Overview metrics for the store-room inventory.</p>
          </div>
          <div className="topBtns">
            <button className="primary" onClick={() => onNavigate?.("products")}>
              Manage Products
            </button>
          </div>
        </div>

        {error && (
          <div style={{ margin: "0 18px 12px", padding: "12px 14px", borderRadius: 12, background: "#fef2f2", border: "1px solid #fca5a5", color: "#991b1b", fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ padding: "0 18px 18px" }}>
          {/* Metric cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            {[
              { label: "Products",    value: metrics.total },
              { label: "Categories",  value: metrics.categories },
              { label: "Active Items",value: metrics.active },
              { label: "Low Stock",   value: metrics.lowStock, danger: metrics.lowStock > 0 },
            ].map(({ label, value, danger }) => (
              <div key={label} className="card" style={{ padding: 16 }}>
                <div style={{ fontSize: 12, color: "#64748b" }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: danger ? "#dc2626" : undefined }}>
                  {loading ? "—" : value}
                </div>
              </div>
            ))}
          </div>

          {/* Recent items list */}
          <div style={{ marginTop: 24 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>Recent Items</h3>

            {loading ? (
              <p style={{ color: "#64748b" }}>Loading…</p>
            ) : items.length === 0 ? (
              <p style={{ color: "#64748b" }}>No inventory data yet.</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {items.slice(0, 10).map((it) => (
                  <li key={it._id || it.name} style={{ marginBottom: 6, fontSize: 14 }}>
                    <strong>{it.name}</strong>{" "}
                    <span style={{ color: "#64748b" }}>— {it.category}</span>
                    {typeof it.stock === "number" && it.stock <= 5 && (
                      <span style={{ marginLeft: 8, color: "#dc2626", fontSize: 12, fontWeight: 700 }}>
                        Low stock ({it.stock})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
