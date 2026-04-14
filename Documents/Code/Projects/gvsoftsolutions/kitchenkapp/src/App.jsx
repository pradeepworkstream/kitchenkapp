// src/App.jsx
import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import InventoryAdmin from "./components/InventoryAdmin.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Orders from "./pages/Orders.jsx";
import Users from "./pages/Users.jsx";
import Reports from "./pages/Reports.jsx";
import Layout from "./components/Layout.jsx";
import Products from "./pages/Products.jsx";
import "./App.css";

export default function App() {
  const [active, setActive] = useState("dashboard");
  const [token, setToken] = useState(localStorage.getItem("admin_token") || "");

  // keep token in sync (if someone clears localStorage)
  useEffect(() => {
    const onStorage = () => setToken(localStorage.getItem("admin_token") || "");
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const onLoginSuccess = () => {
    const t = localStorage.getItem("admin_token") || "";
    setToken(t);
    setActive("dashboard");
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    setToken("");
    setActive("dashboard");
  };

  // ✅ FULL APP LOCK: if not logged in → only login page
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

  // App-level navigation values: dashboard, products, orders, users, reports, email
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />

      {
        // render a single active page so Layout can forward props to it
      }
      <Layout active={active} setActive={setActive} onLogout={logout}>
        {
          (function () {
            if (active === "dashboard") return <Dashboard />;
            if (active === "products") return <Products />;
            if (active === "orders") return <Orders />;
            if (active === "users") return <Users />;
            if (active === "reports") return <Reports />;
            return <Dashboard />;
          })()
        }
      </Layout>
    </>
  );
}