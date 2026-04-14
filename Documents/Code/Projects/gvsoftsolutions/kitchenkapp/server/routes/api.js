const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");

// GET /api/metrics
router.get("/metrics", async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments();
    const lowStockCount = await Product.countDocuments({ stock: { $lte: 5 } });

    return res.json({ success: true, data: { totalProducts, totalOrders, totalUsers, lowStockCount } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: e.message });
  }
});

// GET /api/products
// supports: page, limit, search, category, stock (low|out|all)
router.get("/products", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const search = (req.query.search || "").trim();
    const category = (req.query.category || "").trim();
    const stock = (req.query.stock || "all").trim();

    const filter = {};
    if (search) {
      filter.$or = [
        { name: new RegExp(search, "i") },
        { category: new RegExp(search, "i") },
      ];
    }
    if (category) filter.category = category;
    if (stock === "low") filter.stock = { $lte: 5 };
    if (stock === "out") filter.stock = { $lte: 0 };

    const [items, total] = await Promise.all([
      Product.find(filter).sort({ category: 1, name: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);

    const pages = Math.ceil(total / limit) || 1;
    return res.json({ success: true, data: items, total, page, pages });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/products - create
router.post("/products", async (req, res) => {
  try {
    const data = req.body || {};
    const p = new Product({
      name: data.name,
      category: data.category,
      brandOptions: data.brandOptions || [],
      unit: data.unit,
      isActive: data.isActive !== false,
      regPrice: data.regPrice || 0,
      sizeText: data.sizeText || "",
      stock: typeof data.stock === "number" ? data.stock : 0,
    });
    await p.save();
    return res.json({ success: true, item: p });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: e.message });
  }
});

// PUT /api/products/:id - update
router.put("/products/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body || {};
    const updated = await Product.findByIdAndUpdate(
      id,
      {
        $set: {
          name: data.name,
          category: data.category,
          brandOptions: data.brandOptions || [],
          unit: data.unit,
          isActive: data.isActive !== false,
          regPrice: data.regPrice || 0,
          sizeText: data.sizeText || "",
          stock: typeof data.stock === "number" ? data.stock : 0,
        },
      },
      { new: true }
    );
    return res.json({ success: true, item: updated });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: e.message });
  }
});

// DELETE /api/products/:id
router.delete("/products/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await Product.findByIdAndDelete(id);
    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: e.message });
  }
});

// GET /api/orders (recent)
router.get("/orders", async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit) || 10));
    const items = await Order.find({}).sort({ createdAt: -1 }).limit(limit).lean();
    return res.json({ success: true, data: items });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
