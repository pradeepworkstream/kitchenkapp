import React, { useEffect, useRef, useState } from "react";
import "./Layout.css";

export default function Topbar({ onToggleSidebar, onSearch, onLogout, token }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };

    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const handleToggle = () => setOpen((s) => !s);

  return (
    <header className="kk-topbar" ref={rootRef}>
      <div className="kk-left">
        <button className="kk-hamburger" onClick={onToggleSidebar} type="button" aria-label="Toggle sidebar">
          ☰
        </button>
        <div className="kk-search">
          <input
            placeholder="Search products, orders, users..."
            onChange={(e) => onSearch?.(e.target.value)}
            aria-label="Search"
          />
        </div>
      </div>

      <div className="kk-right">
        <button className="kk-icon" title="Notifications" aria-label="Notifications">🔔</button>

        <div className="kk-profile-root">
          <button
            type="button"
            className="kk-profile-btn"
            onClick={handleToggle}
            aria-haspopup="true"
            aria-expanded={open}
          >
            <span className="kk-avatar">A</span>
            <span className="kk-username">Admin</span>
            <span className={`kk-caret ${open ? "open" : ""}`}>▾</span>
          </button>

          <div className={`kk-profile-menu ${open ? "show" : ""}`} role="menu">
            <button className="kk-menu-item" type="button" role="menuitem" onClick={() => setOpen(false)}>
              Profile
            </button>
            <button
              className="kk-menu-item kk-menu-logout"
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onLogout?.();
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
