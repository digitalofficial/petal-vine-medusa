import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { deleteProductsWorkflow } from "@medusajs/medusa/core-flows";

// Removes ALL Medusa demo data: the sample products AND their inventory items
// (which are left orphaned on the Inventory page when only the products are
// deleted). Idempotent. Run with:
//   npx medusa exec ./src/scripts/rm-demo-all.ts

const DEMO_HANDLES = ["t-shirt", "sweatshirt", "sweatpants", "shorts", "longsleeve"];
const DEMO_SKU_PREFIXES = ["SHIRT-", "SWEATSHIRT-", "SWEATPANTS-", "SHORTS-", "LONGSLEEVE-"];

export default async function rmDemoAll({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const inventoryModuleService = container.resolve(Modules.INVENTORY);

  // 1. Delete the demo products (if any are still present).
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle"],
  });
  const demoProducts = products.filter((p: any) => DEMO_HANDLES.includes(p.handle));

  if (demoProducts.length) {
    logger.info(
      `Deleting ${demoProducts.length} demo product(s): ${demoProducts
        .map((p: any) => p.title)
        .join(", ")}`
    );
    await deleteProductsWorkflow(container).run({
      input: { ids: demoProducts.map((p: any) => p.id) },
    });
  } else {
    logger.info("No demo products remaining.");
  }

  // 2. Delete leftover demo inventory items (orphaned by the product deletion).
  const { data: items } = await query.graph({
    entity: "inventory_item",
    fields: ["id", "sku"],
  });
  const demoItems = items.filter(
    (i: any) => i.sku && DEMO_SKU_PREFIXES.some((prefix) => i.sku.startsWith(prefix))
  );

  if (demoItems.length) {
    logger.info(
      `Deleting ${demoItems.length} demo inventory item(s): ${demoItems
        .map((i: any) => i.sku)
        .join(", ")}`
    );
    await inventoryModuleService.deleteInventoryItems(demoItems.map((i: any) => i.id));
  } else {
    logger.info("No demo inventory items remaining.");
  }

  logger.info("Done. Demo data cleaned up.");
}
