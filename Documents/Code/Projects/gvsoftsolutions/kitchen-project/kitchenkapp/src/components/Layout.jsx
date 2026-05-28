// src/components/Layout.jsx
import { useState } from "react";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";
import "./Layout.css";

export default function Layout({ children, active, setActive, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`kk-layout ${collapsed ? "sidebar-collapsed" : ""}`}>
      <Sidebar active={active} onNavigate={setActive} collapsed={collapsed} />

      <div className="kk-main">
        <Topbar
          onToggleSidebar={() => setCollapsed((s) => !s)}
          onLogout={onLogout}
        />
        <main className="kk-content">
          {children}
        </main>
      </div>
    </div>
  );
}
