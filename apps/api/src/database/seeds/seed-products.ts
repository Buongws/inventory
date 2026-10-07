import { Product, ProductStatus } from "../../products/product.entity";
import dataSource from "../data-source";

const DEFAULT_COUNT = 200;
const MAX_COUNT = 10_000;
const BATCH_SIZE = 100;

const productTypes = [
  "Wireless Mouse",
  "Mechanical Keyboard",
  "USB-C Hub",
  "Laptop Stand",
  "Webcam",
  "Bluetooth Speaker",
  "Power Bank",
  "External SSD",
  "Monitor Arm",
  "Desk Lamp",
  "Noise-Cancelling Headphones",
  "Smart Plug",
  "HDMI Cable",
  "Ethernet Adapter",
  "Portable Charger",
  "Tablet Case",
  "Phone Stand",
  "Microphone",
  "Router",
  "Memory Card",
] as const;

const variants = [
  "Essential",
  "Compact",
  "Pro",
  "Plus",
  "Lite",
  "Studio",
  "Travel",
  "Office",
  "Max",
  "Classic",
] as const;

function readCount() {
  const argument = process.argv
    .slice(2)
    .find((value) => value.startsWith("--count="));
  if (!argument) return DEFAULT_COUNT;

  const count = Number(argument.slice("--count=".length));
  if (!Number.isInteger(count) || count < 1 || count > MAX_COUNT) {
    throw new Error(`--count must be an integer between 1 and ${MAX_COUNT}`);
  }
  return count;
}

function createProducts(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const number = index + 1;
    const sku = `DEMO-${number.toString().padStart(4, "0")}`;
    const productType = productTypes[index % productTypes.length];
    const variant =
      variants[Math.floor(index / productTypes.length) % variants.length];

    return {
      sku,
      name: `${variant} ${productType}`,
      description: `Demo catalog item ${number}: ${variant} ${productType}`,
      priceVnd: String(((index % 50) + 1) * 25_000),
      status: ProductStatus.ACTIVE,
      imageUrl: null,
    };
  });
}

async function seedProducts() {
  const count = readCount();
  const products = createProducts(count);
  let inserted = 0;

  await dataSource.initialize();
  try {
    for (let offset = 0; offset < products.length; offset += BATCH_SIZE) {
      const batch = products.slice(offset, offset + BATCH_SIZE);
      const result = await dataSource
        .createQueryBuilder()
        .insert()
        .into(Product)
        .values(batch)
        .orIgnore()
        .returning(["id"])
        .execute();
      inserted += Array.isArray(result.raw) ? result.raw.length : 0;
    }

    console.log(
      `Product seed complete: requested=${count} inserted=${inserted} skipped=${count - inserted}`,
    );
  } finally {
    await dataSource.destroy();
  }
}

seedProducts().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Product seed failed");
  process.exitCode = 1;
});
