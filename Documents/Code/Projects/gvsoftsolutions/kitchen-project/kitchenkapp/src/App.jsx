// src/App.jsx
import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import AdminLogin    from "./pages/AdminLogin.jsx";
import Dashboard     from "./components/Dashboard.jsx";
import Orders        from "./pages/Orders.jsx";
import Users         from "./pages/Users.jsx";
import Reports       from "./pages/Reports.jsx";
import ShopPage      from "./pages/ShopPage.jsx";
import Products      from "./pages/Products.jsx";
import Layout        from "./components/Layout.jsx";
import "./App.css";

// Decode role from JWT without a library
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
};

const USER_PAGES = {
  shop: ShopPage,
};

export default function App() {
  const [token, setToken]   = useState(() => localStorage.getItem("admin_token") || "");
  const [active, setActive] = useState("shop");

  const role    = token ? getRoleFromToken(token) : null;
  const isAdmin = role === "admin";

  // Keep token in sync (401 auto-clear, other tabs)
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

  // Cart checkout handler — passed down to ShopPage
  const handleReorder = (cartItems, method = "whatsapp") => {
    if (cartItems.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    // Navigate to a reorder flow or trigger WhatsApp/Email
    // For now navigate to dashboard (admin) or show toast (user)
    if (isAdmin) {
      setActive("dashboard");
      toast.success(`Cart ready — ${cartItems.length} item(s). Use the Dashboard to send.`);
    } else {
      toast.info("Your order request has been noted. Staff will process it shortly.");
    }
  };

  if (!token) {
    return (
      <>
        <ToastContainer position="top-right" autoClose={3000} />
        <div className="authWrap">
          <AdminLogin onLoginSuccess={onLoginSuccess} />
        </div>
      </>
    );
  }

  // Users only see ShopPage, no sidebar
  if (!isAdmin) {
    return (
      <>
        <ToastContainer position="top-right" autoClose={3000} />
        <div className="user-shell">
          <div className="user-topbar">
            <span className="user-brand">🍴 KitchenK</span>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="user-role-pill">Staff</span>
              <button className="user-logout" onClick={logout}>Logout</button>
            </div>
          </div>
          <ShopPage isAdmin={false} onReorder={handleReorder} />
        </div>
      </>
    );
  }

  // Admin — full layout with sidebar
  const PAGES = ADMIN_PAGES;
  const ActivePage = PAGES[active] ?? Dashboard;

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Layout active={active} setActive={setActive} onLogout={logout} isAdmin={isAdmin}>
        <ActivePage
          onNavigate={setActive}
          isAdmin={isAdmin}
          onReorder={handleReorder}
        />
      </Layout>
    </>
  );
}
