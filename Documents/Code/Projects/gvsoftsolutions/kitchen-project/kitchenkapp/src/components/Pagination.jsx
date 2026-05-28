// src/components/Pagination.jsx
export default function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "12px 18px 18px" }}>
      <button onClick={() => onChange(1)} disabled={page === 1} className="secondary">First</button>
      <button onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1} className="secondary">Prev</button>
      <span style={{ fontWeight: 800, fontSize: 13 }}>{page} / {pages}</span>
      <button onClick={() => onChange(Math.min(pages, page + 1))} disabled={page === pages} className="secondary">Next</button>
      <button onClick={() => onChange(pages)} disabled={page === pages} className="secondary">Last</button>
    </div>
  );
}
