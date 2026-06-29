import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { deleteProductsWorkflow } from "@medusajs/medusa/core-flows";

export default async function removeDemoProducts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle"],
  });

  const demoHandles = ["t-shirt", "sweatshirt", "sweatpants", "shorts", "longsleeve"];
  const toDelete = products.filter((p: any) => demoHandles.includes(p.handle));

  if (toDelete.length === 0) {
    logger.info("No demo products found.");
    return;
  }

  logger.info(`Deleting ${toDelete.length} demo products: ${toDelete.map((p: any) => p.title).join(", ")}`);

  await deleteProductsWorkflow(container).run({
    input: { ids: toDelete.map((p: any) => p.id) },
  });

  logger.info("Done! Demo products removed.");
}
