const mongoose = require("mongoose");

const VendorSettingsSchema = new mongoose.Schema({
  vendor: { type: String, required: true, unique: true, index: true },
  email:  { type: String, default: "" },
}, { timestamps: true });

module.exports =
  mongoose.models.VendorSettings ||
  mongoose.model("VendorSettings", VendorSettingsSchema);
