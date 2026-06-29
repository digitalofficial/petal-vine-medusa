const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  // Find demo product IDs (Medusa default products)
  const res = await pool.query(
    "SELECT id, title FROM product WHERE handle IN ('t-shirt', 'sweatshirt', 'sweatpants', 'shorts', 'longsleeve')"
  );

  if (res.rows.length === 0) {
    console.log("No demo products found.");
    process.exit();
  }

  const ids = res.rows.map(r => r.id);
  console.log("Removing demo products:", res.rows.map(r => r.title));

  // Get all table names to find the right ones
  const tables = await pool.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
  );
  const tableNames = tables.rows.map(r => r.tablename);

  // Delete from related tables that exist
  const tryDelete = async (sql, params) => {
    try { await pool.query(sql, params); } catch (e) { /* skip if table doesn't exist */ }
  };

  for (const prefix of [
    "cart_line_item", "order_line_item",
    "product_variant_price_set", "product_variant_inventory_item",
  ]) {
    await tryDelete(`DELETE FROM "${prefix}" WHERE variant_id IN (SELECT id FROM product_variant WHERE product_id = ANY($1))`, [ids]);
  }

  await tryDelete("DELETE FROM product_option_value WHERE option_id IN (SELECT id FROM product_option WHERE product_id = ANY($1))", [ids]);
  await tryDelete("DELETE FROM product_variant WHERE product_id = ANY($1)", [ids]);
  await tryDelete("DELETE FROM product_option WHERE product_id = ANY($1)", [ids]);
  await tryDelete("DELETE FROM product_category_product WHERE product_id = ANY($1)", [ids]);
  await tryDelete("DELETE FROM product_sales_channel WHERE product_id = ANY($1)", [ids]);
  await tryDelete("DELETE FROM product_shipping_profile WHERE product_id = ANY($1)", [ids]);

  // Try both possible image table names
  await tryDelete("DELETE FROM image WHERE id IN (SELECT image_id FROM product_images WHERE product_id = ANY($1))", [ids]);
  await tryDelete("DELETE FROM product_images WHERE product_id = ANY($1)", [ids]);

  await pool.query("DELETE FROM product WHERE id = ANY($1)", [ids]);

  console.log("Done! Removed", ids.length, "demo products.");
  process.exit();
}

run().catch(e => { console.error(e.message); process.exit(1); });
