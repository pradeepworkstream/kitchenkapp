import React from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="nav">
      <div className="nav-inner container">
        <Link to="/" className="logo">KitchenK</Link>
        <nav className="nav-links">
          <Link to="/features">Features</Link>
          <Link to="/how-it-works">How it Works</Link>
          <Link to="/contact">Contact</Link>
          <a className="btn-login" href="/login">Login</a>
        </nav>
      </div>
    </header>
  );
}
