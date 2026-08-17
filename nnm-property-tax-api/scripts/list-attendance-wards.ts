/**
 * One-off CLI to list all attendance wards and their IDs - used when
 * creating jamadar/driver-supervisor logins, which need a wardId.
 *
 * Usage:
 *   npm run list-attendance-wards
 */
import "dotenv/config";
import { Pool } from "pg";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const { rows } = await pool.query("SELECT id, ward_name FROM attendance_wards ORDER BY id ASC");
    if (rows.length === 0) {
      console.log("No attendance wards yet - create one with: npm run create-attendance-ward -- \"<Ward Name>\"");
      return;
    }
    console.log("id\tward_name");
    for (const r of rows) {
      console.log(`${r.id}\t${r.ward_name}`);
    }
  } finally {
    await pool.end();
  }
}

main();
