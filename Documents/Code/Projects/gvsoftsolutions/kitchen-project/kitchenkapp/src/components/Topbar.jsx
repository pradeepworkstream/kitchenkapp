// src/components/Topbar.jsx
import { useEffect, useRef, useState } from "react";
import "./Layout.css";

export default function Topbar({ onToggleSidebar, onLogout, pageTitle = "" }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <header className="kk-topbar" ref={rootRef}>
      <div className="kk-left">
        <button
          className="kk-hamburger"
          onClick={onToggleSidebar}
          type="button"
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
        {pageTitle && <span className="kk-page-title">{pageTitle}</span>}
      </div>

      <div className="kk-right">
        <div className="kk-profile-root">
          <button
            type="button"
            className="kk-profile-btn"
            onClick={() => setOpen((s) => !s)}
            aria-haspopup="true"
            aria-expanded={open}
          >
            <span className="kk-avatar">A</span>
            <span className="kk-username">Admin</span>
            <span className={`kk-caret ${open ? "open" : ""}`}>▾</span>
          </button>

          <div className={`kk-profile-menu ${open ? "show" : ""}`} role="menu">
            <button
              className="kk-menu-item kk-menu-logout"
              type="button"
              role="menuitem"
              onClick={() => { setOpen(false); onLogout?.(); }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
