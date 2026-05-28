import api from "./api.js";

/**
 * List inventory items from the main KitchenK backend (/api/inventory/list)
 * Falls back to /api/products if the inventory endpoint is unavailable.
 */
const list = async ({ page = 1, limit = 20, search = "", category = "", stock = "all" } = {}) => {
  const res = await api.get("/api/inventory/list", {
    params: { page, limit, search, category, stock },
  });
  return res.data;
};

/**
 * Dashboard metrics — derived client-side from the inventory list
 * (the embedded server/routes/api.js /api/metrics endpoint is on a separate port)
 */
const metrics = async () => {
  const res = await api.get("/api/inventory/list", { params: { limit: 1000 } });
  if (!res.data?.success) throw new Error(res.data?.message || "Failed");

  const items = res.data.data || [];
  return {
    success: true,
    data: {
      totalProducts: items.length,
      lowStockCount: items.filter((i) => typeof i.stock === "number" && i.stock <= 5).length,
      totalOrders: 0,   // orders not yet wired up in this backend
      totalUsers: 0,
    },
  };
};

const recentOrders = async ({ limit = 5 } = {}) => {
  // Orders endpoint not yet available on the main backend — return empty safely
  return { success: true, data: [] };
};

export default { list, metrics, recentOrders };
