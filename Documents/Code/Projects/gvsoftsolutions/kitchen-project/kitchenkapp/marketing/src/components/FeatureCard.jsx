import React from "react";

export default function FeatureCard({ title, desc, icon }) {
  return (
    <div className="feature-card">
      <div className="feature-icon">{icon || "✨"}</div>
      <h4>{title}</h4>
      <p>{desc}</p>
    </div>
  );
}
