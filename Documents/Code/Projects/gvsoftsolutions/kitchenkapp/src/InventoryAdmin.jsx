// src/InventoryAdmin.jsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "./InventoryAdmin.css";

const API_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5001").replace(/\/+$/, "");

const emptyForm = {
  category: "",
  name: "",
  brandOptionsText: "", // comma separated
  unit: "",
  regPrice: "",
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

  // UI state
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Create/Edit
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mode, setMode] = useState("create"); // create | edit
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Delete
  const [deletingId, setDeletingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      // ✅ public route (no token needed)
      const res = await axios.get(`${API_URL}/api/inventory/list`);
      if (!res.data?.success) throw new Error(res.data?.message || "Failed to load inventory");
      setItems(res.data.items || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load inventory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(() => {
    const set = new Set();
    (items || []).forEach((it) => set.add(it.category || ""));
    return ["ALL", ...Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b))];
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (items || [])
      .filter((it) => (categoryFilter === "ALL" ? true : it.category === categoryFilter))
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
      sizeText: String(form.sizeText || "").trim(),
      isActive: !!form.isActive,
    };

    const authHeaders = getAuthHeaders();
    if (!authHeaders) return toast.error("Admin login required (token missing).");

    setSaving(true);
    try {
      if (mode === "create") {
        // ✅ PROTECTED
        const res = await axios.post(`${API_URL}/api/inventory`, payload, {
          headers: authHeaders,
        });
        if (!res.data?.success) throw new Error(res.data?.message || "Create failed");
        toast.success("Item created");
      } else {
        // ✅ PROTECTED
        const id = form._id;
        const res = await axios.put(`${API_URL}/api/inventory/${id}`, payload, {
          headers: authHeaders,
        });
        if (!res.data?.success) throw new Error(res.data?.message || "Update failed");
        toast.success("Item updated");
      }
      await load();
      setDrawerOpen(false);
      setForm(emptyForm);
    } catch (e) {
      console.error(e);

      // ✅ nice message for auth errors
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
      // ✅ PROTECTED
      const res = await axios.delete(`${API_URL}/api/inventory/${it._id}`, {
        headers: authHeaders,
      });
      if (!res.data?.success) throw new Error(res.data?.message || "Delete failed");
      toast.success("Item deleted");
      await load();
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
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by category, product, brand, unit…"
            />
          </div>

          <div className="invField">
            <label>Category</label>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "ALL" ? "All Categories" : c}
                </option>
              ))}
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
                    <th>Unit</th>
                    <th>Status</th>
                    <th className="invActionsCol">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((it) => (
                    <tr key={it._id}>
                      <td className="tdMuted">{it.category}</td>
                      <td className="tdStrong">{it.name}</td>
                      <td className="tdSmall">{(it.brandOptions || []).join(", ") || "-"}</td>
                      <td className="tdSmall">{it.unit || "-"}</td>
                      <td>
                        <span className={`badge ${it.isActive ? "on" : "off"}`}>
                          {it.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="invActions">
                        <button className="btnGhost" onClick={() => openEdit(it)}>
                          Edit
                        </button>
                        <button
                          className="btnDanger"
                          disabled={deletingId === it._id}
                          onClick={() => onDelete(it)}
                        >
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