import React from "react";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-left">
          <div className="logo">KitchenK</div>
          <div className="small">© {new Date().getFullYear()} KitchenK — All rights reserved.</div>
        </div>
        <div className="footer-links">
          <a href="/">Home</a>
          <a href="/features">Features</a>
          <a href="/contact">Contact</a>
        </div>
      </div>
    </footer>
  );
}
