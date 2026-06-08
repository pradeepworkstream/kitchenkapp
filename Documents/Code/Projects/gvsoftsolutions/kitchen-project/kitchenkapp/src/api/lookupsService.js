import api from "./api.js";

const vendors = async () => {
  const res = await api.get("/api/lookups/vendors");
  return res.data;
};

const createVendor = async (name) => {
  const res = await api.post("/api/lookups/vendors", { name });
  return res.data;
};

const updateVendor = async (id, name) => {
  const res = await api.put(`/api/lookups/vendors/${id}`, { name });
  return res.data;
};

const deleteVendor = async (id) => {
  const res = await api.delete(`/api/lookups/vendors/${id}`);
  return res.data;
};

const categories = async ({ vendor = "" } = {}) => {
  const res = await api.get("/api/lookups/categories", { params: { vendor } });
  return res.data;
};

const createCategory = async ({ vendor, name }) => {
  const res = await api.post("/api/lookups/categories", { vendor, name });
  return res.data;
};

const updateCategory = async (id, vendor, name) => {
  const res = await api.put(`/api/lookups/categories/${id}`, { vendor, name });
  return res.data;
};

const deleteCategory = async (id) => {
  const res = await api.delete(`/api/lookups/categories/${id}`);
  return res.data;
};

const units = async () => {
  const res = await api.get("/api/lookups/units");
  return res.data;
};

const createUnit = async (name) => {
  const res = await api.post("/api/lookups/units", { name });
  return res.data;
};

const updateUnit = async (id, name) => {
  const res = await api.put(`/api/lookups/units/${id}`, { name });
  return res.data;
};

const deleteUnit = async (id) => {
  const res = await api.delete(`/api/lookups/units/${id}`);
  return res.data;
};

const quantities = async () => {
  const res = await api.get("/api/lookups/quantities");
  return res.data;
};

const createQuantity = async (value) => {
  const res = await api.post("/api/lookups/quantities", { value });
  return res.data;
};

const updateQuantity = async (id, value) => {
  const res = await api.put(`/api/lookups/quantities/${id}`, { value });
  return res.data;
};

const deleteQuantity = async (id) => {
  const res = await api.delete(`/api/lookups/quantities/${id}`);
  return res.data;
};

export default {
  vendors,
  createVendor,
  updateVendor,
  deleteVendor,
  categories,
  createCategory,
  updateCategory,
  deleteCategory,
  units,
  createUnit,
  updateUnit,
  deleteUnit,
  quantities,
  createQuantity,
  updateQuantity,
  deleteQuantity,
};
