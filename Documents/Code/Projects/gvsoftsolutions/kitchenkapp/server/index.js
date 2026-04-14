require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const apiRoutes = require("./routes/api");

const app = express();
app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/kitchenkapp";
const PORT = parseInt(process.env.PORT || "4000");

async function start() {
  try {
    await mongoose.connect(MONGODB_URI, { autoIndex: true });
    console.log("MongoDB connected");

    app.use("/api", apiRoutes);

    app.get("/", (req, res) => res.json({ ok: true }));

    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  } catch (e) {
    console.error("Failed to start server", e);
    process.exit(1);
  }
}

start();
