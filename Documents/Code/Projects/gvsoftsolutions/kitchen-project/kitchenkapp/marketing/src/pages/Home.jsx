import React from "react";
import { motion } from "framer-motion";
import FeatureCard from "../components/FeatureCard.jsx";
import TestimonialCard from "../components/TestimonialCard.jsx";
import Button from "../components/Button.jsx";

export default function Home() {
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <motion.h1 initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}>
            KitchenK — Smart inventory and vendor orders for kitchens
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            Track stock, automate reorders, and send vendor orders via WhatsApp or Email — all from one dashboard built for restaurants.
          </motion.p>
          <div style={{ marginTop: 18 }}>
            <Button href="/contact">Get Started Free</Button>
          </div>
        </div>

        <motion.div className="hero-mockup" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6 }}>
          <img src="/assets/dashboard-mockup.svg" alt="Dashboard mockup" />
        </motion.div>
      </section>

      <section className="social-proof">
        <div className="trusted">Trusted by 500+ restaurants</div>
      </section>

      <section className="benefits">
        <FeatureCard title="Track Inventory" desc="Real-time stock levels, batch tracking and reporting." />
        <FeatureCard title="Order from Vendors" desc="Create vendor orders instantly and send via WhatsApp or Email." />
        <FeatureCard title="WhatsApp Integration" desc="One-click reorder messages to vendors using WhatsApp Business API." />
      </section>

      <section className="highlights">
        <div className="highlight-row">
          <div className="highlight-text">
            <h3>Real-time insights</h3>
            <p>Monitor stock trends and get low-stock alerts so you never run out during service.</p>
          </div>
          <div className="highlight-image"><img src="/assets/dashboard-mockup.svg" alt="Insights" /></div>
        </div>
      </section>

      <section className="testimonials">
        <TestimonialCard author="Ravi, Head Chef" quote="KitchenK cut our ordering time in half — reliable and simple." />
        <TestimonialCard author="Meera, Restaurant Owner" quote="The WhatsApp reorder feature is a game changer for our supply chain." />
      </section>
    </div>
  );
}
