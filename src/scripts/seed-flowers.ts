import { ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createInventoryLevelsWorkflow,
} from "@medusajs/medusa/core-flows";

export default async function seedFlowers({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);

  // Get existing shipping profile
  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({ type: "default" });
  const shippingProfile = shippingProfiles[0];

  if (!shippingProfile) {
    logger.error("No shipping profile found. Run the main seed first.");
    return;
  }

  // Get existing region for pricing
  const { data: regions } = await query.graph({ entity: "region", fields: ["id", "currency_code"] });
  const region = regions[0];

  if (!region) {
    logger.error("No region found. Run the main seed first.");
    return;
  }

  logger.info("Creating floral categories...");
  const { result: categories } = await createProductCategoriesWorkflow(container).run({
    input: {
      product_categories: [
        { name: "Bouquets", is_active: true },
        { name: "Arrangements", is_active: true },
        { name: "Wedding", is_active: true },
        { name: "Plants", is_active: true },
      ],
    },
  });

  const bouquets = categories.find((c) => c.name === "Bouquets")!;
  const arrangements = categories.find((c) => c.name === "Arrangements")!;
  const wedding = categories.find((c) => c.name === "Wedding")!;
  const plants = categories.find((c) => c.name === "Plants")!;

  logger.info("Creating floral products...");

  const { result: productResult } = await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "Sunset Rose Bouquet",
          handle: "sunset-rose-bouquet",
          description: "A stunning arrangement of peach, coral, and blush garden roses with eucalyptus greenery. Hand-tied and wrapped in our signature kraft paper.",
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          category_ids: [bouquets.id],
          thumbnail: "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600&q=80",
          images: [{ url: "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=800&q=80" }],
          options: [{ title: "Size", values: ["Standard", "Deluxe", "Grand"] }],
          variants: [
            { title: "Standard", sku: "ROSE-STD", prices: [{ amount: 4500, currency_code: "eur" }, { amount: 4999, currency_code: "usd" }], options: { Size: "Standard" }, manage_inventory: false },
            { title: "Deluxe", sku: "ROSE-DLX", prices: [{ amount: 6500, currency_code: "eur" }, { amount: 7499, currency_code: "usd" }], options: { Size: "Deluxe" }, manage_inventory: false },
            { title: "Grand", sku: "ROSE-GRD", prices: [{ amount: 8900, currency_code: "eur" }, { amount: 9999, currency_code: "usd" }], options: { Size: "Grand" }, manage_inventory: false },
          ],
        },
        {
          title: "Wildflower Meadow",
          handle: "wildflower-meadow",
          description: "A free-spirited mix of seasonal wildflowers — daisies, lavender, chamomile, and ranunculus. Like a walk through a Tucson meadow after the rain.",
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          category_ids: [bouquets.id],
          thumbnail: "https://images.unsplash.com/photo-1471696035578-3d8c78d99684?w=600&q=80",
          images: [{ url: "https://images.unsplash.com/photo-1471696035578-3d8c78d99684?w=800&q=80" }],
          options: [{ title: "Size", values: ["Petite", "Full"] }],
          variants: [
            { title: "Petite", sku: "WILD-SM", prices: [{ amount: 3200, currency_code: "eur" }, { amount: 3499, currency_code: "usd" }], options: { Size: "Petite" }, manage_inventory: false },
            { title: "Full", sku: "WILD-LG", prices: [{ amount: 5500, currency_code: "eur" }, { amount: 5999, currency_code: "usd" }], options: { Size: "Full" }, manage_inventory: false },
          ],
        },
        {
          title: "White Peony Centerpiece",
          handle: "white-peony-centerpiece",
          description: "Lush white peonies with dusty miller and silver dollar eucalyptus in a frosted glass vase. Perfect for dining tables and elegant events.",
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          category_ids: [arrangements.id],
          thumbnail: "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=600&q=80",
          images: [{ url: "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=800&q=80" }],
          options: [{ title: "Size", values: ["Standard", "Large"] }],
          variants: [
            { title: "Standard", sku: "PEONY-STD", prices: [{ amount: 5500, currency_code: "eur" }, { amount: 5999, currency_code: "usd" }], options: { Size: "Standard" }, manage_inventory: false },
            { title: "Large", sku: "PEONY-LG", prices: [{ amount: 8500, currency_code: "eur" }, { amount: 8999, currency_code: "usd" }], options: { Size: "Large" }, manage_inventory: false },
          ],
        },
        {
          title: "Bridal Cascade Bouquet",
          handle: "bridal-cascade-bouquet",
          description: "An elegant cascading bridal bouquet with white roses, orchids, trailing ivy, and delicate baby's breath. Your forever bouquet.",
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          category_ids: [wedding.id],
          thumbnail: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=80",
          images: [{ url: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80" }],
          options: [{ title: "Style", values: ["Classic", "Premium"] }],
          variants: [
            { title: "Classic", sku: "BRIDAL-CL", prices: [{ amount: 12000, currency_code: "eur" }, { amount: 12999, currency_code: "usd" }], options: { Style: "Classic" }, manage_inventory: false },
            { title: "Premium", sku: "BRIDAL-PM", prices: [{ amount: 18000, currency_code: "eur" }, { amount: 19999, currency_code: "usd" }], options: { Style: "Premium" }, manage_inventory: false },
          ],
        },
        {
          title: "Succulent Garden Box",
          handle: "succulent-garden-box",
          description: "A curated wooden box of desert-hardy succulents — echeveria, jade, and haworthia. Low maintenance, high style. Perfect for Tucson.",
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          category_ids: [plants.id],
          thumbnail: "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=600&q=80",
          images: [{ url: "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=800&q=80" }],
          options: [{ title: "Size", values: ["Small", "Medium"] }],
          variants: [
            { title: "Small", sku: "SUCC-SM", prices: [{ amount: 2800, currency_code: "eur" }, { amount: 2999, currency_code: "usd" }], options: { Size: "Small" }, manage_inventory: false },
            { title: "Medium", sku: "SUCC-MD", prices: [{ amount: 4500, currency_code: "eur" }, { amount: 4999, currency_code: "usd" }], options: { Size: "Medium" }, manage_inventory: false },
          ],
        },
        {
          title: "Dried Flower Wreath",
          handle: "dried-flower-wreath",
          description: "A beautiful preserved wreath of dried lavender, pampas grass, bunny tails, and strawflowers. Lasts for months — no watering needed.",
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          category_ids: [arrangements.id],
          thumbnail: "https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=600&q=80",
          images: [{ url: "https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=800&q=80" }],
          options: [{ title: "Size", values: ["12 inch", "18 inch"] }],
          variants: [
            { title: "12 inch", sku: "WREATH-12", prices: [{ amount: 4000, currency_code: "eur" }, { amount: 4499, currency_code: "usd" }], options: { Size: "12 inch" }, manage_inventory: false },
            { title: "18 inch", sku: "WREATH-18", prices: [{ amount: 6500, currency_code: "eur" }, { amount: 6999, currency_code: "usd" }], options: { Size: "18 inch" }, manage_inventory: false },
          ],
        },
      ],
    },
  });

  logger.info(`Created ${productResult.length} floral products.`);
  logger.info("Finished seeding flower shop data!");
}
