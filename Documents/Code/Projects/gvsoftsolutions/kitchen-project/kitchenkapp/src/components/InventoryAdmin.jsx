// src/components/InventoryAdmin.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import "./InventoryAdmin.css";
import api from "../api/api.js";
import Pagination from "./Pagination.jsx";
import { VENDORS, VENDOR_CATEGORIES, ALL_CATEGORIES } from "../data/vendorCategories.js";

// ─── Constants ───────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  vendor:          "",
  category:        "",
  name:            "",
  brandOptionsText: "",
  regPrice:        "",
  stock:           "",
  sizeText:        "",
  isActive:        true,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const toBrandsText = (arr) =>
  Array.isArray(arr) ? arr.join(", ") : "";

// ─── Component ───────────────────────────────────────────────────────────────

export default function InventoryAdmin() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  // Server-side pagination
  const [page,  setPage]  = useState(1);
  const [pages, setPages] = useState(1);
  const LIMIT = 20;

  // Filters
  const [query,         setQuery]         = useState("");
  const [vendorFilter,  setVendorFilter]  = useState("");
  const [categoryFilter,setCategoryFilter] = useState("");

  // Create / Edit drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mode,       setMode]       = useState("create");
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);

  // Delete
  const [deletingId, setDeletingId] = useState(null);

  // ── Load from correct backend endpoint ──────────────────────────────────
  const load = async ({ p = page, q = query, cat = categoryFilter, vendor = vendorFilter } = {}) => {
    setLoading(true);
    try {
      const res = await api.get("/api/inventory/list", {
        params: { page: p, limit: LIMIT, search: q, category: cat, vendor },
      });
      if (!res.data?.success) throw new Error(res.data?.message || "Failed");
      setItems(res.data.data || []);
      setPage(res.data.page   || p);
      setPages(res.data.pages || 1);
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // Reload on page or vendor change
  useEffect(() => {
    load({ p: page, q: query, cat: categoryFilter, vendor: vendorFilter });
  }, [page, vendorFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce search + category + vendor
  useEffect(() => {
    const t = setTimeout(() => {
      load({ p: 1, q: query, cat: categoryFilter, vendor: vendorFilter });
    }, 350);
    return () => clearTimeout(t);
  }, [query, categoryFilter, vendorFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Client-side lists for vendors and categories (category options depend on vendor) ──────────
  // no remote category cache; categories are vendor-scoped via VENDOR_CATEGORIES

  // Vendor dropdown must show exactly these options
  const vendors = VENDORS;

  const categories = useMemo(() => {
    // when a vendor filter is selected, only show categories for that vendor
    if (vendorFilter) return VENDOR_CATEGORIES[vendorFilter] || [];
    // otherwise present combined list
    return ALL_CATEGORIES;
  }, [vendorFilter]);


  // ── Drawer helpers ───────────────────────────────────────────────────────
  const openCreate = () => { setMode("create"); setForm(EMPTY_FORM); setAddingCategory(false); setDrawerOpen(true); };

  const openEdit = (it) => {
    setMode("edit");
    setForm({
      vendor:           it.vendor       || "",
      category:         it.category     || "",
      name:             it.name         || "",
      brandOptionsText: toBrandsText(it.brandOptions || []),
      // unit intentionally omitted per product schema simplification
      regPrice:         String(it.regPrice ?? ""),
      stock:            String(it.stock  ?? ""),
      sizeText:         it.sizeText     || "",
      isActive:         it.isActive     ?? true,
      _id:              it._id,
    });
    setAddingCategory(!it.category || !categories.includes(it.category));
    setDrawerOpen(true);
  };

  const closeDrawer = () => { if (!saving) { setDrawerOpen(false); setForm(EMPTY_FORM); } };

  const setField = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const setCheck = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.checked }));

  // ── Save ─────────────────────────────────────────────────────────────────
  const onSave = async () => {
    if (!String(form.vendor || "").trim()) return toast.error("Vendor is required");
    if (!String(form.category || "").trim()) return toast.error("Category is required");
    if (!String(form.name     || "").trim()) return toast.error("Name is required");

    // Save minimal required fields as requested
    const payload = {
      vendor:   String(form.vendor || "").trim(),
      category: String(form.category).trim(),
      name:     String(form.name).trim(),
      stock:    form.stock === "" ? 0 : Number(form.stock),
    };

    setSaving(true);
    try {
      if (mode === "create") {
        // Use the inventory endpoint (not /api/products)
        const res = await api.post("/api/inventory", payload);
        if (!res.data?.success) throw new Error(res.data?.message || "Create failed");
        toast.success("Item created");
        // notify other views (Shop) to refresh
        try { window.dispatchEvent(new CustomEvent("inventory:changed", { detail: { action: "create", id: res.data.item?._id } })); } catch { /* ignore */ }
      } else {
        const res = await api.put(`/api/inventory/${form._id}`, payload);
        if (!res.data?.success) throw new Error(res.data?.message || "Update failed");
        toast.success("Item updated");
        try { window.dispatchEvent(new CustomEvent("inventory:changed", { detail: { action: "update", id: res.data.item?._id } })); } catch { /* ignore */ }
      }
      await load({ p: 1 });
      setDrawerOpen(false);
      setForm(EMPTY_FORM);
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) toast.error("Unauthorized. Please login again.");
      else toast.error(e?.response?.data?.message || e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const onDelete = async (it) => {
    if (!it?._id) return;
    if (!window.confirm(`Delete "${it.name}"?`)) return;

    setDeletingId(it._id);
    try {
      const res = await api.delete(`/api/inventory/${it._id}`);
      if (!res.data?.success) throw new Error(res.data?.message || "Delete failed");
      toast.success("Item deleted");
      try { window.dispatchEvent(new CustomEvent("inventory:changed", { detail: { action: "delete", id: it._id } })); } catch { /* ignore */ }
      await load({ p: 1 });
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) toast.error("Unauthorized. Please login again.");
      else toast.error(e?.response?.data?.message || e.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="invPage">
      <div className="invCard">
        {/* Header */}
        <div className="invTop">
          <div>
            <h2 className="invTitle">Inventory Admin</h2>
            <p className="invSub">Add / edit / delete inventory items.</p>
          </div>
          <button className="invPrimary" onClick={openCreate}>+ Add Item</button>
        </div>

        {/* Filters */}
        <div className="invFilters">
          <div className="invField">
            <label>Search</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or category…"
            />
          </div>

          <div className="invField">
            <label>Vendor</label>
            <select value={vendorFilter} onChange={(e) => { setVendorFilter(e.target.value); setCategoryFilter(""); setPage(1); }}>
              <option value="">All Vendors</option>
              {vendors.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          <div className="invField">
            <label>Category</label>
            <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="invStats">
            <div className="statPill">Total: <b>{items.length}</b></div>
          </div>
        </div>

        {/* Table */}
        <div className="invTableWrap">
          {loading ? (
            <div className="invStatus">Loading…</div>
          ) : items.length === 0 ? (
            <div className="invStatus">No items found.</div>
          ) : (
            <div className="invTableViewport">
              <table className="invTable">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Product</th>
                    <th>Stock</th>
                    {/* Unit column removed */}
                    <th className="invActionsCol">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it._id}>
                      <td className="tdMuted">{it.category}</td>
                      <td className="tdStrong">{it.name}</td>
                      <td>
                        {typeof it.stock === "number" ? (
                          <span style={{ color: it.stock <= 5 ? "#dc2626" : undefined, fontWeight: it.stock <= 5 ? 800 : undefined }}>
                            {it.stock}
                          </span>
                        ) : "—"}
                      </td>
                      {/* unit hidden by request */}
                      <td>
                        <div className="invActions">
                          <button className="btnGhost" onClick={() => openEdit(it)}>Edit</button>
                          <button
                            className="btnDanger"
                            disabled={deletingId === it._id}
                            onClick={() => onDelete(it)}
                          >
                            {deletingId === it._id ? "Deleting…" : "Delete"}
                          </button>
                        </div>
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

      {/* Drawer overlay */}
      <div className={`drawerOverlay ${drawerOpen ? "show" : ""}`} onClick={closeDrawer} />

      {/* Drawer */}
      <div className={`drawer ${drawerOpen ? "open" : ""}`}>
        <div className="drawerHeader">
          <div>
            <h3>{mode === "create" ? "Add Inventory Item" : "Edit Inventory Item"}</h3>
            <p className="drawerSub">Category and product name are required.</p>
          </div>
          <button className="drawerClose" onClick={closeDrawer} disabled={saving}>✕</button>
        </div>

        <div className="drawerBody">
          <div className="grid2">
            <div className="invField">
              <label>Vendor *</label>
              <select
                value={form.vendor || ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm((prev) => ({ ...prev, vendor: v }));
                  // reset category when vendor changes
                  setAddingCategory(false);
                  setForm((prev) => ({ ...prev, category: "" }));
                }}
              >
                <option value="">Select vendor</option>
                {vendors.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div className="invField">
              <label>Category *</label>
              {!addingCategory ? (
                <select
                  value={form.category ? (categories.includes(form.category) ? form.category : "__add__") : ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "__add__") {
                      setAddingCategory(true);
                      setForm((prev) => ({ ...prev, category: "" }));
                    } else {
                      setForm((prev) => ({ ...prev, category: v }));
                    }
                  }}
                  disabled={!form.vendor}
                >
                  <option value="">Select category</option>
                  {(form.vendor ? (VENDOR_CATEGORIES[form.vendor] || []) : []).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="__add__">+ Add new category...</option>
                </select>
              ) : (
                <input value={form.category} onChange={setField("category")} placeholder="e.g., Rice (type new)" />
              )}
            </div>

          </div>

          <div className="invField">
            <label>Product Name *</label>
            <input value={form.name} onChange={setField("name")} placeholder="e.g., Sonamasoori Rice" />
          </div>

          <div className="invField">
            <label>Brand Options (comma separated)</label>
            <input
              value={form.brandOptionsText}
              onChange={setField("brandOptionsText")}
              placeholder="e.g., Any, Royal, 777"
            />
          </div>

          <div className="grid2">
            <div className="invField">
              <label>Regular Price</label>
              <input type="number" inputMode="decimal" value={form.regPrice} onChange={setField("regPrice")} placeholder="0" />
            </div>
            <div className="invField">
              <label>Size Text</label>
              <input value={form.sizeText} onChange={setField("sizeText")} placeholder='e.g., "10lb"' />
            </div>
          </div>

          <div className="grid2">
            <div className="invField">
              <label>Stock</label>
              <input type="number" inputMode="numeric" value={form.stock} onChange={setField("stock")} placeholder="0" />
            </div>
            <div />
          </div>

          <div className="toggleRow">
            <input id="isActive" type="checkbox" checked={!!form.isActive} onChange={setCheck("isActive")} />
            <label htmlFor="isActive" className="toggleLabel">Active (show in inventory)</label>
          </div>
        </div>

        <div className="drawerFooter">
          <button className="btnGhost" onClick={closeDrawer} disabled={saving}>Cancel</button>
          <button className="invPrimary" onClick={onSave} disabled={saving}>
            {saving ? "Saving…" : mode === "create" ? "Create Item" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
