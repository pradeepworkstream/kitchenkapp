// src/App.jsx
import { useMemo, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import EmailForm from "./EmailForm.jsx";
import InventoryAdmin from "./InventoryAdmin.jsx";
import AdminLogin from "./AdminLogin.jsx";
import "./App.css";

export default function App() {
  const [active, setActive] = useState("email"); // "email" | "admin"

  const token = useMemo(() => localStorage.getItem("admin_token"), []);

  const onLoginSuccess = () => {
    // after login go to admin tab
    setActive("admin");
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    window.location.reload();
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="appShell">
        <div className="topNav">
          <div className="brand">KitchenK Admin</div>

          <div className="tabs">
            <button
              className={`tabBtn ${active === "email" ? "active" : ""}`}
              onClick={() => setActive("email")}
              type="button"
            >
              Email
            </button>

            <button
              className={`tabBtn ${active === "admin" ? "active" : ""}`}
              onClick={() => setActive("admin")}
              type="button"
            >
              Admin
            </button>
          </div>

          <div className="right">
            {localStorage.getItem("admin_token") ? (
              <button className="logoutBtn" type="button" onClick={logout}>
                Logout
              </button>
            ) : (
              <span className="hintSmall">Not logged in</span>
            )}
          </div>
        </div>

        <div className="appContent">
          {active === "email" ? (
            <EmailForm />
          ) : !localStorage.getItem("admin_token") ? (
            <div className="authWrap">
              <AdminLogin onLoginSuccess={onLoginSuccess} />
            </div>
          ) : (
            <InventoryAdmin />
          )}
        </div>
      </div>
    </>
  );
}