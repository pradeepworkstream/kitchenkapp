import React from "react";
import InventoryAdmin from "../components/InventoryAdmin.jsx";

export default function Products({ reorderCart, setReorderCart, userRole = "user" }) {
  // pass navigation or other props through if needed
  return <InventoryAdmin reorderCart={reorderCart} setReorderCart={setReorderCart} userRole={userRole} />;
}
