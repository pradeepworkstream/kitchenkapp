// vendorCategories.js
// Master category lists per vendor (used by frontend filters and admin UI)
export const VENDORS = ["Costco", "Mid East", "Spice Bazaar"];

export const VENDOR_CATEGORIES = {
  Costco: [
    "Beverages",
    "Bread & Frozen",
    "Chicken",
    "Citrus",
    "Cleaning Supplies",
    "Dairy & Refrigerated",
    "Disposable Restaurant Supplies",
    "Herbs",
    "Nuts & Dry Fruits",
    "Oils & Cooking Ingredients",
    "Protein",
    "Rice, Flour & Baking",
    "Seafood",
    "Vegetables & Produce",
  ],
  "Mid East": [
    "Beverages",
    "Bread & Frozen",
    "Chicken",
    "Coconut Products",
    "Dals, Beans & Pulses",
    "Fresh Vegetables & Herbs",
    "Frozen Items",
    "Goat",
    "Miscellaneous",
    "Nuts & Dry Fruits",
    "Rice, Flour & Grains",
    "Sauces, Pastes & Condiments",
    "Spice Powders",
    "Whole Spices",
  ],
  "Spice Bazaar": [
    "Bakery, Snacks & Ready-to-Eat",
    "Beverages",
    "Bread & Frozen",
    "Dairy & Refrigerated",
    "Dals & Pulses",
    "Fresh Vegetables & Greens",
    "Frozen Vegetables & Produce",
    "Miscellaneous",
    "Nuts & Dry Fruits",
    "Rice, Flour & Baking",
    "Sauces, Pastes & Chutneys",
    "Spice Powders & Masalas",
    "Whole Spices",
  ],
};

export const ALL_CATEGORIES = Array.from(
  new Set([
    ...VENDOR_CATEGORIES.Costco,
    ...VENDOR_CATEGORIES["Mid East"],
    ...VENDOR_CATEGORIES["Spice Bazaar"],
  ])
).sort((a, b) => a.localeCompare(b));

export default { VENDORS, VENDOR_CATEGORIES, ALL_CATEGORIES };
