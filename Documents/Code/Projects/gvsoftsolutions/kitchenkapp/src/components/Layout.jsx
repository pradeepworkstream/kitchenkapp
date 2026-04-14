import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "./Layout.css";

export default function Layout({ children, active, setActive, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");

  // Allow the active page to receive an `onNavigate` prop
  const childWithNav = React.isValidElement(children)
    ? React.cloneElement(children, { onNavigate: setActive, search })
    : children;

  return (
    <div className={`kk-layout ${collapsed ? "sidebar-collapsed" : ""}`}>
      <Sidebar active={active} onNavigate={setActive} collapsed={collapsed} />

      <div className="kk-main">
        <Topbar
          onToggleSidebar={() => setCollapsed((s) => !s)}
          onSearch={setSearch}
          onLogout={onLogout}
        />

        <main className="kk-content">
          {childWithNav}
        </main>
      </div>
    </div>
  );
}
