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

  // Delete in correct order to avoid FK constraints
  await pool.query("DELETE FROM cart_line_item WHERE variant_id IN (SELECT id FROM product_variant WHERE product_id = ANY($1))", [ids]);
  await pool.query("DELETE FROM order_line_item WHERE variant_id IN (SELECT id FROM product_variant WHERE product_id = ANY($1))", [ids]);
  await pool.query("DELETE FROM product_variant_price_set WHERE variant_id IN (SELECT id FROM product_variant WHERE product_id = ANY($1))", [ids]);
  await pool.query("DELETE FROM product_variant_inventory_item WHERE variant_id IN (SELECT id FROM product_variant WHERE product_id = ANY($1))", [ids]);
  await pool.query("DELETE FROM product_option_value WHERE option_id IN (SELECT id FROM product_option WHERE product_id = ANY($1))", [ids]);
  await pool.query("DELETE FROM product_variant WHERE product_id = ANY($1)", [ids]);
  await pool.query("DELETE FROM product_option WHERE product_id = ANY($1)", [ids]);
  await pool.query("DELETE FROM product_image WHERE product_id = ANY($1)", [ids]);
  await pool.query("DELETE FROM product_category_product WHERE product_id = ANY($1)", [ids]);
  await pool.query("DELETE FROM product_sales_channel WHERE product_id = ANY($1)", [ids]);
  await pool.query("DELETE FROM product_shipping_profile WHERE product_id = ANY($1)", [ids]);
  await pool.query("DELETE FROM product WHERE id = ANY($1)", [ids]);

  console.log("Done! Removed", ids.length, "demo products.");
  process.exit();
}

run().catch(e => { console.error(e.message); process.exit(1); });
