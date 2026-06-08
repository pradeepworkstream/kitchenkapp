// src/components/InventoryAdmin.jsx
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import "./InventoryAdmin.css";
import api from "../api/api.js";
import lookupsService from "../api/lookupsService.js";
import Pagination from "./Pagination.jsx";
import { VENDORS, VENDOR_CATEGORIES, ALL_CATEGORIES, DEFAULT_UNITS, DEFAULT_QUANTITIES } from "../data/vendorCategories.js";

// Prefix relative image paths with the backend base URL
const BACKEND = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/+$/, "");
function getImageUrl(imageUrl) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("http")) return imageUrl;
  return `${BACKEND}${imageUrl}`;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  vendor:         "",
  category:       "",
  name:           "",
  quantityNeeded: 1,
  unit:           "Box",
  imageUrl:       "",
  imageFile:      null,
  imagePreview:   "",
};

// ─── Inline-add sub-component ─────────────────────────────────────────────────

function InlineAdd({ placeholder, onAdd, onCancel, isLoading }) {
  const [text, setText] = useState("");
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = () => {
    const val = text.trim();
    if (!val) return;
    onAdd(val);
  };

  return (
    <div className="inlineAdd">
      <input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); submit(); }
          if (e.key === "Escape") onCancel();
        }}
        placeholder={placeholder}
        disabled={isLoading}
      />
      <button className="inlineAddBtn" onClick={submit} disabled={isLoading || !text.trim()}>
        {isLoading ? "…" : "Add"}
      </button>
      <button className="inlineCancelBtn" onClick={onCancel} disabled={isLoading}>✕</button>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function InventoryAdmin() {
  // ── Inventory list ──────────────────────────────────────────────────────
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const LIMIT = 20;

  // ── Filter state ─────────────────────────────────────────────────────────
  const [query,          setQuery]          = useState("");
  const [vendorFilter,   setVendorFilter]   = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // ── Lookup data ──────────────────────────────────────────────────────────
  const [vendors,    setVendors]    = useState(VENDORS);
  const [categories, setCategories] = useState([]);
  const [units,      setUnits]      = useState(DEFAULT_UNITS);
  const [quantities, setQuantities] = useState(DEFAULT_QUANTITIES);

  // ── Inline-add toggles & loading ─────────────────────────────────────────
  const [showNewVendor,   setShowNewVendor]   = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [showNewQty,      setShowNewQty]      = useState(false);
  const [showNewUnit,     setShowNewUnit]      = useState(false);
  const [addingVendor,    setAddingVendor]    = useState(false);
  const [addingCategory,  setAddingCategory]  = useState(false);
  const [addingQty,       setAddingQty]       = useState(false);
  const [addingUnit,      setAddingUnit]      = useState(false);

  // ── Drawer ────────────────────────────────────────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mode,       setMode]       = useState("create");
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);

  // ── Image ─────────────────────────────────────────────────────────────────
  const fileInputRef = useRef(null);

  // ── Image preview modal (for table thumbnails) ────────────────────────────
  const [previewUrl, setPreviewUrl] = useState("");

  // ── Inline table saving ───────────────────────────────────────────────────
  const [inlineSavingId, setInlineSavingId] = useState(null);

  // ── Delete ────────────────────────────────────────────────────────────────
  const [deletingId, setDeletingId] = useState(null);

  // ── Load lookups ──────────────────────────────────────────────────────────

  const loadUnits = useCallback(async () => {
    try {
      const res = await lookupsService.units();
      if (res.success) {
        const dbUnits = (res.data || []).map((u) => u.name);
        setUnits([...new Set([...DEFAULT_UNITS, ...dbUnits])].sort((a, b) => a.localeCompare(b)));
      }
    } catch { /* non-fatal */ }
  }, []);

  const loadQuantities = useCallback(async () => {
    try {
      const res = await lookupsService.quantities();
      if (res.success) {
        const dbQtys = (res.data || []).map((q) => q.value);
        setQuantities([...new Set([...DEFAULT_QUANTITIES, ...dbQtys])].sort((a, b) => a - b));
      }
    } catch { /* non-fatal */ }
  }, []);

  useEffect(() => {
    loadUnits();
    loadQuantities();
  }, [loadUnits, loadQuantities]);

  useEffect(() => {
    if (form.vendor) setCategories(VENDOR_CATEGORIES[form.vendor] || []);
    else setCategories([]);
  }, [form.vendor]);

  const filterCategories = vendorFilter ? (VENDOR_CATEGORIES[vendorFilter] || []) : ALL_CATEGORIES;

  // ── Inventory load ────────────────────────────────────────────────────────

  const load = useCallback(async ({ p = page, q = query, cat = categoryFilter, vendor = vendorFilter } = {}) => {
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
      toast.error(e?.response?.data?.message || e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [page, query, categoryFilter, vendorFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load({ p: page, q: query, cat: categoryFilter, vendor: vendorFilter });
  }, [page, vendorFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = setTimeout(() => {
      load({ p: 1, q: query, cat: categoryFilter, vendor: vendorFilter });
    }, 350);
    return () => clearTimeout(t);
  }, [query, categoryFilter, vendorFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Inline add handlers ───────────────────────────────────────────────────

  const handleAddVendor = async (name) => {
    setAddingVendor(true);
    try {
      const res = await lookupsService.createVendor(name);
      if (!res.success) throw new Error(res.message);
      setVendors((prev) => [...new Set([...prev, name])]);
      setForm((prev) => ({ ...prev, vendor: name, category: "" }));
      setShowNewVendor(false);
      toast.success(`Vendor "${name}" added`);
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || "Failed to add vendor");
    } finally {
      setAddingVendor(false);
    }
  };

  const handleAddCategory = async (name) => {
    if (!form.vendor) return toast.error("Select a vendor first");
    setAddingCategory(true);
    try {
      const res = await lookupsService.createCategory({ vendor: form.vendor, name });
      if (!res.success) throw new Error(res.message);
      setCategories((prev) => [...new Set([...prev, name])]);
      setForm((prev) => ({ ...prev, category: name }));
      setShowNewCategory(false);
      toast.success(`Category "${name}" added`);
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || "Failed to add category");
    } finally {
      setAddingCategory(false);
    }
  };

  const handleAddUnit = async (name) => {
    setAddingUnit(true);
    try {
      const res = await lookupsService.createUnit(name);
      if (!res.success) throw new Error(res.message);
      setUnits((prev) => [...new Set([...prev, name])].sort((a, b) => a.localeCompare(b)));
      setForm((prev) => ({ ...prev, unit: name }));
      setShowNewUnit(false);
      toast.success(`Unit "${name}" added`);
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || "Failed to add unit");
    } finally {
      setAddingUnit(false);
    }
  };

  const handleAddQty = async (text) => {
    const value = Number(text);
    if (isNaN(value) || value <= 0) return toast.error("Enter a valid positive number");
    setAddingQty(true);
    try {
      const res = await lookupsService.createQuantity(value);
      if (!res.success) throw new Error(res.message);
      setQuantities((prev) => [...new Set([...prev, value])].sort((a, b) => a - b));
      setForm((prev) => ({ ...prev, quantityNeeded: value }));
      setShowNewQty(false);
      toast.success(`Quantity "${value}" added`);
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || "Failed to add quantity");
    } finally {
      setAddingQty(false);
    }
  };

  // ── Image handlers ────────────────────────────────────────────────────────

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Only JPG, JPEG, PNG, and WEBP images are allowed");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      e.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, imageFile: file, imagePreview: previewUrl }));
    e.target.value = ""; // reset so same file can be re-selected
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  const removeImage = () => {
    setForm((prev) => ({ ...prev, imageFile: null, imagePreview: "", imageUrl: "" }));
  };

  // ── Drawer helpers ────────────────────────────────────────────────────────

  const openCreate = () => {
    setMode("create");
    setForm(EMPTY_FORM);
    setShowNewVendor(false);
    setShowNewCategory(false);
    setShowNewQty(false);
    setShowNewUnit(false);
    setDrawerOpen(true);
  };

  const openEdit = (it) => {
    setMode("edit");
    setForm({
      vendor:         it.vendor         || "",
      category:       it.category       || "",
      name:           it.name           || "",
      quantityNeeded: it.quantityNeeded ?? 1,
      unit:           it.unit           || "Box",
      imageUrl:       it.imageUrl       || "",
      imageFile:      null,
      imagePreview:   "",
      _id:            it._id,
    });
    setShowNewVendor(false);
    setShowNewCategory(false);
    setShowNewQty(false);
    setShowNewUnit(false);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    if (saving) return;
    // Revoke any blob URL to avoid memory leak
    if (form.imagePreview) URL.revokeObjectURL(form.imagePreview);
    setDrawerOpen(false);
    setForm(EMPTY_FORM);
  };

  const setField = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  // ── Inline table update ───────────────────────────────────────────────────

  const updateItemField = async (id, field, value) => {
    setItems((prev) => prev.map((item) => item._id === id ? { ...item, [field]: value } : item));
    setInlineSavingId(id);
    try {
      const payload = { [field]: field === "quantityNeeded" ? Number(value) : value };
      const res = await api.put(`/api/inventory/${id}`, payload);
      if (!res.data?.success) throw new Error(res.data?.message || "Update failed");
      setItems((prev) => prev.map((item) => item._id === id ? { ...item, ...res.data.item } : item));
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || "Failed to save");
      await load({ p: page, q: query, cat: categoryFilter, vendor: vendorFilter });
    } finally {
      setInlineSavingId(null);
    }
  };

  // ── Save ──────────────────────────────────────────────────────────────────

  const onSave = async () => {
    if (!String(form.vendor   || "").trim()) return toast.error("Vendor is required");
    if (!String(form.category || "").trim()) return toast.error("Category is required");
    if (!String(form.name     || "").trim()) return toast.error("Product name is required");

    setSaving(true);

    try {
      // Upload new image if one was selected
      let imageUrl = form.imageUrl;
      if (form.imageFile) {
        const fd = new FormData();
        fd.append("image", form.imageFile);
        const uploadRes = await api.post("/api/upload/product-image", fd);
        if (!uploadRes.data?.success) throw new Error("Image upload failed");
        imageUrl = uploadRes.data.imageUrl;
        // Revoke the blob preview URL
        if (form.imagePreview) URL.revokeObjectURL(form.imagePreview);
      }

      const payload = {
        vendor:         String(form.vendor).trim(),
        category:       String(form.category).trim(),
        name:           String(form.name).trim(),
        quantityNeeded: Number(form.quantityNeeded) || 1,
        unit:           String(form.unit || "Box").trim(),
        imageUrl,
      };

      if (mode === "create") {
        const res = await api.post("/api/inventory", payload);
        if (!res.data?.success) throw new Error(res.data?.message || "Create failed");
        toast.success("Item created");
        window.dispatchEvent(new CustomEvent("inventory:changed", { detail: { action: "create", id: res.data.item?._id } }));
      } else {
        const res = await api.put(`/api/inventory/${form._id}`, payload);
        if (!res.data?.success) throw new Error(res.data?.message || "Update failed");
        toast.success("Item updated");
        window.dispatchEvent(new CustomEvent("inventory:changed", { detail: { action: "update", id: res.data.item?._id } }));
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

  // ── Delete ────────────────────────────────────────────────────────────────

  const onDelete = async (it) => {
    if (!it?._id) return;
    if (!window.confirm(`Delete "${it.name}"?`)) return;
    setDeletingId(it._id);
    try {
      const res = await api.delete(`/api/inventory/${it._id}`);
      if (!res.data?.success) throw new Error(res.data?.message || "Delete failed");
      toast.success("Item deleted");
      window.dispatchEvent(new CustomEvent("inventory:changed", { detail: { action: "delete", id: it._id } }));
      await load({ p: 1 });
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) toast.error("Unauthorized. Please login again.");
      else toast.error(e?.response?.data?.message || e.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  // Determine which image src to show in the drawer
  const drawerImgSrc = form.imagePreview || getImageUrl(form.imageUrl);

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
              placeholder="Search by name, category or vendor…"
            />
          </div>

          <div className="invField">
            <label>Vendor</label>
            <select
              value={vendorFilter}
              onChange={(e) => {
                setVendorFilter(e.target.value);
                setCategoryFilter("");
                setPage(1);
              }}
            >
              <option value="">All Vendors</option>
              {vendors.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          <div className="invField">
            <label>Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Categories</option>
              {filterCategories.map((c) => <option key={c} value={c}>{c}</option>)}
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
                    <th className="invImgCol">Image</th>
                    <th>Vendor</th>
                    <th>Category</th>
                    <th>Product</th>
                    <th>Qty Needed</th>
                    <th>Unit</th>
                    <th className="invActionsCol">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => {
                    const imgSrc = getImageUrl(it.imageUrl);
                    return (
                      <tr key={it._id}>
                        <td className="invImgCell">
                          {imgSrc ? (
                            <img
                              src={imgSrc}
                              className="tblThumb"
                              alt={it.name}
                              onClick={() => setPreviewUrl(imgSrc)}
                              title="Click to enlarge"
                            />
                          ) : (
                            <div className="tblThumbEmpty">📦</div>
                          )}
                        </td>
                        <td className="tdMuted">{it.vendor}</td>
                        <td className="tdMuted">{it.category}</td>
                        <td className="tdStrong">{it.name}</td>
                        <td>
                          <select
                            className="compactSelect"
                            disabled={inlineSavingId === it._id}
                            value={it.quantityNeeded ?? 1}
                            onChange={(e) => updateItemField(it._id, "quantityNeeded", Number(e.target.value))}
                          >
                            {quantities.map((q) => <option key={q} value={q}>{q}</option>)}
                          </select>
                        </td>
                        <td>
                          <select
                            className="compactSelect"
                            disabled={inlineSavingId === it._id}
                            value={it.unit || "Box"}
                            onChange={(e) => updateItemField(it._id, "unit", e.target.value)}
                          >
                            {units.map((u) => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </td>
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Pagination page={page} pages={pages} onChange={(p) => setPage(p)} />
      </div>

      {/* Image preview modal */}
      {previewUrl && (
        <div className="imgPreviewModal" onClick={() => setPreviewUrl("")}>
          <div className="imgPreviewModalInner" onClick={(e) => e.stopPropagation()}>
            <button className="imgPreviewClose" onClick={() => setPreviewUrl("")}>×</button>
            <img src={previewUrl} alt="Product preview" className="imgPreviewFull" />
          </div>
        </div>
      )}

      {/* Drawer overlay */}
      <div className={`drawerOverlay ${drawerOpen ? "show" : ""}`} onClick={closeDrawer} />

      {/* Drawer */}
      <div className={`drawer ${drawerOpen ? "open" : ""}`}>
        <div className="drawerHeader">
          <div>
            <h3>{mode === "create" ? "Add Inventory Item" : "Edit Inventory Item"}</h3>
            <p className="drawerSub">Vendor, category, and product name are required.</p>
          </div>
          <button className="drawerClose" onClick={closeDrawer} disabled={saving}>✕</button>
        </div>

        <div className="drawerBody">

          {/* ── Product Image ── */}
          <div className="invField">
            <label>Product Image <span style={{ fontWeight: 400, color: "#94a3b8" }}>(optional · JPG / PNG / WEBP · max 5 MB)</span></label>
            <div className="imgUploadArea">
              {drawerImgSrc ? (
                <div className="imgDrawerPreviewWrap">
                  <img src={drawerImgSrc} className="imgDrawerPreview" alt="Product" />
                  <div className="imgDrawerActions">
                    <button type="button" className="imgReplaceBtn" onClick={triggerFileInput} disabled={saving}>
                      Replace Image
                    </button>
                    <button type="button" className="imgRemoveBtn" onClick={removeImage} disabled={saving}>
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" className="imgUploadBtn" onClick={triggerFileInput} disabled={saving}>
                  <span className="imgUploadIcon">📷</span>
                  Upload Image
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </div>
          </div>

          {/* ── Vendor ── */}
          <div className="invField">
            <label>Vendor *</label>
            {!showNewVendor ? (
              <select
                value={form.vendor}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "__add__") {
                    setShowNewVendor(true);
                  } else {
                    setForm((prev) => ({ ...prev, vendor: v, category: "" }));
                    setShowNewCategory(false);
                  }
                }}
              >
                <option value="">Select vendor</option>
                {vendors.map((v) => <option key={v} value={v}>{v}</option>)}
                <option value="__add__">+ Add new vendor…</option>
              </select>
            ) : (
              <InlineAdd
                placeholder="e.g., Costco"
                onAdd={handleAddVendor}
                onCancel={() => setShowNewVendor(false)}
                isLoading={addingVendor}
              />
            )}
          </div>

          {/* ── Category ── */}
          <div className="invField">
            <label>Category *</label>
            {!showNewCategory ? (
              <select
                value={form.category}
                disabled={!form.vendor}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "__add__") {
                    setShowNewCategory(true);
                  } else {
                    setForm((prev) => ({ ...prev, category: v }));
                  }
                }}
              >
                <option value="">
                  {form.vendor ? "Select category" : "Select vendor first"}
                </option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                {form.vendor && <option value="__add__">+ Add new category…</option>}
              </select>
            ) : (
              <InlineAdd
                placeholder="e.g., Rice, Flour & Baking"
                onAdd={handleAddCategory}
                onCancel={() => setShowNewCategory(false)}
                isLoading={addingCategory}
              />
            )}
          </div>

          {/* ── Product Name ── */}
          <div className="invField">
            <label>Product Name *</label>
            <input
              value={form.name}
              onChange={setField("name")}
              placeholder="e.g., Sonamasoori Rice"
            />
          </div>

          {/* ── Quantity Needed + Unit ── */}
          <div className="grid2">
            <div className="invField">
              <label>Quantity Needed *</label>
              {!showNewQty ? (
                <select
                  value={form.quantityNeeded}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "__add__") {
                      setShowNewQty(true);
                    } else {
                      setForm((prev) => ({ ...prev, quantityNeeded: Number(v) }));
                    }
                  }}
                >
                  {quantities.map((q) => <option key={q} value={q}>{q}</option>)}
                  <option value="__add__">+ Add new qty…</option>
                </select>
              ) : (
                <InlineAdd
                  placeholder="e.g., 7"
                  onAdd={handleAddQty}
                  onCancel={() => setShowNewQty(false)}
                  isLoading={addingQty}
                />
              )}
            </div>

            <div className="invField">
              <label>Unit *</label>
              {!showNewUnit ? (
                <select
                  value={form.unit}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "__add__") {
                      setShowNewUnit(true);
                    } else {
                      setForm((prev) => ({ ...prev, unit: v }));
                    }
                  }}
                >
                  {units.map((u) => <option key={u} value={u}>{u}</option>)}
                  <option value="__add__">+ Add new unit…</option>
                </select>
              ) : (
                <InlineAdd
                  placeholder="e.g., Bundle"
                  onAdd={handleAddUnit}
                  onCancel={() => setShowNewUnit(false)}
                  isLoading={addingUnit}
                />
              )}
            </div>
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
