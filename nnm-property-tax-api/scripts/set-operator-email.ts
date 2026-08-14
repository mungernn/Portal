/**
 * One-off CLI to set (or update) an operator's email address — required
 * before that account can use "forgot password", since existing
 * operator accounts were created without one.
 *
 * Usage:
 *   npm run set-operator-email -- <username> <email>
 *
 * Example:
 *   npm run set-operator-email -- counter1 "counter1@munger.gov.in"
 */
import "dotenv/config";
import { Pool } from "pg";

const [username, email] = process.argv.slice(2);

async function main() {
  if (!username || !email) {
    console.error("Usage: npm run set-operator-email -- <username> <email>");
    process.exit(1);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("That doesn't look like a valid email address.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const { rowCount } = await pool.query(`UPDATE operators SET email = $2 WHERE username = $1`, [username, email]);
    if (rowCount === 0) {
      console.error(`No operator found with username "${username}".`);
      process.exit(1);
    }
    console.log(`Email set for operator "${username}": ${email}`);
  } catch (err) {
    console.error("Failed to set email:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();