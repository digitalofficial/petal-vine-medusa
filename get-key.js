const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("SELECT id, token, title FROM api_key").then((r) => {
  console.log(JSON.stringify(r.rows, null, 2));
  process.exit();
});
