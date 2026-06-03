import React, { useEffect, useState } from "react";
import api from "../api/api.js";

export default function Reports() {
  const [report, setReport] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/api/analytics/report");
        if (!cancelled) setReport(res.data?.data || {});
      } catch (err) {
        console.error("Failed to load report", err?.response?.data || err.message || err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div>
      <h1>Reports</h1>
      <p>Sales and inventory reports.</p>

      {loading ? (
        <div>Loading analytics…</div>
      ) : (
        <div>
          {Object.keys(report).length === 0 ? (
            <div>No analytics data yet.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: 8 }}>Variant</th>
                  <th style={{ textAlign: "right", padding: 8 }}>Page Views</th>
                  <th style={{ textAlign: "right", padding: 8 }}>Add to Cart</th>
                  <th style={{ textAlign: "right", padding: 8 }}>Checkout</th>
                  <th style={{ textAlign: "right", padding: 8 }}>Add Rate</th>
                  <th style={{ textAlign: "right", padding: 8 }}>Checkout Rate</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(report).map(([variant, v]) => (
                  <tr key={variant}>
                    <td style={{ padding: 8 }}>{variant}</td>
                    <td style={{ padding: 8, textAlign: "right" }}>{v.page_view}</td>
                    <td style={{ padding: 8, textAlign: "right" }}>{v.add_to_cart}</td>
                    <td style={{ padding: 8, textAlign: "right" }}>{v.checkout}</td>
                    <td style={{ padding: 8, textAlign: "right" }}>{(v.add_rate * 100).toFixed(2)}%</td>
                    <td style={{ padding: 8, textAlign: "right" }}>{(v.checkout_rate * 100).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
