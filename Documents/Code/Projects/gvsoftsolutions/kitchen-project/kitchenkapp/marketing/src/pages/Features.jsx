import React from "react";
import FeatureCard from "../components/FeatureCard.jsx";

const features = [
  { title: "Real-time inventory tracking", icon: "📊" },
  { title: "One-click vendor reordering", icon: "🛒" },
  { title: "WhatsApp & Email notifications", icon: "💬" },
  { title: "Admin dashboard & reports", icon: "📈" },
  { title: "Multi-user staff access", icon: "👥" },
  { title: "Low stock alerts", icon: "🔔" },
];

export default function Features() {
  return (
    <div className="features-page">
      <h2>Features</h2>
      <div className="features-grid">
        {features.map((f) => (
          <FeatureCard key={f.title} title={f.title} desc="Designed for commercial kitchens." icon={f.icon} />
        ))}
      </div>
    </div>
  );
}
