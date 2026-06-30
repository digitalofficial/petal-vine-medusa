import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

// Read-only diagnostic: prints the base data the admin Inventory page needs.
// Run with:  npx medusa exec ./src/scripts/diagnose.ts
export default async function diagnose({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  async function show(label: string, run: () => Promise<unknown>) {
    try {
      const result = await run();
      logger.info(`✅ ${label}: ${JSON.stringify(result)}`);
    } catch (e) {
      logger.error(`❌ ${label} FAILED: ${(e as Error).message}`);
    }
  }

  await show("STOCK LOCATIONS", async () => {
    const { data } = await query.graph({
      entity: "stock_location",
      fields: ["id", "name"],
    });
    return { count: data.length, names: data.map((l: any) => l.name) };
  });

  await show("STOCK LOCATION → SALES CHANNEL links", async () => {
    const { data } = await query.graph({
      entity: "stock_location",
      fields: ["id", "name", "sales_channels.id", "sales_channels.name"],
    });
    return data.map((l: any) => ({
      location: l.name,
      sales_channels: (l.sales_channels || []).map((s: any) => s.name),
    }));
  });

  await show("SALES CHANNELS", async () => {
    const { data } = await query.graph({
      entity: "sales_channel",
      fields: ["id", "name"],
    });
    return { count: data.length, names: data.map((s: any) => s.name) };
  });

  await show("INVENTORY ITEMS", async () => {
    const { data } = await query.graph({
      entity: "inventory_item",
      fields: ["id"],
    });
    return { count: data.length };
  });

  await show("PRODUCTS", async () => {
    const { data } = await query.graph({
      entity: "product",
      fields: ["id", "title"],
    });
    return { count: data.length, titles: data.map((p: any) => p.title) };
  });

  logger.info("Diagnostic complete.");
}
