import React, { useEffect, useMemo, useState } from "react";
import api from "../api/api.js";
import "./Dashboard.css";

export default function Dashboard({ onNavigate }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get("/api/inventory/list");
        if (!res.data?.success) throw new Error(res.data?.message || "Failed");
        if (!mounted) return;
        setItems(res.data.items || []);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const total = items.length;
    const categories = new Set((items || []).map((i) => i.category).filter(Boolean));
    const active = items.filter((i) => i.isActive !== false).length;
    // lowStock: items with numeric `stock` field <= 5 (if present)
    const lowStock = items.filter((i) => typeof i.stock === "number" && i.stock <= 5).length;
    return { total, categories: categories.size, active, lowStock };
  }, [items]);

  return (
    <div className="page">
      <div className="card">
        <div className="header">
          <div>
            <h2>Admin Dashboard</h2>
            <p className="sub">Overview metrics for inventory and quick links.</p>
          </div>

          <div className="topBtns">
            <button className="primary" onClick={() => onNavigate?.("products")}>View Products</button>
          </div>
        </div>

        <div style={{ padding: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            <div className="card" style={{ padding: 12 }}>
              <div style={{ fontSize: 12, color: "#64748b" }}>Products</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{loading ? "—" : metrics.total}</div>
            </div>

            <div className="card" style={{ padding: 12 }}>
              <div style={{ fontSize: 12, color: "#64748b" }}>Categories</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{loading ? "—" : metrics.categories}</div>
            </div>

            <div className="card" style={{ padding: 12 }}>
              <div style={{ fontSize: 12, color: "#64748b" }}>Active Items</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{loading ? "—" : metrics.active}</div>
            </div>

            <div className="card" style={{ padding: 12 }}>
              <div style={{ fontSize: 12, color: "#64748b" }}>Low Stock</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: metrics.lowStock > 0 ? "#dc2626" : undefined }}>
                {loading ? "—" : metrics.lowStock}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>Recent Items</h3>
            <p style={{ marginTop: 8, color: "#64748b" }}>Latest inventory entries (by returned order)</p>

            <div style={{ marginTop: 12 }}>
              {loading ? (
                <div>Loading…</div>
              ) : items.length === 0 ? (
                <div>No inventory data.</div>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {items.slice(0, 10).map((it) => (
                    <li key={it._id || it.name} style={{ marginBottom: 6 }}>
                      <strong>{it.name}</strong> <span style={{ color: "#64748b" }}>— {it.category}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

