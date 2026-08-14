/**
 * One-off CLI to reset an admin's password.
 *
 * Usage:
 *   npm run reset-admin-password -- <username> <newPassword>
 *
 * Example:
 *   npm run reset-admin-password -- commissioner1 "NewPass123!"
 */
import "dotenv/config";
import bcrypt from "bcrypt";
import { Pool } from "pg";

const [username, newPassword] = process.argv.slice(2);

async function main() {
  if (!username || !newPassword) {
    console.error("Usage: npm run reset-admin-password -- <username> <newPassword>");
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
      `UPDATE admins SET password_hash = $2 WHERE username = $1`,
      [username, passwordHash],
    );
    if (rowCount === 0) {
      console.error(`No admin found with username "${username}".`);
      process.exit(1);
    }
    console.log(`Password reset for admin "${username}".`);
  } catch (err) {
    console.error("Failed to reset password:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();