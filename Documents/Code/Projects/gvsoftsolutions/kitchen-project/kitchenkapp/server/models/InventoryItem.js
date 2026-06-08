const mongoose = require("mongoose");

const InventoryItemSchema = new mongoose.Schema(
  {
    vendorId:       { type: mongoose.Schema.Types.ObjectId, ref: "Vendor",   index: true },
    vendor:         { type: String, required: true, index: true },
    categoryId:     { type: mongoose.Schema.Types.ObjectId, ref: "Category", index: true },
    category:       { type: String, required: true, index: true },
    name:           { type: String, required: true, index: true },
    quantityNeeded: { type: Number, default: 1 },
    unit:           { type: String, default: "Box" },
    imageUrl:       { type: String, default: "" },
  },
  { timestamps: true }
);

// Force collection name "inventories" to match the production collection.
// The default Mongoose pluralization of "InventoryItem" → "inventoryitems" is wrong.
module.exports =
  mongoose.models.InventoryItem ||
  mongoose.model("InventoryItem", InventoryItemSchema, "inventories");
