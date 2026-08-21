/**
 * One-off CLI to create an operator account. There's no self-service
 * operator signup by design - someone with database access has to run
 * this. Note: the operators table enforces a hard cap of 5 accounts at
 * the database level (see migration 002_limit_operators.sql) - this
 * will fail with a clear Postgres error if that limit is already hit.
 *
 * Usage:
 *   npm run create-operator -- <username> <password> "<Display Name>"
 *
 * Example:
 *   npm run create-operator -- Operator1KK "Opr234RT" "Operator Window 1"
 */
import "dotenv/config";
import bcrypt from "bcrypt";
import { Pool } from "pg";

const [username, password, displayName] = process.argv.slice(2);

async function main() {
  if (!username || !password || !displayName) {
    console.error('Usage: npm run create-operator -- <username> <password> "<Display Name>"');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password should be at least 8 characters.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await pool.query(
      `INSERT INTO operators (username, password_hash, display_name, active)
       VALUES ($1, $2, $3, TRUE)`,
      [username, passwordHash, displayName],
    );
    console.log(`Created operator "${username}" (${displayName}).`);
  } catch (err) {
    console.error("Failed to create operator:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();