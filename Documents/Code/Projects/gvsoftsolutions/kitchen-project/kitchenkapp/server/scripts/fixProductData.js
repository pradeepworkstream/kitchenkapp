/**
 * fixProductData.js  —  node server/scripts/fixProductData.js
 *
 * One-time migration that fixes the "inventories" collection in Atlas so that
 * vendor/category values exactly match what the frontend (vendorCategories.js) expects.
 *
 * Run this once: node server/scripts/fixProductData.js
 * Safe to re-run (uses upsert logic for new items).
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const MASTER   = require("../data/masterInventory");

// ── Category rename rules ──────────────────────────────────────────────────────
// Format: { vendor, from, to }
const CATEGORY_RENAMES = [
  // Costco
  { vendor: "Costco", from: "Vegetables & Produce",            to: "Vegetables" },
  // Mid East Market  (vendor was "Mid East", now renamed to "Mid East Market" first)
  { vendor: "Mid East Market", from: "Chicken",                 to: "Chicken (Skinless)" },
  { vendor: "Mid East Market", from: "Bread & Frozen",          to: "Bakery & Ready-to-Eat" },
  { vendor: "Mid East Market", from: "Whole Spices",            to: "Spices & Whole Masalas" },
  { vendor: "Mid East Market", from: "Nuts & Dry Fruits",       to: "Dry Fruits & Miscellaneous" },
  { vendor: "Mid East Market", from: "Miscellaneous",           to: "Dry Fruits & Miscellaneous" },
  // Spice Bazaar
  { vendor: "Spice Bazaar",    from: "Bread & Frozen",          to: "Bakery, Snacks & Ready-to-Eat" },
  { vendor: "Spice Bazaar",    from: "Dairy & Refrigerated",    to: "Dairy & Dessert Ingredients" },
  { vendor: "Spice Bazaar",    from: "Nuts & Dry Fruits",       to: "Nuts & Seeds" },
  { vendor: "Spice Bazaar",    from: "Rice, Flour & Baking",    to: "Rice, Flours & Grains" },
];

// ── Costco "Disposable Restaurant Supplies" → correct categories ──────────────
const DISP_TO_CAT = {
  "Dinner Plates":   "Plates & Trays",   "Snack Plates":    "Plates & Trays",
  "Portion Plates":  "Plates & Trays",   "Full Trays":      "Plates & Trays",
  "Half Trays":      "Plates & Trays",   "One-Third Trays": "Plates & Trays",

  "4 oz Cups":                           "Cups & Containers",
  "8 oz Clear Cups with Lids":           "Cups & Containers",
  "1 Liter Clear Containers with Lids":  "Cups & Containers",
  "Square Food Containers":              "Cups & Containers",
  "To-Go Boxes":                         "Cups & Containers",
  "Breakfast Boxes":                     "Cups & Containers",

  "Spoons":              "Cutlery & Paper Goods",  "Forks":               "Cutlery & Paper Goods",
  "Napkins":             "Cutlery & Paper Goods",  "Bounty Paper Towels": "Cutlery & Paper Goods",
  "Tissue Paper":        "Cutlery & Paper Goods",  "Toilet Paper":        "Cutlery & Paper Goods",

  "Gallon Ziplock Bags":               "Storage",  "Quart Ziplock Bags":            "Storage",
  "Heavy Duty Trash Bags (33 Gallon)": "Storage",  "To-Go Bags":                    "Storage",

  "Heavy Duty Foil": "Kitchen Supplies",  "Food Wrap Foil": "Kitchen Supplies",
  "Lighters":        "Kitchen Supplies",
};

// ── Categories expected by frontend ───────────────────────────────────────────
const EXPECTED_CATS = {
  "Costco": [
    "Chicken","Seafood","Other Protein","Dairy & Refrigerated","Vegetables","Herbs","Citrus",
    "Rice, Flour & Baking","Oils & Cooking Ingredients","Nuts & Dry Fruits","Beverages",
    "Bread & Frozen","Cleaning Supplies","Plates & Trays","Cups & Containers",
    "Cutlery & Paper Goods","Storage","Kitchen Supplies","Produce","Protein","Staples",
    "Restaurant Supplies",
  ],
  "Mid East Market": [
    "Chicken (Skinless)","Goat","Fresh Vegetables & Herbs","Rice, Flour & Grains",
    "Dals, Beans & Pulses","Spices & Whole Masalas","Spice Powders",
    "Sauces, Pastes & Condiments","Coconut Products","Frozen Items",
    "Bakery & Ready-to-Eat","Beverages","Dry Fruits & Miscellaneous",
  ],
  "Spice Bazaar": [
    "Fresh Vegetables & Greens","Frozen Vegetables & Produce","Rice, Flours & Grains",
    "Dals & Pulses","Nuts & Seeds","Whole Spices","Spice Powders & Masalas",
    "Sauces, Pastes & Chutneys","Bakery, Snacks & Ready-to-Eat","Dairy & Dessert Ingredients",
    "Beverages","Miscellaneous",
  ],
};

// Costco items for categories that were completely missing
const COSTCO_NEW_ITEMS = {
  "Produce":              ["Tomatoes","Yellow Onions","Red Onions","Garlic","Bell Peppers","Beans","Potatoes","Milk"],
  "Staples":              ["Basmati Rice","Canola Oil","Butter","Cashews"],
  "Restaurant Supplies":  ["Plates","Boxes","Cups","Trash Bags","Foil","Ziplocks","Cleaning Supplies"],
  "Other Protein":        ["Goat Cubes","Eggs (Large Commercial Boxes)","Paneer"],
};

async function run() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/kitchenkapp";
  await mongoose.connect(uri, { autoIndex: true });
  console.log("Connected:", uri.replace(/\/\/.*@/, "//***@"));

  const col = mongoose.connection.collection("inventories");
  const totalBefore = await col.countDocuments();
  console.log(`\nTotal docs before: ${totalBefore}\n`);

  // ── 1. Fix vendor name "Mid East" → "Mid East Market" ──────────────────────
  const r1 = await col.updateMany({ vendor: "Mid East" }, { $set: { vendor: "Mid East Market" } });
  console.log(`[1] "Mid East" → "Mid East Market": ${r1.modifiedCount} docs`);

  // ── 2. Apply simple category renames ───────────────────────────────────────
  console.log("\n[2] Category renames:");
  for (const { vendor, from, to } of CATEGORY_RENAMES) {
    const r = await col.updateMany({ vendor, category: from }, { $set: { category: to } });
    if (r.modifiedCount > 0) {
      console.log(`    [${vendor}] "${from}" → "${to}": ${r.modifiedCount} docs`);
    }
  }

  // ── 3. Split Costco "Disposable Restaurant Supplies" ───────────────────────
  const dispItems = await col.find({ vendor: "Costco", category: "Disposable Restaurant Supplies" }).toArray();
  let moved = 0, unmapped = [];
  for (const item of dispItems) {
    const correctCat = DISP_TO_CAT[item.name];
    if (correctCat) {
      await col.updateOne({ _id: item._id }, { $set: { category: correctCat } });
      moved++;
    } else {
      unmapped.push(item.name);
    }
  }
  console.log(`\n[3] Split "Disposable Restaurant Supplies": ${moved} moved`);
  if (unmapped.length) console.warn(`    Unmapped: ${unmapped.join(", ")}`);

  // ── 4. Create missing Costco items ─────────────────────────────────────────
  let created = 0, skipped = 0;
  console.log("\n[4] Creating missing Costco items:");
  for (const [category, names] of Object.entries(COSTCO_NEW_ITEMS)) {
    for (const name of names) {
      const exists = await col.findOne({ vendor: "Costco", category, name });
      if (exists) { skipped++; continue; }
      await col.insertOne({
        vendor: "Costco", category, name, brandOptions: [], unit: "",
        stock: 0, regPrice: 0, sizeText: "", isActive: true,
        createdAt: new Date(), updatedAt: new Date(),
      });
      console.log(`  + [${category}] ${name}`);
      created++;
    }
  }
  console.log(`    ${created} created, ${skipped} already existed`);

  // ── 5. Final verification: expected vs actual per vendor/category ───────────
  console.log("\n════════════════════════════════════════════════════════");
  console.log("  FINAL VERIFICATION");
  console.log("════════════════════════════════════════════════════════");

  for (const [vendor, cats] of Object.entries(EXPECTED_CATS)) {
    console.log(`\n  ${vendor}`);
    console.log("  " + "─".repeat(50));
    for (const cat of cats) {
      const n = await col.countDocuments({ vendor, category: cat });
      console.log(`    ${cat.padEnd(35)} ${String(n).padStart(4)}  ${n > 0 ? "✓" : "⚠ EMPTY"}`);
    }
    const total = await col.countDocuments({ vendor });
    console.log(`    ${"── TOTAL".padEnd(35)} ${String(total).padStart(4)}`);
  }

  const totalAfter = await col.countDocuments();
  console.log(`\nTotal docs after: ${totalAfter} (added ${totalAfter - totalBefore})`);
  console.log("════════════════════════════════════════════════════════\n");

  await mongoose.disconnect();
  console.log("Done.");
}

run().catch((e) => { console.error("fixProductData failed:", e); process.exit(1); });
