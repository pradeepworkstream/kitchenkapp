// src/components/Layout.jsx
import { useState } from "react";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";
import "./Layout.css";

const PAGE_TITLES = {
  dashboard: "Dashboard",
  shop:      "Shop & Cart",
  products:  "Products",
  orders:    "Purchase Orders",
  users:     "Users",
  reports:   "Reports",
  settings:  "Vendor Settings",
};

export default function Layout({ children, active, setActive, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeOnMobile = () => setSidebarOpen(false);

  return (
    <div className={`kk-layout ${sidebarOpen ? "kk-sidebar-open" : ""}`}>
      <Sidebar
        active={active}
        onNavigate={(key) => { setActive(key); closeOnMobile(); }}
        sidebarOpen={sidebarOpen}
      />

      {/* Mobile overlay — clicking it closes the sidebar */}
      {sidebarOpen && (
        <div className="kk-overlay" onClick={closeOnMobile} aria-hidden="true" />
      )}

      <div className="kk-main">
        <Topbar
          pageTitle={PAGE_TITLES[active] || ""}
          onToggleSidebar={() => setSidebarOpen((s) => !s)}
          onLogout={onLogout}
        />
        <main className="kk-content">
          {children}
        </main>
      </div>
    </div>
  );
}
