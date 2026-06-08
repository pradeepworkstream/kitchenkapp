const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", index: true },
    vendor:   { type: String, required: true, index: true },
    name:     { type: String, required: true },
  },
  { timestamps: true }
);

CategorySchema.index({ vendor: 1, name: 1 }, { unique: true });

module.exports = mongoose.models.Category || mongoose.model("Category", CategorySchema);
