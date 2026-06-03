import React from "react";

export default function StepCard({ step, title, desc }) {
  return (
    <div className="step-card">
      <div className="step-num">{step}</div>
      <h4>{title}</h4>
      <p>{desc}</p>
    </div>
  );
}
