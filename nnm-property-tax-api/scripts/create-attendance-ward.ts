/**
 * One-off CLI to create an attendance ward.
 *
 * Usage:
 *   npm run create-attendance-ward -- "<Ward Name>"
 *
 * Example:
 *   npm run create-attendance-ward -- "Ward 3"
 */
import "dotenv/config";
import { Pool } from "pg";

const [wardName] = process.argv.slice(2);

async function main() {
  if (!wardName) {
    console.error('Usage: npm run create-attendance-ward -- "<Ward Name>"');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const { rows } = await pool.query(
      "INSERT INTO attendance_wards (ward_name) VALUES ($1) RETURNING id",
      [wardName],
    );
    console.log(`Created ward "${wardName}" with id ${rows[0].id}.`);
  } catch (err) {
    console.error("Failed to create ward:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
