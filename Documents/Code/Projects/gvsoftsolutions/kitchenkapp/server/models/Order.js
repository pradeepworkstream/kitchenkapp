const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    customerName: String,
    items: [
      {
        productId: mongoose.Schema.Types.ObjectId,
        name: String,
        qty: Number,
        unit: String,
      },
    ],
    total: { type: Number, default: 0 },
    status: { type: String, default: "pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Order || mongoose.model("Order", OrderSchema);
