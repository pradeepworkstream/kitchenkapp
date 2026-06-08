const express  = require("express");
const path     = require("path");
const fs       = require("fs");
const router   = express.Router();
const InventoryItem = require("../models/InventoryItem");
const Vendor        = require("../models/Vendor");
const Category      = require("../models/Category");

// Delete an uploaded product image from disk (silent fail — file may not exist)
function deleteImageFile(imageUrl) {
  if (!imageUrl) return;
  try {
    const filename = path.basename(imageUrl);
    if (!filename) return;
    const filePath = path.join(__dirname, "..", "uploads", "products", filename);
    fs.unlink(filePath, () => {});
  } catch { /* no-op */ }
}

// Resolve vendor + category docs and validate the category belongs to the vendor.
async function resolveVendorCategory(vendorName, categoryName) {
  const vendorDoc = await Vendor.findOne({ name: vendorName }).lean();
  if (!vendorDoc) throw Object.assign(new Error(`Vendor "${vendorName}" not found`), { status: 404 });

  const categoryDoc = await Category.findOne({
    vendor: vendorName,
    name:   categoryName,
  }).lean();

  if (!categoryDoc) {
    throw Object.assign(
      new Error(`Category "${categoryName}" does not exist under vendor "${vendorName}"`),
      { status: 400 }
    );
  }

  return { vendorDoc, categoryDoc };
}

// GET /api/inventory/list
router.get("/list", async (req, res) => {
  try {
    const page     = Math.max(1, parseInt(req.query.page)  || 1);
    const limit    = Math.max(1, Math.min(200, parseInt(req.query.limit) || 20));
    const search   = (req.query.search   || "").trim();
    const category = (req.query.category || "").trim();
    const vendor   = (req.query.vendor   || "").trim();

    const filter = {};
    if (search) {
      filter.$or = [
        { name:     new RegExp(search, "i") },
        { category: new RegExp(search, "i") },
        { vendor:   new RegExp(search, "i") },
      ];
    }
    if (category) filter.category = new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    if (vendor)   filter.vendor   = new RegExp(`^${vendor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");

    console.log("[Inventory] filter:", JSON.stringify({ vendor, category, search }));

    const [data, total] = await Promise.all([
      InventoryItem.find(filter)
        .sort({ vendor: 1, category: 1, name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      InventoryItem.countDocuments(filter),
    ]);

    res.json({ success: true, data, total, page, pages: Math.ceil(total / limit) || 1 });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/inventory
router.post("/", async (req, res) => {
  try {
    const { vendor, category, name, quantityNeeded, unit, imageUrl } = req.body || {};
    const vName = String(vendor   || "").trim();
    const cName = String(category || "").trim();
    const iName = String(name     || "").trim();

    if (!vName) return res.status(400).json({ success: false, message: "Vendor is required" });
    if (!cName) return res.status(400).json({ success: false, message: "Category is required" });
    if (!iName) return res.status(400).json({ success: false, message: "Name is required" });

    const { vendorDoc, categoryDoc } = await resolveVendorCategory(vName, cName);

    const item = await InventoryItem.create({
      vendorId:       vendorDoc._id,
      vendor:         vName,
      categoryId:     categoryDoc._id,
      category:       cName,
      name:           iName,
      quantityNeeded: Number(quantityNeeded) || 1,
      unit:           String(unit || "Box").trim(),
      imageUrl:       String(imageUrl || "").trim(),
    });
    res.json({ success: true, item });
  } catch (e) {
    console.error(e);
    res.status(e.status || 500).json({ success: false, message: e.message });
  }
});

// PUT /api/inventory/:id
router.put("/:id", async (req, res) => {
  try {
    const { vendor, category, name, quantityNeeded, unit, imageUrl } = req.body || {};
    const updates = {};

    // Always fetch existing so we can handle old image deletion
    const existing = await InventoryItem.findById(req.params.id).lean();
    if (!existing) return res.status(404).json({ success: false, message: "Item not found" });

    const vName = vendor   !== undefined ? String(vendor).trim()   : null;
    const cName = category !== undefined ? String(category).trim() : null;

    if (vName !== null || cName !== null) {
      const resolvedVendor   = vName ?? existing.vendor;
      const resolvedCategory = cName ?? existing.category;
      const { vendorDoc, categoryDoc } = await resolveVendorCategory(resolvedVendor, resolvedCategory);
      updates.vendorId   = vendorDoc._id;
      updates.vendor     = resolvedVendor;
      updates.categoryId = categoryDoc._id;
      updates.category   = resolvedCategory;
    }

    if (name           !== undefined) updates.name           = String(name).trim();
    if (quantityNeeded !== undefined) updates.quantityNeeded = Number(quantityNeeded) || 1;
    if (unit           !== undefined) updates.unit           = String(unit).trim();

    if (imageUrl !== undefined) {
      const newUrl = String(imageUrl).trim();
      // Delete old file if it's being replaced or removed
      if (existing.imageUrl && existing.imageUrl !== newUrl) {
        deleteImageFile(existing.imageUrl);
      }
      updates.imageUrl = newUrl;
    }

    const item = await InventoryItem.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    );
    res.json({ success: true, item });
  } catch (e) {
    console.error(e);
    res.status(e.status || 500).json({ success: false, message: e.message });
  }
});

// DELETE /api/inventory/:id
router.delete("/:id", async (req, res) => {
  try {
    const item = await InventoryItem.findByIdAndDelete(req.params.id).lean();
    if (item?.imageUrl) deleteImageFile(item.imageUrl);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
