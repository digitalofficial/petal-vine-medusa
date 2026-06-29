import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

// Replaces dead Unsplash thumbnails on existing products with working URLs.
// Run against the live DB with:  npx medusa exec ./src/scripts/fix-flower-images.ts
const FIXES: { handle: string; thumbnail: string; image: string }[] = [
  {
    handle: "wildflower-meadow",
    thumbnail: "https://images.unsplash.com/photo-1471696035578-3d8c78d99684?w=600&q=80",
    image: "https://images.unsplash.com/photo-1471696035578-3d8c78d99684?w=800&q=80",
  },
  {
    handle: "bridal-cascade-bouquet",
    thumbnail: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=80",
    image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80",
  },
];

export default async function fixFlowerImages({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const productModuleService = container.resolve(Modules.PRODUCT);

  for (const fix of FIXES) {
    const [product] = await productModuleService.listProducts({ handle: fix.handle });
    if (!product) {
      logger.warn(`No product found with handle "${fix.handle}" — skipping.`);
      continue;
    }

    await productModuleService.updateProducts(product.id, {
      thumbnail: fix.thumbnail,
      images: [{ url: fix.image }],
    });

    logger.info(`Updated images for "${product.title}" (${fix.handle}).`);
  }

  logger.info("Finished fixing flower images.");
}
