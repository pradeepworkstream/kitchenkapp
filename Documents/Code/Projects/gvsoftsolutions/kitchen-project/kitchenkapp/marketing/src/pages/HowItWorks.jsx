import React from "react";
import StepCard from "../components/StepCard.jsx";

export default function HowItWorks() {
  return (
    <div className="how-page">
      <h2>How It Works</h2>
      <div className="steps">
        <StepCard step={1} title="Add your inventory" desc="Import or add items with units, brands and stock levels." />
        <StepCard step={2} title="Staff places orders" desc="Kitchen staff select items needed during service." />
        <StepCard step={3} title="Reorder to vendor" desc="Send the reorder to your vendor via WhatsApp or Email." />
      </div>
    </div>
  );
}
