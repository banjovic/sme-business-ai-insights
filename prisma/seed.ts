import { loadEnvConfig } from "@next/env";
import bcrypt from "bcryptjs";

loadEnvConfig(process.cwd());

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60), 0, 0);
  return d;
}

interface SeedBusinessDef {
  email: string;
  businessName: string;
  sector: string;
  location: string;
  stock: { name: string; qty: number; reorder: number; price: number }[];
  expenseCategories: { category: string; avgAmount: number; intervalDays: number }[];
}

const BUSINESSES: SeedBusinessDef[] = [
  {
    email: "adaeze@adaezestores.ng",
    businessName: "Adaeze Stores",
    sector: "Retail / Provisions Trading",
    location: "Lagos, Nigeria",
    stock: [
      { name: "Bag of Rice (50kg)", qty: 14, reorder: 5, price: 72000 },
      { name: "Cooking Oil (5L)", qty: 4, reorder: 5, price: 14500 },
      { name: "Milk Cartons (Pack of 12)", qty: 22, reorder: 6, price: 9800 },
      { name: "Detergent (1kg)", qty: 30, reorder: 8, price: 2400 },
      { name: "Sugar (50kg Bag)", qty: 6, reorder: 3, price: 68000 },
    ],
    expenseCategories: [
      { category: "Transport & Logistics", avgAmount: 8500, intervalDays: 3 },
      { category: "Shop Rent", avgAmount: 60000, intervalDays: 28 },
      { category: "Generator Fuel", avgAmount: 12000, intervalDays: 4 },
      { category: "Local Levies & Security", avgAmount: 3500, intervalDays: 14 },
    ],
  },
  {
    email: "chidi@chidicorner.ng",
    businessName: "Chidi Tech & Gadgets",
    sector: "Electronics & Device Repairs",
    location: "Computer Village, Ikeja, Lagos",
    stock: [
      { name: "iPhone 11 Screen Replacement", qty: 8, reorder: 3, price: 28000 },
      { name: "Fast Charging USB-C Cables (Pack of 10)", qty: 45, reorder: 10, price: 12000 },
      { name: "20,000mAh Power Banks", qty: 12, reorder: 4, price: 19500 },
      { name: "Bluetooth Earbuds", qty: 18, reorder: 5, price: 8500 },
      { name: "Laptop SSD 512GB", qty: 5, reorder: 2, price: 34000 },
    ],
    expenseCategories: [
      { category: "Shop Space Rent", avgAmount: 90000, intervalDays: 30 },
      { category: "Plaza Central Generator Fee", avgAmount: 18000, intervalDays: 7 },
      { category: "Component Courier Delivery", avgAmount: 6000, intervalDays: 5 },
      { category: "Internet / Wi-Fi Sub", avgAmount: 15000, intervalDays: 30 },
    ],
  },
  {
    email: "aminu@kanotextiles.ng",
    businessName: "Kano Fine Textiles",
    sector: "Fabrics & Traditional Attire",
    location: "Kwari Market, Kano",
    stock: [
      { name: "Super Gold Wax Hollandais (6 Yards)", qty: 25, reorder: 5, price: 42000 },
      { name: "Brocade / Shadda Superior (10 Yards)", qty: 15, reorder: 4, price: 85000 },
      { name: "Atiku Fabric Classic", qty: 32, reorder: 8, price: 28000 },
      { name: "Embroidered Traditional Caps", qty: 40, reorder: 10, price: 6500 },
    ],
    expenseCategories: [
      { category: "Interstate Freight from Lagos", avgAmount: 22000, intervalDays: 10 },
      { category: "Kwari Market Association Dues", avgAmount: 5000, intervalDays: 30 },
      { category: "Generator Fuel", avgAmount: 9500, intervalDays: 5 },
      { category: "Store Warehouse Rent", avgAmount: 75000, intervalDays: 30 },
    ],
  },
  {
    email: "ifeoma@ifeomabakes.ng",
    businessName: "Ifeoma Bakes & Pastries",
    sector: "Bakery & Confectionery",
    location: "Enugu, Nigeria",
    stock: [
      { name: "Golden Crust Sliced Bread (Large)", qty: 65, reorder: 20, price: 1600 },
      { name: "Celebration Sponge Cake (8-inch)", qty: 6, reorder: 2, price: 18000 },
      { name: "Meat Pies (Box of 20)", qty: 14, reorder: 5, price: 12000 },
      { name: "Flour 50kg Sack (Baking Reserve)", qty: 8, reorder: 3, price: 62000 },
    ],
    expenseCategories: [
      { category: "Baking Gas Cylinder Refill", avgAmount: 24000, intervalDays: 7 },
      { category: "Packaging Boxes & Foil", avgAmount: 14000, intervalDays: 10 },
      { category: "Generator Fuel for Freezers", avgAmount: 15000, intervalDays: 4 },
      { category: "Local Dispatch Delivery", avgAmount: 7000, intervalDays: 3 },
    ],
  },
  {
    email: "danladi@danladiagro.ng",
    businessName: "Danladi Agro Supplies",
    sector: "Agricultural Produce & Seeds",
    location: "Jos, Plateau State",
    stock: [
      { name: "Maize Grain (100kg Bag)", qty: 35, reorder: 10, price: 58000 },
      { name: "Irish Potato (50kg Basket)", qty: 28, reorder: 8, price: 38000 },
      { name: "NPK 15:15:15 Fertilizer (50kg)", qty: 16, reorder: 5, price: 46000 },
      { name: "Hybrid Tomato Seeds (Pack of 5)", qty: 40, reorder: 12, price: 4500 },
    ],
    expenseCategories: [
      { category: "Farm Gate Truck Transport", avgAmount: 32000, intervalDays: 6 },
      { category: "Storage Warehouse Pest Control", avgAmount: 12000, intervalDays: 20 },
      { category: "Market Loading & Unloading Labor", avgAmount: 8000, intervalDays: 4 },
      { category: "Local Council Produce Levy", avgAmount: 4000, intervalDays: 15 },
    ],
  },
  {
    email: "bolu@bolufashion.ng",
    businessName: "Boluwatife Fashion House",
    sector: "Fashion Boutique & Bespoke Tailoring",
    location: "Bodija, Ibadan",
    stock: [
      { name: "Bespoke Senator Kaftan Suits", qty: 9, reorder: 3, price: 35000 },
      { name: "Ready-to-Wear Ankara Shift Dresses", qty: 24, reorder: 6, price: 14500 },
      { name: "Premium Sewing Thread & Zippers (Set)", qty: 50, reorder: 15, price: 3500 },
      { name: "Silk Crepe Fabric Bundles", qty: 14, reorder: 4, price: 21000 },
    ],
    expenseCategories: [
      { category: "Industrial Sewing Machine Maintenance", avgAmount: 9000, intervalDays: 14 },
      { category: "Shop Air Conditioning Fuel", avgAmount: 14000, intervalDays: 4 },
      { category: "Apprentice / Assistant Stipends", avgAmount: 40000, intervalDays: 30 },
      { category: "Showroom Rent", avgAmount: 65000, intervalDays: 30 },
    ],
  },
  {
    email: "deji@dejiauto.ng",
    businessName: "Deji Auto Spare Parts",
    sector: "Automotive Spares & Tyres",
    location: "Ladipo Market, Lagos",
    stock: [
      { name: "Toyota Corolla Front Brake Pads", qty: 20, reorder: 6, price: 16500 },
      { name: "Engine Oil 5W-30 Full Synthetic (4L)", qty: 18, reorder: 5, price: 27000 },
      { name: "All-Terrain Tyre 205/65/R15", qty: 12, reorder: 4, price: 48000 },
      { name: "Standard 75Ah Inverter / Car Battery", qty: 7, reorder: 3, price: 78000 },
    ],
    expenseCategories: [
      { category: "Container Offloading Labor", avgAmount: 15000, intervalDays: 12 },
      { category: "Ladipo Security & Environmental Dues", avgAmount: 6500, intervalDays: 30 },
      { category: "Shop & Overhead Line Electricity", avgAmount: 20000, intervalDays: 15 },
      { category: "Forklift and Haulage Service", avgAmount: 11000, intervalDays: 10 },
    ],
  },
  {
    email: "grace@gracepharm.ng",
    businessName: "Grace Essential Pharmacy",
    sector: "Pharmaceuticals & Healthcare",
    location: "Wuse II, Abuja",
    stock: [
      { name: "Artemether Malaria Combination Pack", qty: 55, reorder: 15, price: 3800 },
      { name: "Multivitamin Immunity Syrup (200ml)", qty: 34, reorder: 10, price: 4600 },
      { name: "Digital Blood Pressure Monitor", qty: 8, reorder: 3, price: 28500 },
      { name: "First Aid & Wound Dressing Kits", qty: 25, reorder: 6, price: 7200 },
    ],
    expenseCategories: [
      { category: "Cold-chain Vaccine Fridge Fuel", avgAmount: 22000, intervalDays: 4 },
      { category: "PCN & Regulatory Renewal Levies", avgAmount: 35000, intervalDays: 30 },
      { category: "Locum Pharmacist Support", avgAmount: 45000, intervalDays: 30 },
      { category: "Store Air Purification & Cleaning", avgAmount: 8000, intervalDays: 7 },
    ],
  },
  {
    email: "nnamdi@nnamdimaterials.ng",
    businessName: "Nnamdi Building Materials",
    sector: "Building Materials & Plumbing",
    location: "Onitsha, Anambra State",
    stock: [
      { name: "Dangote Cement (50kg Bag)", qty: 110, reorder: 30, price: 8200 },
      { name: "16mm High-Tensile Iron Rods (Bundle)", qty: 22, reorder: 6, price: 92000 },
      { name: "PVC Pressure Pipes 4-inch (Length)", qty: 45, reorder: 12, price: 6800 },
      { name: "Granite Stone (10-Ton Truckload)", qty: 4, reorder: 2, price: 165000 },
    ],
    expenseCategories: [
      { category: "Tipper Driver Delivery Fuel", avgAmount: 35000, intervalDays: 5 },
      { category: "Onitsha Building Materials Union Fee", avgAmount: 8000, intervalDays: 30 },
      { category: "Crane / Offloading Crew", avgAmount: 18000, intervalDays: 6 },
      { category: "Yard Security Guards", avgAmount: 30000, intervalDays: 30 },
    ],
  },
  {
    email: "amina@aminacosmetics.ng",
    businessName: "Amina Natural Cosmetics & Salon",
    sector: "Beauty, Haircare & Personal Care",
    location: "Barnawa, Kaduna",
    stock: [
      { name: "Organic Raw Shea Butter (500g Tub)", qty: 38, reorder: 10, price: 3200 },
      { name: "Herbal Hair Growth Elixir (150ml)", qty: 26, reorder: 8, price: 6500 },
      { name: "Braiding Hair Extensions (Pack of 3)", qty: 60, reorder: 15, price: 4200 },
      { name: "Professional Hair Dryer Hood", qty: 4, reorder: 2, price: 42000 },
    ],
    expenseCategories: [
      { category: "Salon Generator Petrol", avgAmount: 12000, intervalDays: 3 },
      { category: "Water Tanker Supply", avgAmount: 7000, intervalDays: 7 },
      { category: "Towels & Salon Sanitization", avgAmount: 5000, intervalDays: 7 },
      { category: "Studio Space Rent", avgAmount: 55000, intervalDays: 30 },
    ],
  },
  {
    email: "barakat@barakatfoods.ng",
    businessName: "Barakat Cold Room & Foods",
    sector: "Frozen Fish & Poultry",
    location: "Mile 1 Market, Port Harcourt",
    stock: [
      { name: "Carton of Titus Mackerel (20kg)", qty: 28, reorder: 8, price: 64000 },
      { name: "Carton of Chicken Gizzard (10kg)", qty: 19, reorder: 5, price: 38000 },
      { name: "Frozen Turkey Wings (10kg Carton)", qty: 15, reorder: 4, price: 42000 },
      { name: "Jumbo Shrimps / Prawns (5kg Pack)", qty: 12, reorder: 3, price: 29000 },
    ],
    expenseCategories: [
      { category: "Heavy Cold Room Diesel Supply", avgAmount: 60000, intervalDays: 5 },
      { category: "Refrigeration Gas Servicing", avgAmount: 16000, intervalDays: 20 },
      { category: "Cold Room Attendants", avgAmount: 35000, intervalDays: 30 },
      { category: "Mile 1 Council Health Inspection", avgAmount: 6000, intervalDays: 30 },
    ],
  },
  {
    email: "segun@abeokutacrafts.ng",
    businessName: "Abeokuta Heritage Crafts",
    sector: "Home Decor & Art",
    location: "Abeokuta, Ogun State",
    stock: [
      { name: "Traditional Terracotta Water Pitcher", qty: 18, reorder: 4, price: 11500 },
      { name: "Hand-Dyed Adire Silk Cloth (5 Yards)", qty: 25, reorder: 6, price: 26000 },
      { name: "Carved Mahogany Centerpiece Mask", qty: 7, reorder: 2, price: 45000 },
      { name: "Handwoven Raffia Laundry Baskets", qty: 30, reorder: 8, price: 7800 },
    ],
    expenseCategories: [
      { category: "Raw Clay & Indigo Dye Purchases", avgAmount: 14000, intervalDays: 8 },
      { category: "Kiln Wood & Gas Firing Fuel", avgAmount: 18000, intervalDays: 6 },
      { category: "Protective Packaging for Tourists", avgAmount: 6500, intervalDays: 10 },
      { category: "Gallery Space Rent", avgAmount: 48000, intervalDays: 30 },
    ],
  },
];

