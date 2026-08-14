/**
 * One-off CLI to set (or update) an admin's email address — required
 * before that account can use "forgot password", since existing admin
 * accounts were created without one.
 *
 * Usage:
 *   npm run set-admin-email -- <username> <email>
 *
 * Example:
 *   npm run set-admin-email -- commissioner1 "commissioner@munger.gov.in"
 */
import "dotenv/config";
import { Pool } from "pg";

const [username, email] = process.argv.slice(2);

async function main() {
  if (!username || !email) {
    console.error("Usage: npm run set-admin-email -- <username> <email>");
    process.exit(1);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("That doesn't look like a valid email address.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const { rowCount } = await pool.query(`UPDATE admins SET email = $2 WHERE username = $1`, [username, email]);
    if (rowCount === 0) {
      console.error(`No admin found with username "${username}".`);
      process.exit(1);
    }
    console.log(`Email set for admin "${username}": ${email}`);
  } catch (err) {
    console.error("Failed to set email:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();