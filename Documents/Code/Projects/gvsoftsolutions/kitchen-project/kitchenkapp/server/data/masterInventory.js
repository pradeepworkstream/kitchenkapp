/**
 * masterInventory.js
 * Single source of truth for all vendor → category → product data.
 * Imported by: lookups.js (auto-seed), syncCostco.js, seedInventory.js
 */

const MASTER_INVENTORY = {
  // ── COSTCO ──────────────────────────────────────────────────────────────────
  "Costco": {
    "Chicken": [
      "Boneless Skinless Chicken Breast",
      "Boneless Skinless Chicken Thighs",
    ],
    "Seafood": [
      "Tilapia", "Salmon", "Shrimp", "Fish Filets",
    ],
    "Other Protein": [
      "Goat Cubes",
      "Eggs (Large Commercial Boxes)",
      "Paneer",
    ],
    "Dairy & Refrigerated": [
      "Whole Milk", "Half & Half", "Heavy Whipping Cream",
      "Yogurt (5-Gallon Tubs)", "Unsalted Butter", "Cheese",
    ],
    "Vegetables": [
      "Tomatoes", "Yellow Onions (40-50 lb bags)", "Red Onions",
      "Russet Potatoes", "Bell Peppers", "Green Beans", "Cabbage",
      "Carrots", "Garlic", "Peeled Garlic", "Spring Onions",
      "Spinach", "Asparagus", "Cauliflower", "Ginger", "Serrano Peppers",
    ],
    "Herbs": [
      "Cilantro", "Mint",
    ],
    "Citrus": [
      "Lemons", "Limes", "Lemon Juice", "Lime Juice",
    ],
    "Rice, Flour & Baking": [
      "Royal Chef Basmati Rice", "Long Grain Rice", "Sona Masoori Rice",
      "All-Purpose Flour", "White Corn Flour", "Sugar", "Salt",
    ],
    "Oils & Cooking Ingredients": [
      "Canola Cooking Oil", "Canola Frying Oil", "Vinegar",
      "Soy Sauce", "Chili Garlic Sauce", "Ketchup", "Diced Tomatoes (Cases)",
    ],
    "Nuts & Dry Fruits": [
      "Roasted Unsalted Cashews", "Raw Cashews", "Almonds", "Sliced Almonds",
    ],
    "Beverages": [
      "Water Bottles", "Coconut Water",
    ],
    "Bread & Frozen": [
      "Parathas", "Bread",
    ],
    "Cleaning Supplies": [
      "Dawn Dish Soap", "Fabulous Cleaner", "Windex", "Bleach Cleaner",
      "Degreaser", "Scotch Scrubbers", "Steel Dish Scrubbers",
    ],
    "Plates & Trays": [
      "Dinner Plates", "Snack Plates", "Portion Plates",
      "Full Trays", "Half Trays", "One-Third Trays",
    ],
    "Cups & Containers": [
      "4 oz Cups", "8 oz Clear Cups with Lids",
      "1 Liter Clear Containers with Lids", "Square Food Containers",
      "To-Go Boxes", "Breakfast Boxes",
    ],
    "Cutlery & Paper Goods": [
      "Spoons", "Forks", "Napkins", "Bounty Paper Towels",
      "Tissue Paper", "Toilet Paper",
    ],
    "Storage": [
      "Gallon Ziplock Bags", "Quart Ziplock Bags",
      "Heavy Duty Trash Bags (33 Gallon)", "To-Go Bags",
    ],
    "Kitchen Supplies": [
      "Heavy Duty Foil", "Food Wrap Foil", "Lighters",
    ],
    "Produce": [
      "Tomatoes", "Yellow Onions", "Red Onions", "Garlic",
      "Bell Peppers", "Beans", "Potatoes", "Milk",
    ],
    "Protein": [
      "Chicken Breast", "Chicken Thighs", "Eggs", "Paneer", "Yogurt",
    ],
    "Staples": [
      "Basmati Rice", "Canola Oil", "Butter", "Cashews",
    ],
    "Restaurant Supplies": [
      "Plates", "Boxes", "Cups", "Trash Bags", "Foil", "Ziplocks",
      "Cleaning Supplies",
    ],
  },

  // ── MID EAST MARKET ─────────────────────────────────────────────────────────
  "Mid East Market": {
    "Chicken (Skinless)": [
      "Whole Chicken (cut for curry)",
      "Leg Quarters (cut into 3 pieces)",
      "Leg Quarters (cut into curry pieces)",
      "Chicken Filet (cut for tandoori)",
      "Chicken Liver",
      "Ground Chicken",
    ],
    "Goat": [
      "Full Baby Goat", "Half Goat", "Goat Keema (fresh)", "Goat Liver",
    ],
    "Fresh Vegetables & Herbs": [
      "Cilantro (Coriander)", "Mint", "Curry Leaves", "Green Chillies",
      "Tindora (Dondakaya)", "Gutti Vankaya (Small Brinja)", "Brinjal",
      "Bendakaya (Okra)", "Beerakaya (Ridge Gourd)", "Sorakaya (Bottle Gourd)",
      "Sweet Potatoes", "Pumpkin", "Radish", "Methi Leaves", "Spinach",
      "Doskayas", "Tomatoes",
    ],
    "Rice, Flour & Grains": [
      "Sona Masoori Rice", "Chitti Samba Rice", "Chitti Muthyalu Rice",
      "Ragi Flour", "Idli Ravva", "Millet Idli Ravva", "Sooji / Ravva",
      "Besan (Lakshmi Brand)", "Sabudana", "Cracked Wheat (Daliya)", "Barley",
    ],
    "Dals, Beans & Pulses": [
      "Toor Dal", "Chana Dal", "Urad Gota", "Urad Split with Skin",
      "Masoor Dal", "Split Peas", "Dry Peas", "Black Eye Beans",
      "Roasted Chana", "Peanuts",
    ],
    "Spices & Whole Masalas": [
      "Cardamom (Green)", "Black Cardamom", "Cloves", "Cinnamon", "Star Anise",
      "Menthi Mooga", "Mustard Seeds", "Ajwain Seeds", "Poppy Seeds",
      "Fenugreek Seeds", "White Pepper", "Saffron", "Rose Petals",
    ],
    "Spice Powders": [
      "Coriander Powder", "Cumin Powder", "Garam Masala", "Red Chili Powder",
      "Kashmir Chili Powder", "Turmeric Powder", "Kitchen King Masala",
      "Tandoori Masala", "Sambar Powder",
    ],
    "Sauces, Pastes & Condiments": [
      "Chili Vinegar", "Siracha Sauce", "Chili Garlic Sauce", "Chili Sauce",
      "Tamarind Paste", "Tamarind-Date Sauce", "Mustard Oil",
    ],
    "Coconut Products": [
      "Dry Coconut", "Coconut Powder", "Grated Coconut", "Coconut Milk",
    ],
    "Frozen Items": [
      "Frozen Coconut", "Frozen Mango Pulp", "Frozen Chikoo Pulp",
      "Frozen Custard Apple (Seethafal) Pulp", "Frozen Carrot Halwa",
      "Frozen Manchurian", "Spring Roll Sheets",
    ],
    "Bakery & Ready-to-Eat": [
      "Malabar Paratha", "Desi Roti", "Uncooked Pulka", "Hakka Noodles",
    ],
    "Beverages": [
      "Wagh Bakri Tea", "Lamsa Tea", "Bru Coffee", "Thumb Up",
    ],
    "Dry Fruits & Miscellaneous": [
      "Raisins", "Almonds", "Jaggery", "Fried Onions", "Cardamom",
    ],
    "Frequently Ordered in Full Cases": [
      "Besan", "Urad Gota", "Chana Dal", "Toor Dal", "Peanuts",
      "Rice Flour", "Idli Rava", "Sabudana", "Coconut (Grated)",
      "Malabar Paratha", "Desi Roti", "Hakka Noodles",
    ],
  },

  // ── SPICE BAZAAR ────────────────────────────────────────────────────────────
  "Spice Bazaar": {
    "Fresh Vegetables & Greens": [
      "Coriander (Cilantro)", "Mint", "Curry Leaves", "Green Chillies",
      "Bajji Mirchi", "Tomatoes", "Ginger", "Garlic",
      "Raw Bananas (Aritikaya)", "Dosakaya", "Dondakaya (Tindora)",
      "Vankaya / Gutti Vankaya (Eggplant)", "Bendakaya (Okra)",
      "Beerakaya (Ridge Gourd)", "Sorakaya (Bottle Gourd)",
      "Potlakaya (Snake Gourd)", "Gummadikaya (Pumpkin)",
      "Chamadumpa (Taro Root)", "Mullangi (Radish)", "Beetroot",
      "Cabbage", "Cluster Beans", "Goru Chikkudu", "Methi Leaves",
      "Gongura", "Chintachiguru", "Totakura",
      "Palakura (Spinach)", "Kakarakaya (Bitter Gourd)", "Raw Mangoes",
    ],
    "Frozen Vegetables & Produce": [
      "Frozen Coconut", "Frozen Mango Pieces", "Frozen Drumsticks",
      "Frozen Gongura", "Frozen Chikoo", "Frozen Custard Apple Pulp",
      "Frozen Jackfruit", "Frozen Cluster Beans", "Frozen Carrot & Peas",
      "Frozen Veg Keema", "Frozen Veg Manchuria",
    ],
    "Rice, Flours & Grains": [
      "Sona Masuri Rice", "Jeera Samba Rice", "Samba Rice",
      "Chitti Muthyalu Rice", "Long Grain Rice", "Idli Ravva",
      "Millet Idli Ravva", "Rice Flour", "Corn Flour / Corn Starch",
      "Atta Flour", "Besan (Lakshmi Brand)", "Jonna Pindi",
      "Jonna Crushed", "Raagi Flour", "Sooji (Coarse)",
      "Poha", "Daliya", "Sabudana",
    ],
    "Dals & Pulses": [
      "Toor Dal", "Chana Dal", "Urad Gota", "Urad Split",
      "Moong Dal Split (with skin)", "Yellow Moong Dal", "Masoor Dal",
      "Split Peas Dal", "Alasandalu", "White Peas",
      "Kabuli Chana", "Fried Chana Dal (Putnalu)",
    ],
    "Nuts & Seeds": [
      "Peanuts", "Sesame Seeds", "Poppy Seeds", "Mustard Seeds",
      "Ajwain Seeds", "Cumin Seeds", "Fennel Seeds",
    ],
    "Whole Spices": [
      "Cardamom (Elaichi)", "Cloves", "Cinnamon (Chekka)", "Bay Leaves",
      "Star Anise", "Mace (Javitri)", "Stone Flower", "Shahi Jeera",
      "Turmeric", "Dry Red Chillies", "Badgi Chillies",
    ],
    "Spice Powders & Masalas": [
      "Swad Garam Masala", "Coriander Powder", "Jeera Powder",
      "Chilli Powder", "Extra Hot Chilli Powder", "Kashmiri Chilli Powder",
      "Kitchen King Masala", "Chaat Masala", "Chana Masala",
      "Sambar Powder", "Kasoori Methi", "Manchurian Masala",
    ],
    "Sauces, Pastes & Chutneys": [
      "Tamarind Paste", "Tamarind-Date Chutney", "Mango Chutney",
      "Chilli Garlic Sauce", "Green Chilli Sauce", "Red Chilli Sauce",
      "Hakka Sauce", "Hot & Sweet Sauce", "Sriracha Sauce",
      "Chilli Vinegar", "Mint Chutney", "Pandu Mirchi Pickle", "Ulavacharu",
    ],
    "Bakery, Snacks & Ready-to-Eat": [
      "Puri Packs", "Malabar Paratha", "Desi Roti", "Deep Samosa",
      "Potato Samosa", "Pani Puri", "Sev", "Papdi", "Mixer",
      "Corn Flakes", "Murmura (Maramaralu)",
    ],
    "Dairy & Dessert Ingredients": [
      "Milk Powder", "Kova", "Coconut Milk", "Vanilla Custard Powder",
      "Gulab Jamun Mix", "Rasmalai", "Apricots", "Raisins", "Saffron",
    ],
    "Beverages": [
      "Bru Coffee", "Lamsa Tea",
    ],
    "Miscellaneous": [
      "Bellam (Jaggery)", "Makhana", "Coconut Powder", "Coconut Flakes",
      "Mango Cubes", "Dry Coconut", "Fried Onions", "Maggi Cubes", "Whole Coconut",
    ],
  },
};

module.exports = MASTER_INVENTORY;
