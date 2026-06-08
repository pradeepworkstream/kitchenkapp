/**
 * syncCostco.js  —  node server/scripts/syncCostco.js
 *
 * Full Costco data audit & sync against the authoritative master list.
 * For every category + product it will:
 *   1. Skip   — item already exists in the correct category.
 *   2. Move   — item exists under Costco but wrong category → reassign.
 *   3. Create — item does not exist at all → insert.
 *   4. Dedupe — same vendor+category+name exists more than once → remove extras.
 *
 * Prints a full report at the end.
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose      = require("mongoose");
const Vendor        = require("../models/Vendor");
const Category      = require("../models/Category");
const InventoryItem = require("../models/InventoryItem");
const MASTER        = require("../data/masterInventory");

const COSTCO_MASTER = MASTER["Costco"];

function norm(s) { return String(s || "").trim().toLowerCase(); }
function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

async function run() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/kitchenkapp";
  await mongoose.connect(uri, { autoIndex: true });
  console.log("Connected:", uri.replace(/\/\/.*@/, "//***@"));

  // ── Load Costco vendor doc ────────────────────────────────────────────────
  const vendorDoc = await Vendor.findOne({ name: "Costco" }).lean();
  if (!vendorDoc) {
    console.error('FATAL: Vendor "Costco" not found. Run migrate.js first.');
    process.exit(1);
  }
  const vendorId = vendorDoc._id;

  // ── Build category map ────────────────────────────────────────────────────
  const categoryDocs = await Category.find({ vendor: "Costco" }).lean();
  const categoryMap  = {};
  for (const c of categoryDocs) categoryMap[norm(c.name)] = c;

  // Ensure all master categories exist
  for (const catName of Object.keys(COSTCO_MASTER)) {
    if (!categoryMap[norm(catName)]) {
      const created = await Category.create({ vendorId, vendor: "Costco", name: catName });
      categoryMap[norm(catName)] = created;
      console.log(`  CREATED category: ${catName}`);
    }
  }

  // ── Report accumulators ───────────────────────────────────────────────────
  const report = { created: [], moved: [], deduped: [], alreadyOk: 0, errors: [] };

  // ── Step 1: Deduplicate ───────────────────────────────────────────────────
  console.log("\n── Step 1: Deduplication ──");
  const allItems = await InventoryItem.find({ vendor: "Costco" }).lean();
  const seen     = {};

  for (const item of allItems) {
    const key = `${norm(item.category)}::${norm(item.name)}`;
    if (!seen[key]) {
      seen[key] = item;
    } else {
      const preferNew = !seen[key].categoryId && item.categoryId;
      const toDelete  = preferNew ? seen[key] : item;
      const toKeep    = preferNew ? item : seen[key];
      await InventoryItem.findByIdAndDelete(toDelete._id);
      seen[key] = toKeep;
      report.deduped.push({ name: item.name, category: item.category });
      console.log(`  DEDUPED: [${item.category}] ${item.name}`);
    }
  }

  // Rebuild name→items lookup from deduped state
  const freshItems = await InventoryItem.find({ vendor: "Costco" }).lean();
  const byName     = {};
  for (const item of freshItems) {
    const k = norm(item.name);
    if (!byName[k]) byName[k] = [];
    byName[k].push(item);
  }

  // ── Step 2: Validate / Create / Move ─────────────────────────────────────
  console.log("\n── Step 2: Validate / Create / Move ──");

  for (const [masterCatName, products] of Object.entries(COSTCO_MASTER)) {
    const catDoc = categoryMap[norm(masterCatName)];
    if (!catDoc) {
      report.errors.push(`Category "${masterCatName}" missing`);
      continue;
    }

    for (const productName of products) {
      try {
        const candidates = byName[norm(productName)] || [];

        // Already in the correct category
        const correct = candidates.find((c) => norm(c.category) === norm(masterCatName));
        if (correct) {
          // Backfill ids if missing
          if (!correct.vendorId || !correct.categoryId) {
            await InventoryItem.findByIdAndUpdate(correct._id, {
              $set: { vendorId, categoryId: catDoc._id },
            });
          }
          report.alreadyOk++;
          continue;
        }

        // Exists under wrong category — move it
        const wrongCat = candidates[0];
        if (wrongCat) {
          await InventoryItem.findByIdAndUpdate(wrongCat._id, {
            $set: { category: masterCatName, categoryId: catDoc._id, vendorId },
          });
          report.moved.push({ name: productName, from: wrongCat.category, to: masterCatName });
          console.log(`  MOVED:   "${productName}"  [${wrongCat.category}] → [${masterCatName}]`);
          byName[norm(productName)] = byName[norm(productName)].map((c) =>
            c._id.toString() === wrongCat._id.toString()
              ? { ...c, category: masterCatName }
              : c
          );
          continue;
        }

        // Does not exist — create
        const newItem = await InventoryItem.create({
          vendorId,
          vendor:         "Costco",
          categoryId:     catDoc._id,
          category:       masterCatName,
          name:           productName,
          quantityNeeded: 1,
          unit:           "Box",
        });
        report.created.push({ name: productName, category: masterCatName });
        if (!byName[norm(productName)]) byName[norm(productName)] = [];
        byName[norm(productName)].push(newItem);
        console.log(`  CREATED: [${masterCatName}] ${productName}`);

      } catch (e) {
        report.errors.push(`[${masterCatName}] ${productName}: ${e.message}`);
        console.error(`  ERROR:   [${masterCatName}] ${productName} — ${e.message}`);
      }
    }
  }

  // ── Step 3: Count verification ────────────────────────────────────────────
  console.log("\n── Step 3: Count verification ──");
  const counts = [];
  for (const [catName, products] of Object.entries(COSTCO_MASTER)) {
    const dbCount = await InventoryItem.countDocuments({
      vendor:   new RegExp(`^Costco$`, "i"),
      category: new RegExp(`^${escapeRegex(catName)}$`, "i"),
    });
    counts.push({ catName, expected: products.length, dbCount });
  }

  // ── Print report ──────────────────────────────────────────────────────────
  console.log("\n════════════════════════════════════════════════════════");
  console.log("  COSTCO SYNC REPORT");
  console.log("════════════════════════════════════════════════════════");

  console.log(`\nAlready correct : ${report.alreadyOk}`);

  console.log(`\nCreated (${report.created.length}):`);
  report.created.length
    ? report.created.forEach(({ name, category }) => console.log(`  + [${category}] ${name}`))
    : console.log("  (none)");

  console.log(`\nMoved (${report.moved.length}):`);
  report.moved.length
    ? report.moved.forEach(({ name, from, to }) => console.log(`  ~ "${name}"  [${from}] → [${to}]`))
    : console.log("  (none)");

  console.log(`\nDeduped (${report.deduped.length}):`);
  report.deduped.length
    ? report.deduped.forEach(({ name, category }) => console.log(`  - [${category}] ${name}`))
    : console.log("  (none)");

  console.log(`\nErrors (${report.errors.length}):`);
  report.errors.length
    ? report.errors.forEach((e) => console.log(`  ! ${e}`))
    : console.log("  (none)");

  console.log("\n────────────────────────────────────────────────────────");
  console.log(`  ${"Category".padEnd(35)} ${"Expected".padStart(8)} ${"In DB".padStart(6)} Status`);
  console.log("  " + "─".repeat(60));
  for (const { catName, expected, dbCount } of counts) {
    const flag = dbCount === expected ? "✓" : dbCount < expected ? "⚠ SHORT" : "⚠ EXTRA";
    console.log(`  ${catName.padEnd(35)} ${String(expected).padStart(8)} ${String(dbCount).padStart(6)}  ${flag}`);
  }
  const totE = counts.reduce((s, r) => s + r.expected, 0);
  const totD = counts.reduce((s, r) => s + r.dbCount,  0);
  console.log("  " + "─".repeat(60));
  console.log(`  ${"TOTAL".padEnd(35)} ${String(totE).padStart(8)} ${String(totD).padStart(6)}`);
  console.log("\n════════════════════════════════════════════════════════\n");

  await mongoose.disconnect();
}

run().catch((e) => { console.error("syncCostco failed:", e); process.exit(1); });
