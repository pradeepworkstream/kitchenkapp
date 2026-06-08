const mongoose = require("mongoose");

const VendorSchema = new mongoose.Schema(
  { name: { type: String, required: true, unique: true, index: true } },
  { timestamps: true }
);

module.exports = mongoose.models.Vendor || mongoose.model("Vendor", VendorSchema);
