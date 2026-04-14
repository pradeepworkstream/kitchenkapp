import React from "react";

export default function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;

  const prev = () => onChange(Math.max(1, page - 1));
  const next = () => onChange(Math.min(pages, page + 1));

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
      <button onClick={() => onChange(1)} disabled={page === 1} className="secondary">
        First
      </button>
      <button onClick={prev} disabled={page === 1} className="secondary">
        Prev
      </button>
      <div style={{ fontWeight: 800 }}>
        {page} / {pages}
      </div>
      <button onClick={next} disabled={page === pages} className="secondary">
        Next
      </button>
      <button onClick={() => onChange(pages)} disabled={page === pages} className="secondary">
        Last
      </button>
    </div>
  );
}
