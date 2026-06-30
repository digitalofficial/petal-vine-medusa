import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

// Renames the store (shown in the admin sidebar) to "Petal & Vine".
// Run with:  npx medusa exec ./src/scripts/rename-store.ts
const NEW_NAME = "Petal & Vine";

export default async function renameStore({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const storeModuleService = container.resolve(Modules.STORE);

  const [store] = await storeModuleService.listStores();
  if (!store) {
    logger.error("No store found.");
    return;
  }

  await storeModuleService.updateStores(store.id, { name: NEW_NAME });
  logger.info(`Renamed store: "${store.name}" → "${NEW_NAME}"`);
}
