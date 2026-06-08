/**
 * seedInventory.js  —  node server/scripts/seedInventory.js
 *
 * Seeds every product from the master purchase lists for all 3 vendors.
 * Safe to re-run: skips any item that already exists (vendor + category + name).
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose      = require("mongoose");
const Vendor        = require("../models/Vendor");
const Category      = require("../models/Category");
const InventoryItem = require("../models/InventoryItem");
const INVENTORY     = require("../data/masterInventory");

async function run() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/kitchenkapp";
  await mongoose.connect(uri, { autoIndex: true });
  console.log("Connected:", uri.replace(/\/\/.*@/, "//***@"));

  let created = 0;
  let skipped = 0;
  const errors = [];

  for (const [vendorName, categories] of Object.entries(INVENTORY)) {
    const vendorDoc = await Vendor.findOne({ name: vendorName }).lean();
    if (!vendorDoc) {
      console.warn(`  SKIP: vendor "${vendorName}" not found — run migrate.js first`);
      continue;
    }

    console.log(`\n── ${vendorName} ──`);

    for (const [categoryName, products] of Object.entries(categories)) {
      const categoryDoc = await Category.findOne({
        vendor: vendorName,
        name:   categoryName,
      }).lean();

      if (!categoryDoc) {
        console.warn(`  SKIP category: [${vendorName}] "${categoryName}" not found — run migrate.js first`);
        continue;
      }

      for (const productName of products) {
        try {
          const existing = await InventoryItem.findOne({
            vendor:   vendorName,
            category: categoryName,
            name:     productName,
          }).lean();

          if (existing) {
            skipped++;
            continue;
          }

          await InventoryItem.create({
            vendorId:       vendorDoc._id,
            vendor:         vendorName,
            categoryId:     categoryDoc._id,
            category:       categoryName,
            name:           productName,
            quantityNeeded: 1,
            unit:           "Box",
          });

          created++;
          console.log(`  + [${categoryName}] ${productName}`);
        } catch (e) {
          errors.push(`${vendorName} / ${categoryName} / ${productName}: ${e.message}`);
          console.error(`  ERROR: ${productName} — ${e.message}`);
        }
      }
    }
  }

  console.log("\n════════════════════════════════════════════════════════");
  console.log(`  Items created : ${created}`);
  console.log(`  Items skipped : ${skipped} (already exist)`);
  console.log(`  Errors        : ${errors.length}`);
  if (errors.length) errors.forEach((e) => console.error("  !", e));
  console.log("════════════════════════════════════════════════════════\n");

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
