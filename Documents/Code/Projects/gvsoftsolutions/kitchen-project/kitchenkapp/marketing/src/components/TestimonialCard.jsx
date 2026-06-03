import React from "react";

export default function TestimonialCard({ author, quote }) {
  return (
    <div className="testi-card">
      <blockquote>“{quote}”</blockquote>
      <div className="testi-author">— {author}</div>
    </div>
  );
}
