/**
 * syncSpiceBazaar.js  —  node server/scripts/syncSpiceBazaar.js
 *
 * Full Spice Bazaar data audit & sync against masterInventory.js.
 * Safe to re-run (idempotent — no duplicates created).
 *
 * Steps:
 *  1. Deduplicate — remove exact (vendor+category+name) duplicates
 *  2. Fix misplaced items — move to correct category by name lookup
 *  3. Create missing items — any master product not found anywhere under Spice Bazaar
 *  4. Count verification — compare expected vs actual per category
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const MASTER   = require("../data/masterInventory");

const VENDOR = "Spice Bazaar";
const SB     = MASTER[VENDOR];

function norm(s) { return String(s || "").trim().toLowerCase(); }

async function run() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/kitchenkapp";
  await mongoose.connect(uri, { autoIndex: true });
  console.log("Connected:", uri.replace(/\/\/.*@/, "//***@"));

  const col = mongoose.connection.collection("inventories");

  const report = {
    deduped:   [],
    moved:     [],
    created:   [],
    alreadyOk: 0,
    errors:    [],
  };

  // ── Step 1: Deduplicate ──────────────────────────────────────────────────────
  console.log("\n── Step 1: Deduplication ──");
  const allItems = await col.find({ vendor: VENDOR }).toArray();
  const seen = {};
  for (const item of allItems) {
    const key = `${norm(item.category)}::${norm(item.name)}`;
    if (!seen[key]) {
      seen[key] = item;
    } else {
      await col.deleteOne({ _id: item._id });
      report.deduped.push({ name: item.name, category: item.category });
      console.log(`  DEDUPED: [${item.category}] ${item.name}`);
    }
  }
  if (report.deduped.length === 0) console.log("  (none)");

  // Build name → items lookup from deduped state
  const fresh = await col.find({ vendor: VENDOR }).toArray();
  const byName = {};
  for (const item of fresh) {
    const k = norm(item.name);
    if (!byName[k]) byName[k] = [];
    byName[k].push(item);
  }

  // ── Step 2 & 3: Validate / Move / Create ────────────────────────────────────
  console.log("\n── Step 2 & 3: Validate / Move / Create ──");

  for (const [masterCat, products] of Object.entries(SB)) {
    for (const productName of products) {
      try {
        const candidates = byName[norm(productName)] || [];

        // Already in correct category
        const correct = candidates.find(c => norm(c.category) === norm(masterCat));
        if (correct) {
          report.alreadyOk++;
          continue;
        }

        // Exists under a different category — move it
        const wrongCat = candidates[0];
        if (wrongCat) {
          await col.updateOne(
            { _id: wrongCat._id },
            { $set: { category: masterCat } }
          );
          report.moved.push({ name: productName, from: wrongCat.category, to: masterCat });
          console.log(`  MOVED:   "${productName}"  [${wrongCat.category}] → [${masterCat}]`);
          // Update local index
          byName[norm(productName)] = byName[norm(productName)].map(c =>
            c._id.toString() === wrongCat._id.toString()
              ? { ...c, category: masterCat }
              : c
          );
          continue;
        }

        // Not found — create
        await col.insertOne({
          vendor: VENDOR, category: masterCat, name: productName,
          brandOptions: [], unit: "", stock: 0, regPrice: 0,
          sizeText: "", isActive: true,
          createdAt: new Date(), updatedAt: new Date(),
        });
        report.created.push({ name: productName, category: masterCat });
        if (!byName[norm(productName)]) byName[norm(productName)] = [];
        byName[norm(productName)].push({ vendor: VENDOR, category: masterCat, name: productName });
        console.log(`  CREATED: [${masterCat}] ${productName}`);

      } catch (e) {
        report.errors.push(`[${masterCat}] ${productName}: ${e.message}`);
        console.error(`  ERROR:   [${masterCat}] ${productName} — ${e.message}`);
      }
    }
  }

  // ── Step 4: Count Verification ───────────────────────────────────────────────
  console.log("\n── Step 4: Count Verification ──");
  const counts = [];
  for (const [catName, products] of Object.entries(SB)) {
    const dbCount = await col.countDocuments({
      vendor: VENDOR,
      category: catName,
    });
    counts.push({ catName, expected: products.length, dbCount });
  }

  // Check for orphan items (in DB but not in any master category)
  const allAfter = await col.find({ vendor: VENDOR }).toArray();
  const masterNames = new Set(Object.values(SB).flat().map(n => norm(n)));
  const orphans = allAfter.filter(x => !masterNames.has(norm(x.name)));

  // ── Print Report ─────────────────────────────────────────────────────────────
  const totalExpected = Object.values(SB).reduce((s, arr) => s + arr.length, 0);
  const totalInDB     = await col.countDocuments({ vendor: VENDOR });

  console.log("\n════════════════════════════════════════════════════════════════");
  console.log("  SPICE BAZAAR AUDIT REPORT");
  console.log("════════════════════════════════════════════════════════════════");

  console.log(`\n  Total Categories Expected : ${Object.keys(SB).length}`);
  console.log(`  Total Categories Found    : ${counts.filter(c => c.dbCount > 0).length}`);
  console.log(`  Total Products Expected   : ${totalExpected}`);
  console.log(`  Total Products in DB      : ${totalInDB}`);

  console.log(`\n  Already Correct           : ${report.alreadyOk}`);
  console.log(`  Created (missing)         : ${report.created.length}`);
  console.log(`  Moved (wrong category)    : ${report.moved.length}`);
  console.log(`  Duplicates Removed        : ${report.deduped.length}`);
  console.log(`  Errors                    : ${report.errors.length}`);

  if (report.created.length) {
    console.log("\n  Created:");
    report.created.forEach(({ name, category }) => console.log(`    + [${category}] ${name}`));
  }
  if (report.moved.length) {
    console.log("\n  Moved:");
    report.moved.forEach(({ name, from, to }) => console.log(`    ~ "${name}"  [${from}] → [${to}]`));
  }
  if (report.deduped.length) {
    console.log("\n  Deduped:");
    report.deduped.forEach(({ name, category }) => console.log(`    - [${category}] ${name}`));
  }
  if (orphans.length) {
    console.log("\n  Orphan items (in DB but not in master):");
    orphans.forEach(x => console.log(`    ? [${x.category}] ${x.name}`));
  }
  if (report.errors.length) {
    console.log("\n  Errors:");
    report.errors.forEach(e => console.log(`    ! ${e}`));
  }

  console.log("\n  ─────────────────────────────────────────────────────────────");
  console.log(`  ${"Category".padEnd(35)} ${"Expected".padStart(8)} ${"In DB".padStart(6)}  Status`);
  console.log("  " + "─".repeat(58));
  for (const { catName, expected, dbCount } of counts) {
    const flag = dbCount === expected ? "✓" : dbCount < expected ? "⚠ SHORT" : "⚠ EXTRA";
    console.log(`  ${catName.padEnd(35)} ${String(expected).padStart(8)} ${String(dbCount).padStart(6)}  ${flag}`);
  }
  const totE = counts.reduce((s, r) => s + r.expected, 0);
  const totD = counts.reduce((s, r) => s + r.dbCount,  0);
  console.log("  " + "─".repeat(58));
  console.log(`  ${"TOTAL".padEnd(35)} ${String(totE).padStart(8)} ${String(totD).padStart(6)}`);
  console.log("\n════════════════════════════════════════════════════════════════\n");

  await mongoose.disconnect();
}

run().catch(e => { console.error("syncSpiceBazaar failed:", e); process.exit(1); });
