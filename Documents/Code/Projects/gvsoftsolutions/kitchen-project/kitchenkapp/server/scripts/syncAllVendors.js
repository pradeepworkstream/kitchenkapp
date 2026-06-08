/**
 * syncAllVendors.js  —  node server/scripts/syncAllVendors.js
 *
 * Full audit + sync for ALL vendors against masterInventory.js.
 * Idempotent — safe to re-run without creating duplicates.
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const MASTER   = require("../data/masterInventory");

function norm(s) { return String(s || "").trim().toLowerCase(); }

async function run() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/kitchenkapp";
  await mongoose.connect(uri, { autoIndex: true });
  console.log("Connected:", uri.replace(/\/\/.*@/, "//***@"), "\n");

  const col = mongoose.connection.collection("inventories");

  const globalReport = {
    vendors: {},
    totalDeduped:  0,
    totalMoved:    0,
    totalCreated:  0,
    totalOk:       0,
    totalErrors:   0,
    wrongVendor:   [],
  };

  // ── Check for items with unrecognised vendors ────────────────────────────────
  const knownVendors = Object.keys(MASTER);
  const allDocs = await col.find({}).toArray();
  for (const doc of allDocs) {
    if (!knownVendors.includes(doc.vendor)) {
      globalReport.wrongVendor.push({ id: doc._id, vendor: doc.vendor, name: doc.name });
    }
  }

  // ── Per-vendor audit ─────────────────────────────────────────────────────────
  for (const [vendor, categories] of Object.entries(MASTER)) {
    console.log(`\n${"═".repeat(65)}`);
    console.log(`  VENDOR: ${vendor}`);
    console.log("═".repeat(65));

    const vr = { deduped: [], moved: [], created: [], alreadyOk: 0, errors: [], wrongCat: [] };
    globalReport.vendors[vendor] = vr;

    // Step 1: Deduplicate for this vendor
    const vendorItems = await col.find({ vendor }).toArray();
    const seen = {};
    for (const item of vendorItems) {
      const key = `${norm(item.category)}::${norm(item.name)}`;
      if (!seen[key]) {
        seen[key] = item;
      } else {
        await col.deleteOne({ _id: item._id });
        vr.deduped.push({ name: item.name, category: item.category });
        console.log(`  DEDUPED: [${item.category}] ${item.name}`);
      }
    }

    // Build name → items lookup
    const fresh = await col.find({ vendor }).toArray();
    const byName = {};
    for (const item of fresh) {
      const k = norm(item.name);
      if (!byName[k]) byName[k] = [];
      byName[k].push(item);
    }

    // Build set of expected names (for wrong-category detection)
    const masterNameToCat = {};
    for (const [cat, prods] of Object.entries(categories)) {
      for (const p of prods) masterNameToCat[norm(p)] = cat;
    }

    // Detect items in DB that exist but are in wrong category (not already handled)
    for (const item of fresh) {
      const expectedCat = masterNameToCat[norm(item.name)];
      if (expectedCat && norm(item.category) !== norm(expectedCat)) {
        vr.wrongCat.push({ name: item.name, actual: item.category, expected: expectedCat });
      }
    }

    // Step 2 & 3: Move / Create
    for (const [masterCat, products] of Object.entries(categories)) {
      for (const productName of products) {
        try {
          const candidates = byName[norm(productName)] || [];
          const correct = candidates.find(c => norm(c.category) === norm(masterCat));
          if (correct) { vr.alreadyOk++; continue; }

          const wrongCat = candidates[0];
          if (wrongCat) {
            await col.updateOne({ _id: wrongCat._id }, { $set: { category: masterCat } });
            vr.moved.push({ name: productName, from: wrongCat.category, to: masterCat });
            console.log(`  MOVED:   "${productName}"  [${wrongCat.category}] → [${masterCat}]`);
            byName[norm(productName)] = (byName[norm(productName)] || []).map(c =>
              c._id.toString() === wrongCat._id.toString() ? { ...c, category: masterCat } : c
            );
            continue;
          }

          await col.insertOne({
            vendor, category: masterCat, name: productName,
            brandOptions: [], unit: "", stock: 0, regPrice: 0,
            sizeText: "", isActive: true,
            createdAt: new Date(), updatedAt: new Date(),
          });
          vr.created.push({ name: productName, category: masterCat });
          if (!byName[norm(productName)]) byName[norm(productName)] = [];
          byName[norm(productName)].push({ vendor, category: masterCat, name: productName });
          console.log(`  CREATED: [${masterCat}] ${productName}`);
        } catch (e) {
          vr.errors.push(`[${masterCat}] ${productName}: ${e.message}`);
        }
      }
    }

    globalReport.totalDeduped += vr.deduped.length;
    globalReport.totalMoved   += vr.moved.length;
    globalReport.totalCreated += vr.created.length;
    globalReport.totalOk      += vr.alreadyOk;
    globalReport.totalErrors  += vr.errors.length;
  }

  // ── FULL VALIDATION REPORT ────────────────────────────────────────────────────
  console.log(`\n\n${"═".repeat(65)}`);
  console.log("  FULL VALIDATION REPORT — ALL VENDORS");
  console.log("═".repeat(65));

  let grandExpCats = 0, grandExpProds = 0, grandDbCats = 0, grandDbProds = 0;
  const missingCats = [], missingProds = [], wrongCatItems = [], dupeItems = [], wrongVendorItems = [];

  for (const [vendor, categories] of Object.entries(MASTER)) {
    const vr = globalReport.vendors[vendor];
    const expCats  = Object.keys(categories).length;
    const expProds = Object.values(categories).reduce((s, a) => s + a.length, 0);

    let foundCats = 0;
    const catCounts = [];
    for (const [cat, prods] of Object.entries(categories)) {
      const n = await col.countDocuments({ vendor, category: cat });
      catCounts.push({ cat, expected: prods.length, found: n });
      if (n > 0) foundCats++;
      if (n === 0) missingCats.push(`${vendor} / ${cat}`);
      const missing = prods.filter(p => !catCounts.find(() => false)); // placeholder
    }

    const dbTotal = await col.countDocuments({ vendor });

    grandExpCats  += expCats;
    grandExpProds += expProds;
    grandDbCats   += foundCats;
    grandDbProds  += dbTotal;

    if (vr.deduped.length) vr.deduped.forEach(x => dupeItems.push(`${vendor} / [${x.category}] ${x.name}`));
    if (vr.wrongCat.length) vr.wrongCat.forEach(x => wrongCatItems.push(`${vendor}: "${x.name}" in [${x.actual}] expected [${x.expected}]`));

    console.log(`\n  ── ${vendor} ──`);
    console.log(`  ${"Category".padEnd(38)} ${"Exp".padStart(4)} ${"DB".padStart(5)}  Status`);
    console.log("  " + "─".repeat(58));
    for (const { cat, expected, found } of catCounts) {
      const flag = found === expected ? "✓" : found === 0 ? "✗ EMPTY" : found < expected ? "⚠ SHORT" : "⚠ EXTRA";
      console.log(`  ${cat.padEnd(38)} ${String(expected).padStart(4)} ${String(found).padStart(5)}  ${flag}`);
      if (found < expected) {
        const dbItems = await col.find({ vendor, category: cat }).toArray();
        const dbNames = new Set(dbItems.map(x => norm(x.name)));
        const masterItems = Object.values(categories[cat] !== undefined ? { [cat]: categories[cat] } : {})[0] || categories[cat];
        const missing = masterItems.filter(p => !dbNames.has(norm(p)));
        missing.forEach(p => missingProds.push(`${vendor} / [${cat}] ${p}`));
      }
    }
    console.log("  " + "─".repeat(58));
    console.log(`  ${"TOTAL".padEnd(38)} ${String(expProds).padStart(4)} ${String(dbTotal).padStart(5)}`);
    console.log(`  Cats: ${foundCats}/${expCats}  |  Created: ${vr.created.length}  Moved: ${vr.moved.length}  Deduped: ${vr.deduped.length}  Errors: ${vr.errors.length}`);
  }

  // Wrong vendor items
  globalReport.wrongVendor.forEach(x => wrongVendorItems.push(`Unknown vendor "${x.vendor}": ${x.name}`));

  console.log(`\n${"═".repeat(65)}`);
  console.log("  SUMMARY");
  console.log("═".repeat(65));
  console.log(`\n  Total Categories Expected  : ${grandExpCats}`);
  console.log(`  Total Categories in DB     : ${grandDbCats}  ${grandDbCats === grandExpCats ? "✓" : "⚠"}`);
  console.log(`  Total Products Expected    : ${grandExpProds}`);
  console.log(`  Total Products in DB       : ${grandDbProds}  ${grandDbProds >= grandExpProds ? "✓" : "⚠"}`);

  console.log(`\n  Already Correct            : ${globalReport.totalOk}`);
  console.log(`  Created (was missing)      : ${globalReport.totalCreated}`);
  console.log(`  Moved (wrong category)     : ${globalReport.totalMoved}`);
  console.log(`  Duplicates Removed         : ${globalReport.totalDeduped}`);
  console.log(`  Errors                     : ${globalReport.totalErrors}`);

  const pr = (label, arr) => {
    console.log(`\n  ${label} (${arr.length}):`);
    arr.length ? arr.forEach(x => console.log(`    ${x}`)) : console.log("    (none)");
  };
  pr("Missing Categories", missingCats);
  pr("Missing Products after sync", missingProds);
  pr("Duplicates Removed", dupeItems);
  pr("Products in Wrong Category (pre-fix)", wrongCatItems);
  pr("Products with Unknown Vendor", wrongVendorItems);

  console.log(`\n${"═".repeat(65)}\n`);
  await mongoose.disconnect();
}

run().catch(e => { console.error("syncAllVendors failed:", e); process.exit(1); });
