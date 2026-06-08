const express  = require("express");
const router   = express.Router();
const Vendor         = require("../models/Vendor");
const Category       = require("../models/Category");
const InventoryItem  = require("../models/InventoryItem");
const Unit           = require("../models/Unit");
const QuantityOption = require("../models/QuantityOption");
const MASTER_INVENTORY = require("../data/masterInventory");

// ─── Master data (authoritative source of truth from purchase lists) ──────────

const DEFAULT_VENDORS = ["Costco", "Mid East Market", "Spice Bazaar"];

const DEFAULT_CATEGORIES = {
  "Costco": [
    "Chicken",
    "Seafood",
    "Other Protein",
    "Dairy & Refrigerated",
    "Vegetables",
    "Herbs",
    "Citrus",
    "Rice, Flour & Baking",
    "Oils & Cooking Ingredients",
    "Nuts & Dry Fruits",
    "Beverages",
    "Bread & Frozen",
    "Cleaning Supplies",
    "Plates & Trays",
    "Cups & Containers",
    "Cutlery & Paper Goods",
    "Storage",
    "Kitchen Supplies",
    "Produce",
    "Protein",
    "Staples",
    "Restaurant Supplies",
  ],
  "Mid East Market": [
    "Chicken (Skinless)",
    "Goat",
    "Fresh Vegetables & Herbs",
    "Rice, Flour & Grains",
    "Dals, Beans & Pulses",
    "Spices & Whole Masalas",
    "Spice Powders",
    "Sauces, Pastes & Condiments",
    "Coconut Products",
    "Frozen Items",
    "Bakery & Ready-to-Eat",
    "Beverages",
    "Dry Fruits & Miscellaneous",
    "Frequently Ordered in Full Cases",
  ],
  "Spice Bazaar": [
    "Fresh Vegetables & Greens",
    "Frozen Vegetables & Produce",
    "Rice, Flours & Grains",
    "Dals & Pulses",
    "Nuts & Seeds",
    "Whole Spices",
    "Spice Powders & Masalas",
    "Sauces, Pastes & Chutneys",
    "Bakery, Snacks & Ready-to-Eat",
    "Dairy & Dessert Ingredients",
    "Beverages",
    "Miscellaneous",
  ],
};

const DEFAULT_UNITS = ["Bag", "Bottle", "Box", "Carton", "Case", "Kg", "Lb", "Pack", "Piece", "Tray"];
const DEFAULT_QUANTITIES = [1, 2, 3, 4, 5, 10, 15, 20, 25, 50, 100];

// ─── Seed defaults on first use ──────────────────────────────────────────────

async function seedIfEmpty() {
  const [vCount, iCount, uCount, qCount] = await Promise.all([
    Vendor.countDocuments(),
    InventoryItem.countDocuments(),
    Unit.countDocuments(),
    QuantityOption.countDocuments(),
  ]);

  // ── Vendors + Categories ──────────────────────────────────────────────────
  let vendorMap = {};

  if (vCount === 0) {
    const vendorDocs = await Vendor.insertMany(DEFAULT_VENDORS.map((name) => ({ name })));
    for (const v of vendorDocs) vendorMap[v.name] = v._id;

    for (const [vendorName, cats] of Object.entries(DEFAULT_CATEGORIES)) {
      const vendorId = vendorMap[vendorName];
      await Category.insertMany(
        cats.map((name) => ({ vendorId, vendor: vendorName, name }))
      );
    }
    console.log("Seeded vendors and categories.");
  } else {
    // Build vendorMap from existing docs (needed for inventory seed below)
    const existing = await Vendor.find().lean();
    for (const v of existing) vendorMap[v.name] = v._id;
  }

  // ── Inventory items ───────────────────────────────────────────────────────
  if (iCount === 0) {
    let created = 0;
    for (const [vendorName, categories] of Object.entries(MASTER_INVENTORY)) {
      const vendorId = vendorMap[vendorName];
      if (!vendorId) continue;

      for (const [catName, products] of Object.entries(categories)) {
        const catDoc = await Category.findOne({ vendor: vendorName, name: catName }).lean();
        if (!catDoc) continue;

        const docs = products.map((name) => ({
          vendorId,
          vendor:         vendorName,
          categoryId:     catDoc._id,
          category:       catName,
          name,
          quantityNeeded: 1,
          unit:           "Box",
        }));

        await InventoryItem.insertMany(docs, { ordered: false }).catch(() => {});
        created += docs.length;
      }
    }
    console.log(`Seeded ${created} inventory items.`);
  }

  // ── Units + Quantities ────────────────────────────────────────────────────
  if (uCount === 0) {
    await Unit.insertMany(DEFAULT_UNITS.map((name) => ({ name })));
  }
  if (qCount === 0) {
    await QuantityOption.insertMany(DEFAULT_QUANTITIES.map((value) => ({ value })));
  }
}

