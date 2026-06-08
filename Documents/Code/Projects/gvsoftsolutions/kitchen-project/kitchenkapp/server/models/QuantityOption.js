const mongoose = require("mongoose");

const QuantityOptionSchema = new mongoose.Schema(
  { value: { type: Number, required: true, unique: true } },
  { timestamps: true }
);

module.exports = mongoose.models.QuantityOption || mongoose.model("QuantityOption", QuantityOptionSchema);
