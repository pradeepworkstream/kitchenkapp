// vendorCategories.js
// Authoritative frontend copy of the master purchase list structure.
// Vendor names must exactly match the backend (Vendor collection).

export const VENDORS = ["Costco", "Mid East Market", "Spice Bazaar"];

export const VENDOR_CATEGORIES = {
  "Costco": [
    "Chicken",
    "Seafood",
    "Other Protein",
    "Dairy & Refrigerated",
    "Vegetables",
    "Herbs",
    "Citrus",
    "Rice, Flour & Baking",
    "Oils & Cooking Ingredients",
    "Nuts & Dry Fruits",
    "Beverages",
    "Bread & Frozen",
    "Cleaning Supplies",
    "Plates & Trays",
    "Cups & Containers",
    "Cutlery & Paper Goods",
    "Storage",
    "Kitchen Supplies",
    "Produce",
    "Protein",
    "Staples",
    "Restaurant Supplies",
  ],
  "Mid East Market": [
    "Chicken (Skinless)",
    "Goat",
    "Fresh Vegetables & Herbs",
    "Rice, Flour & Grains",
    "Dals, Beans & Pulses",
    "Spices & Whole Masalas",
    "Spice Powders",
    "Sauces, Pastes & Condiments",
    "Coconut Products",
    "Frozen Items",
    "Bakery & Ready-to-Eat",
    "Beverages",
    "Dry Fruits & Miscellaneous",
    "Frequently Ordered in Full Cases",
  ],
  "Spice Bazaar": [
    "Fresh Vegetables & Greens",
    "Frozen Vegetables & Produce",
    "Rice, Flours & Grains",
    "Dals & Pulses",
    "Nuts & Seeds",
    "Whole Spices",
    "Spice Powders & Masalas",
    "Sauces, Pastes & Chutneys",
    "Bakery, Snacks & Ready-to-Eat",
    "Dairy & Dessert Ingredients",
    "Beverages",
    "Miscellaneous",
  ],
};

export const ALL_CATEGORIES = Array.from(
  new Set(Object.values(VENDOR_CATEGORIES).flat())
).sort((a, b) => a.localeCompare(b));

export const DEFAULT_UNITS = [
  "Bag", "Bottle", "Box", "Carton", "Case",
  "Kg", "Lb", "Pack", "Piece", "Tray",
];

export const DEFAULT_QUANTITIES = [1, 2, 3, 4, 5, 10, 15, 20, 25, 50, 100];

export default { VENDORS, VENDOR_CATEGORIES, ALL_CATEGORIES, DEFAULT_UNITS, DEFAULT_QUANTITIES };
