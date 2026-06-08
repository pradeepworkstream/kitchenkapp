// src/App.jsx
import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import AdminLogin     from "./pages/AdminLogin.jsx";
import Dashboard      from "./components/Dashboard.jsx";
import Orders         from "./pages/Orders.jsx";
import Users          from "./pages/Users.jsx";
import Reports        from "./pages/Reports.jsx";
import ShopPage       from "./pages/ShopPage.jsx";
import Products       from "./pages/Products.jsx";
import VendorSettings from "./pages/VendorSettings.jsx";
import Layout         from "./components/Layout.jsx";
import "./App.css";

function getRoleFromToken(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role || "user";
  } catch {
    return "user";
  }
}

const ADMIN_PAGES = {
  dashboard: Dashboard,
  products:  Products,
  shop:      ShopPage,
  orders:    Orders,
  users:     Users,
  reports:   Reports,
  settings:  VendorSettings,
};

export default function App() {
  const [token,  setToken]  = useState(() => localStorage.getItem("admin_token") || "");
  const [active, setActive] = useState("shop");

  const role    = token ? getRoleFromToken(token) : null;
  const isAdmin = role === "admin";

  useEffect(() => {
    const onStorage = () => {
      const t = localStorage.getItem("admin_token") || "";
      setToken(t);
      if (!t) setActive("shop");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const onLoginSuccess = () => {
    const t = localStorage.getItem("admin_token") || "";
    setToken(t);
    const r = getRoleFromToken(t);
    setActive(r === "admin" ? "dashboard" : "shop");
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    setToken("");
    setActive("shop");
  };

  // Not logged in — show login page
  if (!token) {
    return (
      <>
        <ToastContainer position="top-right" autoClose={3000} />
        <AdminLogin onLoginSuccess={onLoginSuccess} />
      </>
    );
  }

  // Staff-only shell (no sidebar)
  if (!isAdmin) {
    return (
      <>
        <ToastContainer position="top-right" autoClose={3000} />
        <div className="user-shell">
          <div className="user-topbar">
            <span className="user-brand">🍴 KitchenK</span>
            <div className="user-topbar-right">
              <span className="user-role-pill">Staff</span>
              <button className="user-logout" onClick={logout}>Sign Out</button>
            </div>
          </div>
          <ShopPage isAdmin={false} />
        </div>
      </>
    );
  }

  // Admin — full layout with sidebar
  const ActivePage = ADMIN_PAGES[active] ?? Dashboard;

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Layout active={active} setActive={setActive} onLogout={logout} isAdmin={isAdmin}>
        <ActivePage
          onNavigate={setActive}
          isAdmin={isAdmin}
        />
      </Layout>
    </>
  );
}
