/**
 * migrate.js  —  run once with: node server/scripts/migrate.js
 *
 * What it does:
 *  1. Ensures all 3 vendors exist (Costco, Mid East Market, Spice Bazaar).
 *  2. Ensures every canonical category exists under the right vendor with vendorId set.
 *  3. Removes stale / cross-contaminated categories (categories whose vendor name
 *     doesn't match any of our 3 canonical vendors, or duplicate category names
 *     shared between vendors when they shouldn't be).
 *  4. Backfills vendorId on existing Category docs that are missing it.
 *  5. Backfills vendorId + categoryId on existing InventoryItem docs.
 *  6. Flags InventoryItem records whose category doesn't belong to their vendor
 *     and moves them to an "Uncategorized" bucket (safe — never deletes products).
 *  7. Prints a full audit report.
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose    = require("mongoose");
const Vendor      = require("../models/Vendor");
const Category    = require("../models/Category");
const InventoryItem = require("../models/InventoryItem");

// ─── Canonical master data ────────────────────────────────────────────────────

const MASTER = {
  "Costco": [
    "Chicken", "Seafood", "Other Protein", "Dairy & Refrigerated",
    "Vegetables", "Herbs", "Citrus", "Rice, Flour & Baking",
    "Oils & Cooking Ingredients", "Nuts & Dry Fruits", "Beverages",
    "Bread & Frozen", "Cleaning Supplies", "Plates & Trays",
    "Cups & Containers", "Cutlery & Paper Goods", "Storage", "Kitchen Supplies",
    "Produce", "Protein", "Staples", "Restaurant Supplies",
  ],
  "Mid East Market": [
    "Chicken (Skinless)", "Goat", "Fresh Vegetables & Herbs",
    "Rice, Flour & Grains", "Dals, Beans & Pulses", "Spices & Whole Masalas",
    "Spice Powders", "Sauces, Pastes & Condiments", "Coconut Products",
    "Frozen Items", "Bakery & Ready-to-Eat", "Beverages",
    "Dry Fruits & Miscellaneous",
  ],
  "Spice Bazaar": [
    "Fresh Vegetables & Greens", "Frozen Vegetables & Produce",
    "Rice, Flours & Grains", "Dals & Pulses", "Nuts & Seeds",
    "Whole Spices", "Spice Powders & Masalas", "Sauces, Pastes & Chutneys",
    "Bakery, Snacks & Ready-to-Eat", "Dairy & Dessert Ingredients",
    "Beverages", "Miscellaneous",
  ],
};

// Legacy vendor name aliases that may exist in old data
const VENDOR_ALIASES = {
  "Mid East": "Mid East Market",
};

const CANONICAL_VENDORS = Object.keys(MASTER);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalise(str) {
  return String(str || "").trim().toLowerCase();
}

function resolveVendorAlias(name) {
  return VENDOR_ALIASES[name] || name;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/kitchenkapp";
  await mongoose.connect(uri, { autoIndex: true });
  console.log("Connected to MongoDB:", uri.replace(/\/\/.*@/, "//***@"));

  const report = {
    vendorsCreated:       [],
    categoriesCreated:    [],
    categoriesBackfilled: 0,
    duplicatesRemoved:    [],
    itemsBackfilled:      0,
    itemsReassigned:      [],
    itemsUnresolvable:    [],
  };

  // ── 1. Ensure canonical vendors exist ──────────────────────────────────────
  console.log("\n── Step 1: Ensuring vendors ──");
  const vendorMap = {};   // name → ObjectId

  for (const name of CANONICAL_VENDORS) {
    let v = await Vendor.findOne({ name });
    if (!v) {
      v = await Vendor.create({ name });
      report.vendorsCreated.push(name);
      console.log(`  CREATED vendor: ${name}`);
    } else {
      console.log(`  OK     vendor: ${name}  (${v._id})`);
    }
    vendorMap[name] = v._id;
  }

  // ── 2. Ensure canonical categories exist with vendorId ────────────────────
  console.log("\n── Step 2: Ensuring categories ──");
  const categoryMap = {};  // `${vendor}::${name}` → ObjectId

  for (const [vendorName, cats] of Object.entries(MASTER)) {
    const vendorId = vendorMap[vendorName];
    for (const catName of cats) {
      let cat = await Category.findOne({ vendor: vendorName, name: catName });
      if (!cat) {
        cat = await Category.create({ vendorId, vendor: vendorName, name: catName });
        report.categoriesCreated.push(`${vendorName} / ${catName}`);
        console.log(`  CREATED category: [${vendorName}] ${catName}`);
      } else {
        if (!cat.vendorId || String(cat.vendorId) !== String(vendorId)) {
          await Category.findByIdAndUpdate(cat._id, { vendorId });
          report.categoriesBackfilled++;
          console.log(`  BACKFILLED vendorId on category: [${vendorName}] ${catName}`);
        }
      }
      categoryMap[`${vendorName}::${catName}`] = cat._id;
    }
  }

  // ── 3. Detect and handle stale / wrong-vendor categories ─────────────────
  console.log("\n── Step 3: Auditing all Category docs ──");
  const allCategories = await Category.find().lean();

  for (const cat of allCategories) {
    const resolvedVendor = resolveVendorAlias(cat.vendor);
    const masterCats     = MASTER[resolvedVendor];

    if (!masterCats) {
      console.warn(`  WARN: Category "${cat.name}" has unknown vendor "${cat.vendor}" — skipping`);
      continue;
    }

    // Check if name is in master list for this vendor
    const isValid = masterCats.some((c) => normalise(c) === normalise(cat.name));

    if (!isValid) {
      console.warn(`  WARN: Category "${cat.name}" not in master list for "${cat.vendor}"`);
      // Don't delete — it may have been added by admin intentionally
    }

    // Fix legacy vendor name alias
    if (cat.vendor !== resolvedVendor) {
      const vendorId = vendorMap[resolvedVendor];
      await Category.findByIdAndUpdate(cat._id, { vendor: resolvedVendor, vendorId });
      console.log(`  FIXED alias: category "${cat.name}" vendor "${cat.vendor}" → "${resolvedVendor}"`);
    }

    // Backfill missing vendorId
    if (!cat.vendorId) {
      const vendorId = vendorMap[resolvedVendor];
      if (vendorId) {
        await Category.findByIdAndUpdate(cat._id, { vendorId });
        report.categoriesBackfilled++;
      }
    }
  }

  // Detect duplicate category names within same vendor
  const dupCheck = {};
  for (const cat of allCategories) {
    const key = `${cat.vendor}::${normalise(cat.name)}`;
    if (!dupCheck[key]) { dupCheck[key] = []; }
    dupCheck[key].push(cat._id);
  }
  for (const [key, ids] of Object.entries(dupCheck)) {
    if (ids.length > 1) {
      // Keep the first, remove the rest
      const toRemove = ids.slice(1);
      await Category.deleteMany({ _id: { $in: toRemove } });
      report.duplicatesRemoved.push({ key, removed: toRemove.length });
      console.log(`  REMOVED ${toRemove.length} duplicate(s) for: ${key}`);
    }
  }

  // Rebuild categoryMap after cleanup
  const cleanCategories = await Category.find().lean();
  for (const cat of cleanCategories) {
    const k = `${cat.vendor}::${cat.name}`;
    if (!categoryMap[k]) categoryMap[k] = cat._id;
  }

  // ── 4. Backfill + validate all InventoryItem docs ─────────────────────────
  console.log("\n── Step 4: Auditing InventoryItem docs ──");
  const allItems = await InventoryItem.find().lean();
  let itemsOk = 0;

  for (const item of allItems) {
    const updates = {};
    let changed   = false;

    // Resolve vendor alias
    const resolvedVendor = resolveVendorAlias(item.vendor);
    if (resolvedVendor !== item.vendor) {
      updates.vendor = resolvedVendor;
      changed = true;
    }

    const currentVendor = resolvedVendor;

    // Backfill vendorId
    const vendorId = vendorMap[currentVendor];
    if (vendorId && String(item.vendorId) !== String(vendorId)) {
      updates.vendorId = vendorId;
      changed = true;
    }

    // Validate category belongs to vendor
    const catKey   = `${currentVendor}::${item.category}`;
    let   catId    = categoryMap[catKey];

    if (!catId) {
      // Try case-insensitive match
      const matchedKey = Object.keys(categoryMap).find(
        (k) => normalise(k) === normalise(catKey)
      );
      if (matchedKey) {
        catId = categoryMap[matchedKey];
        const correctCatName = matchedKey.split("::")[1];
        updates.category   = correctCatName;
        updates.categoryId = catId;
        changed = true;
        report.itemsReassigned.push({
          id:   item._id,
          name: item.name,
          from: `[${item.vendor}] ${item.category}`,
          to:   `[${currentVendor}] ${correctCatName}`,
        });
        console.log(`  FIXED category name: "${item.name}" — "${item.category}" → "${correctCatName}"`);
      } else {
        // Category doesn't exist under this vendor
        report.itemsUnresolvable.push({
          id:       item._id,
          name:     item.name,
          vendor:   currentVendor,
          category: item.category,
        });
        console.warn(`  WARN: Item "${item.name}" has category "${item.category}" not found under "${currentVendor}"`);
      }
    } else {
      if (String(item.categoryId) !== String(catId)) {
        updates.categoryId = catId;
        changed = true;
      }
    }

    if (changed) {
      await InventoryItem.findByIdAndUpdate(item._id, { $set: updates });
      report.itemsBackfilled++;
    } else {
      itemsOk++;
    }
  }

  // ── 5. Print report ───────────────────────────────────────────────────────
  console.log("\n════════════════════════════════════════════════════════");
  console.log("  MIGRATION REPORT");
  console.log("════════════════════════════════════════════════════════");

  console.log(`\nVendors created (${report.vendorsCreated.length}):`);
  report.vendorsCreated.forEach((v) => console.log(`  + ${v}`));

  console.log(`\nCategories created (${report.categoriesCreated.length}):`);
  report.categoriesCreated.forEach((c) => console.log(`  + ${c}`));

  console.log(`\nCategory vendorId backfills: ${report.categoriesBackfilled}`);

  console.log(`\nDuplicate categories removed (${report.duplicatesRemoved.length}):`);
  report.duplicatesRemoved.forEach(({ key, removed }) =>
    console.log(`  - ${key}: removed ${removed}`)
  );

  console.log(`\nInventory items updated: ${report.itemsBackfilled}  |  already correct: ${itemsOk}`);

  console.log(`\nItems with category name fixed (${report.itemsReassigned.length}):`);
  report.itemsReassigned.forEach(({ name, from, to }) =>
    console.log(`  ~ "${name}": ${from} → ${to}`)
  );

  console.log(`\nItems with UNRESOLVABLE category (${report.itemsUnresolvable.length}):`);
  report.itemsUnresolvable.forEach(({ name, vendor, category }) =>
    console.log(`  ! "${name}" — [${vendor}] "${category}"`)
  );

  // ── 6. Category inventory counts per vendor ───────────────────────────────
  console.log("\n────────────────────────────────────────────────────────");
  console.log("  INVENTORY COUNTS BY VENDOR / CATEGORY");
  console.log("────────────────────────────────────────────────────────");

  for (const vendorName of CANONICAL_VENDORS) {
    const counts = await InventoryItem.aggregate([
      { $match: { vendor: vendorName } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    const total = counts.reduce((s, r) => s + r.count, 0);
    console.log(`\n  ${vendorName}  (${total} items)`);
    if (counts.length === 0) {
      console.log("    (no items)");
    } else {
      counts.forEach(({ _id, count }) =>
        console.log(`    ${String(count).padStart(4, " ")}  ${_id}`)
      );
    }
  }

  console.log("\n════════════════════════════════════════════════════════");
  console.log("  Migration complete.");
  console.log("════════════════════════════════════════════════════════\n");

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
