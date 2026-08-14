/**
 * One-off CLI to reset an operator's password. Useful since operator
 * accounts from migrate-from-csv.ts got random temporary passwords
 * printed to the console once, at migration time — if that output
 * wasn't saved, this is how you set a new one.
 *
 * Usage:
 *   npm run reset-operator-password -- <username> <newPassword>
 *
 * Example:
 *   npm run reset-operator-password -- jdoe "NewPass123!"
 */
import "dotenv/config";
import bcrypt from "bcrypt";
import { Pool } from "pg";

const [username, newPassword] = process.argv.slice(2);

async function main() {
  if (!username || !newPassword) {
    console.error("Usage: npm run reset-operator-password -- <username> <newPassword>");
    process.exit(1);
  }
  if (newPassword.length < 8) {
    console.error("Password should be at least 8 characters.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const passwordHash = await bcrypt.hash(newPassword, 12);

  try {
    const { rowCount } = await pool.query(
      `UPDATE operators SET password_hash = $2 WHERE username = $1`,
      [username, passwordHash],
    );
    if (rowCount === 0) {
      console.error(`No operator found with username "${username}".`);
      process.exit(1);
    }
    console.log(`Password reset for operator "${username}".`);
  } catch (err) {
    console.error("Failed to reset password:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();