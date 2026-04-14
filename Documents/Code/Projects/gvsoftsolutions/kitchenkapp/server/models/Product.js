const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    category: { type: String, index: true },
    brandOptions: { type: [String], default: [] },
    unit: { type: String },
    isActive: { type: Boolean, default: true },
    regPrice: { type: Number, default: 0 },
    sizeText: { type: String },
    stock: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Product || mongoose.model("Product", ProductSchema);
