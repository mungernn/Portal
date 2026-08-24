/**
 * One-off CLI to create a Jamadar login for every ward that doesn't
 * already have one - reads directly from attendance_wards, so there's
 * no need to type out 50+ ward IDs by hand. Generates a random
 * password per account and prints a full credentials sheet at the end
 * (also saved to a CSV file) for handing out to field staff.
 *
 * Idempotent: if a ward already has an active jamadar, it's skipped
 * (not recreated, not overwritten) - safe to re-run after adding new
 * wards later without disturbing existing logins.
 *
 * Usage:
 *   npm run bulk-create-jamadars
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcrypt";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function randomPassword(): string {
  // Short, readable, still hard to guess - two words + a number, easy
  // to read aloud or write on a slip of paper for field staff who may
  // not be tech-savvy.
  const words = ["Kiran", "Surya", "Nadi", "Bihar", "Ganga", "Munger", "Prakash", "Sagar", "Vayu", "Megh"];
  const w1 = words[Math.floor(Math.random() * words.length)];
  const w2 = words[Math.floor(Math.random() * words.length)];
  const n = Math.floor(1000 + Math.random() * 9000);
  return `${w1}${w2}${n}`;
}

function usernameFromWard(wardName: string): string {
  const slug = wardName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 20);
  return `jamadar-${slug}`;
}

async function main() {
  const { rows: wards } = await pool.query<{ id: number; ward_name: string }>(
    `SELECT id, ward_name FROM attendance_wards ORDER BY id ASC`,
  );
  console.log(`Found ${wards.length} wards.`);

  const created: { wardId: number; wardName: string; username: string; password: string }[] = [];
  const skipped: { wardId: number; wardName: string; existingUsername: string }[] = [];

  for (const ward of wards) {
    const { rows: existing } = await pool.query<{ username: string }>(
      `SELECT username FROM attendance_users WHERE ward_id = $1 AND role = 'jamadar' AND active = TRUE LIMIT 1`,
      [ward.id],
    );
    if (existing.length > 0) {
      skipped.push({ wardId: ward.id, wardName: ward.ward_name, existingUsername: existing[0]!.username });
      continue;
    }

    let username = usernameFromWard(ward.ward_name);
    // Guard against a slug collision across two differently-named wards - append the ward id if needed.
    const { rows: usernameTaken } = await pool.query(`SELECT 1 FROM attendance_users WHERE username = $1`, [username]);
    if (usernameTaken.length > 0) username = `${username}-${ward.id}`;

    const password = randomPassword();
    const passwordHash = await bcrypt.hash(password, 12);
    const displayName = `Jamadar - ${ward.ward_name}`;

    await pool.query(
      `INSERT INTO attendance_users (username, password_hash, display_name, role, ward_id, active)
       VALUES ($1, $2, $3, 'jamadar', $4, TRUE)`,
      [username, passwordHash, displayName, ward.id],
    );
    created.push({ wardId: ward.id, wardName: ward.ward_name, username, password });
  }

  console.log(`\nCreated ${created.length} new Jamadar logins. Skipped ${skipped.length} wards that already had one.\n`);

  if (created.length > 0) {
    console.log("Ward ID | Ward Name | Username | Password");
    console.log("--------|-----------|----------|----------");
    for (const c of created) {
      console.log(`${c.wardId} | ${c.wardName} | ${c.username} | ${c.password}`);
    }

    const csvLines = ["ward_id,ward_name,username,password"];
    for (const c of created) {
      csvLines.push(`${c.wardId},"${c.wardName}",${c.username},${c.password}`);
    }
    const outPath = path.join(__dirname, "..", "jamadar-credentials.csv");
    fs.writeFileSync(outPath, csvLines.join("\n") + "\n");
    console.log(`\nSaved to ${outPath} - copy this off the server and delete it once distributed to staff.`);
  }

  if (skipped.length > 0) {
    console.log("\nSkipped (already had a jamadar):");
    for (const s of skipped) {
      console.log(`  Ward ${s.wardId} (${s.wardName}) - existing username: ${s.existingUsername}`);
    }
  }

  await pool.end();
}

main().catch((err) => {
  console.error("Bulk creation failed:", err);
  process.exit(1);
});
