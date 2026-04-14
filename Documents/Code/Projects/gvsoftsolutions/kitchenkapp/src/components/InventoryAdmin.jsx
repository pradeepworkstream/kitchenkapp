// src/InventoryAdmin.jsx
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import "./InventoryAdmin.css";
import api from "../api/api.js";
import productsService from "../api/productsService.js";
import Pagination from "./Pagination.jsx";



const emptyForm = {
  category: "",
  name: "",
  brandOptionsText: "", // comma separated
  unit: "",
  regPrice: "",
  stock: "",
  sizeText: "",
  isActive: true,
};

const toBrandsArray = (text) =>
  String(text || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

const toBrandsText = (arr) => (Array.isArray(arr) ? arr.join(", ") : "");

// ✅ Token helper
const getAuthHeaders = () => {
  const token = localStorage.getItem("admin_token"); // <-- stored after login
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
};

export default function InventoryAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // server-side pagination
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit, setLimit] = useState(20);

  // UI state
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("all");

  // Create/Edit
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mode, setMode] = useState("create"); // create | edit
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Delete
  const [deletingId, setDeletingId] = useState(null);

  const load = async ({ p = page, q = query, cat = categoryFilter, stock = stockFilter } = {}) => {
    setLoading(true);
    try {
      const res = await productsService.list({ page: p, limit, search: q, category: cat, stock });
      if (!res?.success) throw new Error(res?.message || "Failed to load products");
      setItems(res.data || []);
      setPage(res.page || p);
      setPages(res.pages || 1);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({ p: page, q: query, cat: categoryFilter, stock: stockFilter });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, stockFilter]);

  // debounce search and category
  useEffect(() => {
    const t = setTimeout(() => load({ p: 1, q: query, cat: categoryFilter, stock: stockFilter }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, categoryFilter, stockFilter]);

  const categories = useMemo(() => {
    const set = new Set();
    (items || []).forEach((it) => set.add(it.category || ""));
    return ["", ...Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b))];
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (items || [])
      .filter((it) => (categoryFilter === "" ? true : it.category === categoryFilter))
      .filter((it) => {
        if (!q) return true;
        const hay = `${it.category || ""} ${it.name || ""} ${(it.brandOptions || []).join(" ")} ${it.unit || ""}`
          .toLowerCase()
          .trim();
        return hay.includes(q);
      })
      .sort((a, b) =>
        (a.category || "") === (b.category || "")
          ? (a.name || "").localeCompare(b.name || "")
          : (a.category || "").localeCompare(b.category || "")
      );
  }, [items, query, categoryFilter]);

  const openCreate = () => {
    setMode("create");
    setForm(emptyForm);
    setDrawerOpen(true);
  };

  const openEdit = (it) => {
    setMode("edit");
    setForm({
      category: it.category || "",
      name: it.name || "",
      brandOptionsText: toBrandsText(it.brandOptions || []),
      unit: it.unit || "",
      regPrice: String(it.regPrice ?? ""),
      stock: String(it.stock ?? ""),
      sizeText: it.sizeText || "",
      isActive: it.isActive ?? true,
      _id: it._id, // keep for update
    });
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    if (saving) return;
    setDrawerOpen(false);
    setForm(emptyForm);
  };

  const validate = () => {
    if (!String(form.category || "").trim()) return "Category is required.";
    if (!String(form.name || "").trim()) return "Name is required.";
    return null;
  };

  const onSave = async () => {
    const err = validate();
    if (err) return toast.error(err);

    const payload = {
      category: String(form.category).trim(),
      name: String(form.name).trim(),
      brandOptions: toBrandsArray(form.brandOptionsText),
      unit: String(form.unit || "").trim(),
      regPrice: form.regPrice === "" ? 0 : Number(form.regPrice),
      stock: form.stock === "" ? 0 : Number(form.stock),
      sizeText: String(form.sizeText || "").trim(),
      isActive: !!form.isActive,
    };

    const authHeaders = getAuthHeaders();
    if (!authHeaders) return toast.error("Admin login required (token missing).");

    setSaving(true);
    try {
      if (mode === "create") {
        const res = await api.post("/api/products", payload, { headers: authHeaders });
        if (!res.data?.success) throw new Error(res.data?.message || "Create failed");
        toast.success("Item created");
      } else {
        const id = form._id;
        const res = await api.put(`/api/products/${id}`, payload, { headers: authHeaders });
        if (!res.data?.success) throw new Error(res.data?.message || "Update failed");
        toast.success("Item updated");
      }
      await load({ p: 1 });
      setDrawerOpen(false);
      setForm(emptyForm);
    } catch (e) {
      console.error(e);
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        toast.error("Unauthorized. Please login again.");
      } else {
        toast.error(e?.response?.data?.message || e.message || "Save failed");
      }
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (it) => {
    if (!it?._id) return;
    const ok = window.confirm(`Delete "${it.name}"?`);
    if (!ok) return;

    const authHeaders = getAuthHeaders();
    if (!authHeaders) return toast.error("Admin login required (token missing).");

    setDeletingId(it._id);
    try {
      const res = await api.delete(`/api/products/${it._id}`, { headers: authHeaders });
      if (!res.data?.success) throw new Error(res.data?.message || "Delete failed");
      toast.success("Item deleted");
      await load({ p: 1 });
    } catch (e) {
      console.error(e);
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        toast.error("Unauthorized. Please login again.");
      } else {
        toast.error(e?.response?.data?.message || e.message || "Delete failed");
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="invPage">
      <div className="invCard">
        <div className="invTop">
          <div>
            <h2 className="invTitle">Inventory Admin</h2>
            <p className="invSub">Add / edit / delete inventory items (MongoDB).</p>
          </div>

          <button className="invPrimary" onClick={openCreate}>
            + Add Item
          </button>
        </div>

        <div className="invFilters">
          <div className="invField">
            <label>Search</label>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or category…" />
          </div>

          <div className="invField">
            <label>Category</label>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map((c) => (
                c && (
                  <option key={c} value={c}>
                    {c}
                  </option>
                )
              ))}
            </select>
          </div>

          <div className="invField">
            <label>Stock</label>
            <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="low">Low (&le;5)</option>
              <option value="out">Out of stock</option>
            </select>
          </div>

          <div className="invStats">
            <div className="statPill">
              Total: <b>{items.length}</b>
            </div>
            <div className="statPill">
              Showing: <b>{filtered.length}</b>
            </div>
          </div>
        </div>

        <div className="invTableWrap">
          {loading ? (
            <div className="invStatus">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="invStatus">No items found.</div>
          ) : (
            <div className="invTableViewport">
              <table className="invTable">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Product</th>
                    <th>Brand Options</th>
                    <th>Stock</th>
                    <th>Unit</th>
                    <th>Status</th>
                    <th className="invActionsCol">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((it) => (
                    <tr key={it._id}>
                      <td className="tdMuted">{it.category}</td>
                      <td className="tdStrong">{it.name}</td>
                      <td className="tdSmall">{(it.brandOptions || []).join(", ") || "-"}</td>
                      <td>
                        {typeof it.stock === "number" ? (
                          <span className={`stockBadge ${it.stock <= 5 ? "low" : ""}`}>{it.stock}</span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="tdSmall">{it.unit || "-"}</td>
                      <td>
                        <span className={`badge ${it.isActive ? "on" : "off"}`}>{it.isActive ? "Active" : "Inactive"}</span>
                      </td>
                      <td className="invActions">
                        <button className="btnGhost" onClick={() => openEdit(it)}>
                          Edit
                        </button>
                        <button className="btnDanger" disabled={deletingId === it._id} onClick={() => onDelete(it)}>
                          {deletingId === it._id ? "Deleting…" : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Pagination page={page} pages={pages} onChange={(p) => setPage(p)} />
      </div>

      {/* Drawer */}
      <div className={`drawerOverlay ${drawerOpen ? "show" : ""}`} onClick={closeDrawer} />
      <div className={`drawer ${drawerOpen ? "open" : ""}`}>
        <div className="drawerHeader">
          <div>
            <h3>{mode === "create" ? "Add Inventory Item" : "Edit Inventory Item"}</h3>
            <p className="drawerSub">Fields: category + product name required.</p>
          </div>
          <button className="drawerClose" onClick={closeDrawer} disabled={saving} title="Close">
            ✕
          </button>
        </div>

        <div className="drawerBody">
          <div className="grid2">
            <div className="invField">
              <label>Category *</label>
              <input
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                placeholder="e.g., Rice"
              />
            </div>

            <div className="invField">
              <label>Unit</label>
              <input
                value={form.unit}
                onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
                placeholder="e.g., LB / Bags / Packs"
              />
            </div>
          </div>

          <div className="invField">
            <label>Product Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g., Sonamasoori Rice"
            />
          </div>

          <div className="invField">
            <label>Brand Options (comma separated)</label>
            <input
              value={form.brandOptionsText}
              onChange={(e) => setForm((p) => ({ ...p, brandOptionsText: e.target.value }))}
              placeholder="e.g., Any, Royal, 777"
            />
          </div>

          <div className="grid2">
            <div className="invField">
              <label>Regular Price (optional)</label>
              <input
                type="number"
                inputMode="decimal"
                value={form.regPrice}
                onChange={(e) => setForm((p) => ({ ...p, regPrice: e.target.value }))}
                placeholder="0"
              />
            </div>

            <div className="invField">
              <label>Size Text (optional)</label>
              <input
                value={form.sizeText}
                onChange={(e) => setForm((p) => ({ ...p, sizeText: e.target.value }))}
                placeholder='e.g., "10lb", "28oz"'
              />
            </div>
          </div>

          <div className="grid2">
            <div className="invField">
              <label>Stock</label>
              <input
                type="number"
                inputMode="numeric"
                value={form.stock}
                onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div />
          </div>

          <div className="toggleRow">
            <input
              id="isActive"
              type="checkbox"
              checked={!!form.isActive}
              onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
            />
            <label htmlFor="isActive" className="toggleLabel">
              Active (show in inventory)
            </label>
          </div>
        </div>

        <div className="drawerFooter">
          <button className="btnGhost" onClick={closeDrawer} disabled={saving}>
            Cancel
          </button>
          <button className="invPrimary" onClick={onSave} disabled={saving}>
            {saving ? "Saving…" : mode === "create" ? "Create Item" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}