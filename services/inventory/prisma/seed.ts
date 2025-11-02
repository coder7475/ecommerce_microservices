import { PrismaClient, Prisma, ActionType } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const prisma = new PrismaClient().$extends(withAccelerate());

const inventoryData: Prisma.InventoryCreateInput[] = [
  {
    sku: "LAPTOP-001",
    productId: "prod_laptop_dell_xps15",
    quantity: 50,
    Histories: {
      create: [
        {
          actionType: ActionType.INIT,
          quantityChanged: 50,
          lastQuantity: 0,
          newQuantity: 50,
        },
      ],
    },
  },
  {
    sku: "MOUSE-002",
    productId: "prod_mouse_logitech_mx3",
    quantity: 150,
    Histories: {
      create: [
        {
          actionType: ActionType.INIT,
          quantityChanged: 150,
          lastQuantity: 0,
          newQuantity: 150,
        },
        {
          actionType: ActionType.IN,
          quantityChanged: 50,
          lastQuantity: 150,
          newQuantity: 200,
        },
      ],
    },
  },
  {
    sku: "KEYBOARD-003",
    productId: "prod_keyboard_mechanical_k95",
    quantity: 75,
    Histories: {
      create: [
        {
          actionType: ActionType.INIT,
          quantityChanged: 100,
          lastQuantity: 0,
          newQuantity: 100,
        },
        {
          actionType: ActionType.OUT,
          quantityChanged: 25,
          lastQuantity: 100,
          newQuantity: 75,
        },
      ],
    },
  },
];

async function main() {
  console.log(`Start seeding ...`);
  for (const inv of inventoryData) {
    const inventory = await prisma.inventory.create({
      data: inv,
    });
    console.log(
      `Created inventory with id: ${inventory.id}, SKU: ${inventory.sku}`
    );
  }
  console.log(`Seeding finished.`);
}

try {
  await main();
} catch (e) {
  console.error(e);
} finally {
  await prisma.$disconnect();
}
