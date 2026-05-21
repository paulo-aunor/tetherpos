import { db } from "./db";
import { generateId } from "../utils/generateId";
import { setSetting } from "./settingsDb";

//demo menu items
export const SEED_MENU_ITEMS = [
  { sku: "COF-001", name: "Brewed Coffee", category: "Coffee", price: 60 },
  { sku: "COF-002", name: "Americano", category: "Coffee", price: 80 },
  { sku: "COF-003", name: "Cappuccino", category: "Coffee", price: 95 },
  { sku: "COF-004", name: "Caramel Macchiato", category: "Coffee", price: 110 },
  { sku: "COF-005", name: "Matcha Latte", category: "Coffee", price: 105 },
  { sku: "NCF-001", name: "Iced Tea", category: "Non-Coffee", price: 55 },
  {
    sku: "NCF-002",
    name: "Strawberry Smoothie",
    category: "Non-Coffee",
    price: 95,
  },
  { sku: "NCF-003", name: "Mango Smoothie", category: "Non-Coffee", price: 95 },
  { sku: "NCF-004", name: "Chocolate Milk", category: "Non-Coffee", price: 75 },
  { sku: "NCF-005", name: "Bottled Water", category: "Non-Coffee", price: 30 },
  { sku: "SNK-001", name: "Siomai (6pcs)", category: "Snacks", price: 75 },
  { sku: "SNK-002", name: "Lumpia (3pcs)", category: "Snacks", price: 55 },
  { sku: "SNK-003", name: "Fishball (10pcs)", category: "Snacks", price: 45 },
  { sku: "SNK-004", name: "Kwek-kwek (5pcs)", category: "Snacks", price: 50 },
  { sku: "SNK-005", name: "Banana Cue (3pcs)", category: "Snacks", price: 35 },
  {
    sku: "MIL-001",
    name: "Hotdog Sandwich",
    category: "Light Meals",
    price: 65,
  },
  {
    sku: "MIL-002",
    name: "Ham & Cheese Sandwich",
    category: "Light Meals",
    price: 75,
  },
  {
    sku: "MIL-003",
    name: "Club Sandwich",
    category: "Light Meals",
    price: 120,
  },
  { sku: "MIL-004", name: "Garlic Rice", category: "Light Meals", price: 45 },
  { sku: "MIL-005", name: "Sinangag", category: "Light Meals", price: 40 },
  { sku: "CMB-001", name: "Coffee + Sandwich", category: "Combos", price: 140 },
  { sku: "CMB-002", name: "Coffee + Snack", category: "Combos", price: 120 },
  {
    sku: "CMB-003",
    name: "Smoothie + Sandwich",
    category: "Combos",
    price: 155,
  },
  {
    sku: "CMB-004",
    name: "Snack Platter (Siomai + Lumpia + Kwek-kwek)",
    category: "Combos",
    price: 160,
  },
  {
    sku: "CMB-005",
    name: "Student Meal (Rice + Hotdog + Iced Tea)",
    category: "Combos",
    price: 120,
  },
];

//demo inventory items. id is automatically generated
export const SEED_INVENTORY_ITEMS = [
  {
    id: generateId(),
    inventoryNumber: "RM-001",
    name: "Coffee Beans (250g)",
    category: "Dry Goods",
    quantity: 50,
  },
  {
    id: generateId(),
    inventoryNumber: "RM-002",
    name: "Sugar (1kg)",
    category: "Dry Goods",
    quantity: 30,
  },
  {
    id: generateId(),
    inventoryNumber: "RM-003",
    name: "Coffee Creamer (500g)",
    category: "Dry Goods",
    quantity: 20,
  },
  {
    id: generateId(),
    inventoryNumber: "RM-004",
    name: "Matcha Powder (100g)",
    category: "Dry Goods",
    quantity: 15,
  },
  {
    id: generateId(),
    inventoryNumber: "RM-005",
    name: "Fresh Milk (1L)",
    category: "Dairy & Wet",
    quantity: 40,
  },
  {
    id: generateId(),
    inventoryNumber: "RM-006",
    name: "Chocolate Syrup (750ml)",
    category: "Dairy & Wet",
    quantity: 20,
  },
  {
    id: generateId(),
    inventoryNumber: "RM-007",
    name: "Caramel Syrup (750ml)",
    category: "Dairy & Wet",
    quantity: 20,
  },
  {
    id: generateId(),
    inventoryNumber: "RM-008",
    name: "Strawberry Syrup (750ml)",
    category: "Dairy & Wet",
    quantity: 15,
  },
  {
    id: generateId(),
    inventoryNumber: "RM-009",
    name: "Siomai (frozen, 100pcs)",
    category: "Frozen",
    quantity: 10,
  },
  {
    id: generateId(),
    inventoryNumber: "RM-010",
    name: "Lumpia (frozen, 50pcs)",
    category: "Frozen",
    quantity: 15,
  },
  {
    id: generateId(),
    inventoryNumber: "RM-011",
    name: "Fishball (frozen, 100pcs)",
    category: "Frozen",
    quantity: 10,
  },
  {
    id: generateId(),
    inventoryNumber: "RM-012",
    name: "Kwek-kwek mix (500g)",
    category: "Frozen",
    quantity: 12,
  },
  {
    id: generateId(),
    inventoryNumber: "RM-013",
    name: "Hotdog buns (pack of 10)",
    category: "Bread & Produce",
    quantity: 20,
  },
  {
    id: generateId(),
    inventoryNumber: "RM-014",
    name: "Sliced bread (loaf)",
    category: "Bread & Produce",
    quantity: 25,
  },
  {
    id: generateId(),
    inventoryNumber: "RM-015",
    name: "Bananas (kg)",
    category: "Bread & Produce",
    quantity: 10,
  },
];

//provides seed data from defaults to localDB
export const seedDemoData = async () => {
  const count = await db.menuItems.count();
  if (count > 0) return;

  await db.menuItems.bulkAdd(SEED_MENU_ITEMS);
  await db.inventory.bulkAdd(SEED_INVENTORY_ITEMS);
  await setSetting("demo_mode", true);
};

//resets the demo data from the localDB and waits for another batch of demodata
export const resetDemoData = async () => {
  await db.menuItems.clear();
  await db.inventory.clear();
  await db.transactions.clear();
  await setSetting("demo_mode", false);
  await seedDemoData();
};