async function main() {
  const { prisma } = await import("../src/lib/prisma");

  console.log("Seeding 12 showcase Nigerian SME businesses...");

  // Also ensure demo@adaezestores.ng is an alias or mapped for legacy demo logins
  const passwordHash = await bcrypt.hash("demo1234", 10);

  // Check demo user
  const legacyDemo = await prisma.user.findUnique({ where: { email: "demo@adaezestores.ng" } });
  if (!legacyDemo) {
    await prisma.user.create({
      data: {
        email: "demo@adaezestores.ng",
        passwordHash,
        business: {
          create: {
            name: "Adaeze Stores (Demo)",
            sector: "Retail / Provisions Trading",
            location: "Lagos, Nigeria",
          },
        },
      },
    });
  }

  for (const def of BUSINESSES) {
    let user = await prisma.user.findUnique({ where: { email: def.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: def.email,
          passwordHash,
          business: {
            create: {
              name: def.businessName,
              sector: def.sector,
              location: def.location,
            },
          },
        },
      });
      console.log(` Created account for ${def.businessName} (${def.email})`);
    } else {
      console.log(` Account for ${def.businessName} (${def.email}) already exists, checking data...`);
    }

    const business = await prisma.business.findUnique({ where: { userId: user.id } });
    if (!business) continue;
    const businessId = business.id;

    // Check if stock already seeded
    const stockCount = await prisma.stockItem.count({ where: { businessId } });
    let createdStock: any[] = [];
    if (stockCount === 0) {
      for (const item of def.stock) {
        const created = await prisma.stockItem.create({
          data: {
            businessId,
            name: item.name,
            quantityOnHand: item.qty,
            reorderPoint: item.reorder,
            unitPrice: item.price,
          },
        });
        createdStock.push(created);
      }
    } else {
      createdStock = await prisma.stockItem.findMany({ where: { businessId } });
    }

    // Check if sales already seeded
    const salesCount = await prisma.saleRecord.count({ where: { businessId } });
    if (salesCount === 0 && createdStock.length > 0) {
      const sales: any[] = [];
      // Generate 35 days of sales records
      for (let day = 35; day >= 0; day--) {
        // 1 to 4 sales per day
        const numSalesToday = 1 + (day % 3);
        for (let s = 0; s < numSalesToday; s++) {
          const item = createdStock[(day + s) % createdStock.length];
          const qty = 1 + ((day + s) % 3);
          sales.push({
            businessId,
            itemId: item.id,
            quantitySold: qty,
            amount: qty * item.unitPrice,
            date: daysAgo(day),
          });
        }
      }
      await prisma.saleRecord.createMany({ data: sales });
      console.log(`   + Seeded 35 days of sales for ${def.businessName}`);
    }

    // Check if expenses already seeded
    const expenseCount = await prisma.expenseRecord.count({ where: { businessId } });
    if (expenseCount === 0) {
      const expenses: any[] = [];
      for (const exp of def.expenseCategories) {
        for (let day = 35; day >= 0; day -= exp.intervalDays) {
          const variance = Math.round((Math.random() - 0.5) * 0.2 * exp.avgAmount);
          expenses.push({
            businessId,
            category: exp.category,
            amount: Math.max(1000, exp.avgAmount + variance),
            date: daysAgo(day),
          });
        }
      }
      await prisma.expenseRecord.createMany({ data: expenses });
      console.log(`   + Seeded 35 days of expenses for ${def.businessName}`);
    }
  }

  console.log("\nAll 12 showcase businesses successfully seeded!");
  console.log("Each business is equipped with stock items, 35 days of sales, and categorised expenses.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    const { prisma } = await import("../src/lib/prisma");
    await prisma.$disconnect();
  });
