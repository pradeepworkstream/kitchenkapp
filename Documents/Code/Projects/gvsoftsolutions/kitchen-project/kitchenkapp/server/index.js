require("dotenv").config();
const path    = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const apiRoutes       = require("./routes/api");
const lookupsRoutes   = require("./routes/lookups");
const inventoryRoutes = require("./routes/inventory");
const settingsRoutes  = require("./routes/settings");
const uploadRoutes    = require("./routes/upload");

const app = express();
app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/kitchenkapp";
const PORT = parseInt(process.env.PORT || "4000");

async function start() {
  try {
    await mongoose.connect(MONGODB_URI, { autoIndex: true });
    console.log("MongoDB connected");

    // Serve uploaded product images
    app.use("/uploads", express.static(path.join(__dirname, "uploads")));

    app.use("/api", apiRoutes);
    app.use("/api/lookups",   lookupsRoutes);
    app.use("/api/inventory", inventoryRoutes);
    app.use("/api/settings",  settingsRoutes);
    app.use("/api/upload",    uploadRoutes);

    app.get("/", (req, res) => res.json({ ok: true }));

    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  } catch (e) {
    console.error("Failed to start server", e);
    process.exit(1);
  }
}

start();