seedIfEmpty().catch((e) => console.error("Lookup seed failed:", e));

// ─── Vendors ─────────────────────────────────────────────────────────────────

router.get("/vendors", async (req, res) => {
  try {
    const items = await Vendor.find().sort({ name: 1 }).lean();
    res.json({ success: true, data: items });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post("/vendors", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ success: false, message: "Name is required" });
    const existing = await Vendor.findOne({ name: new RegExp(`^${name}$`, "i") });
    if (existing) return res.status(409).json({ success: false, message: "Vendor already exists" });
    const doc = await Vendor.create({ name });
    res.json({ success: true, item: doc });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put("/vendors/:id", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ success: false, message: "Name is required" });
    const doc = await Vendor.findByIdAndUpdate(req.params.id, { name }, { new: true });
    res.json({ success: true, item: doc });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.delete("/vendors/:id", async (req, res) => {
  try {
    await Vendor.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── Categories ──────────────────────────────────────────────────────────────

router.get("/categories", async (req, res) => {
  try {
    const vendor = (req.query.vendor || "").trim();
    const filter = vendor ? { vendor } : {};
    const items  = await Category.find(filter).sort({ name: 1 }).lean();
    res.json({ success: true, data: items });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post("/categories", async (req, res) => {
  try {
    const vendor = String(req.body.vendor || "").trim();
    const name   = String(req.body.name   || "").trim();
    if (!vendor) return res.status(400).json({ success: false, message: "Vendor is required" });
    if (!name)   return res.status(400).json({ success: false, message: "Name is required" });

    const vendorDoc = await Vendor.findOne({ name: vendor }).lean();
    if (!vendorDoc) return res.status(404).json({ success: false, message: `Vendor "${vendor}" not found` });

    const existing = await Category.findOne({ vendor, name: new RegExp(`^${name}$`, "i") });
    if (existing) return res.status(409).json({ success: false, message: "Category already exists for this vendor" });

    const doc = await Category.create({ vendorId: vendorDoc._id, vendor, name });
    res.json({ success: true, item: doc });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put("/categories/:id", async (req, res) => {
  try {
    const vendor = String(req.body.vendor || "").trim();
    const name   = String(req.body.name   || "").trim();
    const updates = { vendor, name };

    if (vendor) {
      const vendorDoc = await Vendor.findOne({ name: vendor }).lean();
      if (vendorDoc) updates.vendorId = vendorDoc._id;
    }

    const doc = await Category.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ success: true, item: doc });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.delete("/categories/:id", async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── Units ───────────────────────────────────────────────────────────────────

router.get("/units", async (req, res) => {
  try {
    const items = await Unit.find().sort({ name: 1 }).lean();
    res.json({ success: true, data: items });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post("/units", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ success: false, message: "Name is required" });
    const existing = await Unit.findOne({ name: new RegExp(`^${name}$`, "i") });
    if (existing) return res.status(409).json({ success: false, message: "Unit already exists" });
    const doc = await Unit.create({ name });
    res.json({ success: true, item: doc });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put("/units/:id", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ success: false, message: "Name is required" });
    const doc  = await Unit.findByIdAndUpdate(req.params.id, { name }, { new: true });
    res.json({ success: true, item: doc });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.delete("/units/:id", async (req, res) => {
  try {
    await Unit.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── Quantities ───────────────────────────────────────────────────────────────

router.get("/quantities", async (req, res) => {
  try {
    const items = await QuantityOption.find().sort({ value: 1 }).lean();
    res.json({ success: true, data: items });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post("/quantities", async (req, res) => {
  try {
    const value = Number(req.body.value);
    if (isNaN(value) || value <= 0) return res.status(400).json({ success: false, message: "Valid positive number is required" });
    const existing = await QuantityOption.findOne({ value });
    if (existing) return res.status(409).json({ success: false, message: "Quantity already exists" });
    const doc = await QuantityOption.create({ value });
    res.json({ success: true, item: doc });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put("/quantities/:id", async (req, res) => {
  try {
    const value = Number(req.body.value);
    if (isNaN(value) || value <= 0) return res.status(400).json({ success: false, message: "Valid positive number is required" });
    const doc = await QuantityOption.findByIdAndUpdate(req.params.id, { value }, { new: true });
    res.json({ success: true, item: doc });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.delete("/quantities/:id", async (req, res) => {
  try {
    await QuantityOption.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
