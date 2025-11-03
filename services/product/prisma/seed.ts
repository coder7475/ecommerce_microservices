import { withAccelerate } from "@prisma/extension-accelerate";
import { PrismaClient, Prisma, Status } from "@prisma/client";

const prisma = new PrismaClient().$extends(withAccelerate());

const productData: Prisma.ProductCreateInput[] = [
  {
    sku: "LAPTOP-001",
    name: "Dell XPS 15 Laptop",
    description:
      "High-performance laptop with 15.6-inch display, Intel i7 processor, 16GB RAM, and 512GB SSD",
    price: 1299.99,
    status: Status.PUBLISH,
  },
  {
    sku: "MOUSE-002",
    name: "Logitech MX Master 3",
    description:
      "Advanced wireless mouse with ergonomic design and customizable buttons",
    price: 99.99,
    status: Status.PUBLISH,
  },
  {
    sku: "KEYBOARD-003",
    name: "Corsair K95 RGB Mechanical Keyboard",
    description:
      "Premium mechanical gaming keyboard with RGB backlighting and programmable keys",
    price: 199.99,
    status: Status.PUBLISH,
  },
  {
    sku: "MONITOR-004",
    name: "LG UltraWide 34-inch Monitor",
    description:
      "34-inch curved ultrawide monitor with QHD resolution and HDR10 support",
    price: 599.99,
    status: Status.PUBLISH,
  },
  {
    sku: "HEADSET-005",
    name: "Sony WH-1000XM5 Headphones",
    description:
      "Premium noise-cancelling wireless headphones with exceptional sound quality",
    price: 399.99,
    status: Status.PUBLISH,
  },
  {
    sku: "WEBCAM-006",
    name: "Logitech Brio 4K Webcam",
    description: "4K Ultra HD webcam with HDR and Windows Hello support",
    price: 199.99,
    status: Status.DRAFT,
  },
  {
    sku: "DOCK-007",
    name: "CalDigit TS3 Plus Thunderbolt 3 Dock",
    description:
      "Universal Thunderbolt 3 dock with 15 ports for ultimate connectivity",
    price: 299.99,
    status: Status.PUBLISH,
  },
  {
    sku: "CHAIR-008",
    name: "Herman Miller Aeron Chair",
    description:
      "Ergonomic office chair with PostureFit support and adjustable armrests",
    price: 1395.0,
    status: Status.UNLISTED,
  },
];

async function main() {
  console.log(`Start seeding products ...`);

  for (const prod of productData) {
    const product = await prisma.product.create({
      data: prod,
    });
    console.log(
      `Created product: ${product.sku} - ${product.name} (${product.status})`
    );
  }

  console.log(`Seeding finished. Created ${productData.length} products.`);
}

try {
  await main();
} catch (e) {
  console.error(e);
} finally {
  await prisma.$disconnect();
}
