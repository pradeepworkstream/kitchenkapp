const mongoose = require("mongoose");

const UnitSchema = new mongoose.Schema(
  { name: { type: String, required: true, unique: true } },
  { timestamps: true }
);

module.exports = mongoose.models.Unit || mongoose.model("Unit", UnitSchema);
