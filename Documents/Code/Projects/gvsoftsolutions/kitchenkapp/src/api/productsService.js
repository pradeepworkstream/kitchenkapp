import api from "./api.js";

const list = async ({ page = 1, limit = 20, search = "", category = "", stock = "all" } = {}) => {
  const res = await api.get("/api/products", {
    params: { page, limit, search, category, stock },
  });
  return res.data;
};

const metrics = async () => {
  const res = await api.get("/api/metrics");
  return res.data;
};

const recentOrders = async ({ limit = 5 } = {}) => {
  const res = await api.get("/api/orders", { params: { limit } });
  return res.data;
};

export default { list, metrics, recentOrders };
