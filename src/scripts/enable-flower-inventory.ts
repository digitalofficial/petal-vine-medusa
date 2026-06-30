import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
  createInventoryItemsWorkflow,
  createInventoryLevelsWorkflow,
} from "@medusajs/medusa/core-flows";

// Enables stock tracking for the flower products: turns on manage_inventory,
// creates an inventory item per variant, links it to the stock location, and
// sets a starting quantity. Idempotent — variants already tracked are skipped.
// Run with:  npx medusa exec ./src/scripts/enable-flower-inventory.ts

const FLOWER_HANDLES = [
  "sunset-rose-bouquet",
  "wildflower-meadow",
  "white-peony-centerpiece",
  "bridal-cascade-bouquet",
  "succulent-garden-box",
  "dried-flower-wreath",
];

const STARTING_QUANTITY = 25;

export default async function enableFlowerInventory({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const productModuleService = container.resolve(Modules.PRODUCT);

  // 1. Find the stock location to stock items at.
  const { data: locations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
  });
  if (!locations.length) {
    logger.error("No stock location found. Cannot set inventory levels.");
    return;
  }
  const locationId = locations[0].id;
  logger.info(`Using stock location: ${locations[0].name} (${locationId})`);

  // 2. Load the flower variants and whether they already have an inventory item.
  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "handle",
      "variants.id",
      "variants.sku",
      "variants.title",
      "variants.inventory_items.inventory_item_id",
    ],
    filters: { handle: FLOWER_HANDLES },
  });

  if (!products.length) {
    logger.warn("No flower products found.");
    return;
  }

  let created = 0;
  let skipped = 0;

  for (const product of products) {
    for (const variant of product.variants || []) {
      const label = `${product.title} – ${variant.title}`;

      // Already tracked? Skip to stay idempotent.
      if (variant.inventory_items && variant.inventory_items.length > 0) {
        logger.info(`• Skipping (already tracked): ${label}`);
        skipped++;
        continue;
      }

      // a. Turn on inventory management for the variant.
      await productModuleService.updateProductVariants(variant.id, {
        manage_inventory: true,
      });

      // b. Create the inventory item.
      const { result: items } = await createInventoryItemsWorkflow(container).run({
        input: {
          items: [{ sku: variant.sku || undefined, title: label }],
        },
      });
      const inventoryItem = items[0];

      // c. Link the variant to the inventory item.
      await link.create({
        [Modules.PRODUCT]: { variant_id: variant.id },
        [Modules.INVENTORY]: { inventory_item_id: inventoryItem.id },
      });

      // d. Set the starting stock at the location.
      await createInventoryLevelsWorkflow(container).run({
        input: {
          inventory_levels: [
            {
              location_id: locationId,
              inventory_item_id: inventoryItem.id,
              stocked_quantity: STARTING_QUANTITY,
            },
          ],
        },
      });

      logger.info(`✓ Enabled tracking (${STARTING_QUANTITY} in stock): ${label}`);
      created++;
    }
  }

  logger.info(`Done. Enabled ${created} variant(s), skipped ${skipped} already tracked.`);
}
