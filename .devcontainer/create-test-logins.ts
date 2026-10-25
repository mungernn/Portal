/**
 * CODESPACE / TEST DATABASE ONLY. Never run this against the SDC database.
 *
 * Creates one test login for every role in the portal, all with the same
 * password, and writes the list to .devcontainer/TEST-LOGINS.txt.
 * Safe to run again: existing test logins just get their password reset.
 *
 * Run from the repo root:
 *   bash .devcontainer/create-test-logins.sh
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcrypt";
import { Pool } from "pg";
import { ADMIN_ROLES, ADMIN_ROLE_LABELS } from "../nnm-property-tax-api/src/types/admin.types";
import {
  ATTENDANCE_ROLES,
  ATTENDANCE_ROLE_LABELS,
  WARD_SCOPED_ROLES,
} from "../nnm-property-tax-api/src/types/attendance.types";

const PASSWORD = "Test@1234";
const OUT_FILE = path.join(__dirname, "TEST-LOGINS.txt");

async function main() {
  const dbUrl = process.env.DATABASE_URL ?? "";
  if (!/@(localhost|127\.0\.0\.1|db)(:\d+)?\//.test(dbUrl)) {
    console.error("Refusing to run: DATABASE_URL is not the local Codespace database.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: dbUrl });
  const hash = await bcrypt.hash(PASSWORD, 10);
  const lines: string[] = [];
  const row = (role: string, user: string, extra = "") =>
    lines.push(`  ${role.padEnd(42)} ${user.padEnd(34)} ${extra}`);

  try {
    // ---- Staff portal: Administrator logins (one per admin role) ----
    lines.push("ADMINISTRATOR LOGIN  ->  /portal-login/admin", "");
    for (const role of ADMIN_ROLES) {
      const username = `t_${role}`;
      const { rows } = await pool.query(
        `INSERT INTO admins (username, password_hash, display_name, role, active, is_demo)
         VALUES ($1, $2, $3, $4, TRUE, FALSE)
         ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, active = TRUE
         RETURNING id, tax_collector_code`,
        [username, hash, `Test ${ADMIN_ROLE_LABELS[role]}`, role],
      );
      let extra = "";
      if (role === "tax_collector") {
        let code = rows[0].tax_collector_code as string | null;
        if (!code) {
          code = "TEST" + String(rows[0].id).padStart(3, "0");
          await pool.query(`UPDATE admins SET tax_collector_code = $1 WHERE id = $2`, [code, rows[0].id]);
        }
        extra = `(TC code: ${code})`;
      }
      row(ADMIN_ROLE_LABELS[role], username, extra);
    }

    // ---- Staff portal: Operator login (table allows max 5 operators) ----
    lines.push("", "OPERATOR LOGIN  ->  /portal-login/operator", "");
    await pool.query(
      `INSERT INTO operators (username, password_hash, display_name, active)
       VALUES ('t_operator', $1, 'Test Operator', TRUE)
       ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, active = TRUE`,
      [hash],
    );
    row("Operator", "t_operator");

    // ---- Attendance / field app logins ----
    let wardId: number;
    const ward = await pool.query(`SELECT id FROM attendance_wards WHERE ward_name = 'Test Ward 1'`);
    if (ward.rows.length) wardId = ward.rows[0].id;
    else {
      const ins = await pool.query(`INSERT INTO attendance_wards (ward_name) VALUES ('Test Ward 1') RETURNING id`);
      wardId = ins.rows[0].id;
    }

    lines.push("", "ATTENDANCE / FIELD LOGIN  ->  /attendance-login", "");
    for (const role of ATTENDANCE_ROLES) {
      const username = `a_${role}`;
      const ward = WARD_SCOPED_ROLES.includes(role) ? wardId : null;
      await pool.query(
        `INSERT INTO attendance_users (username, password_hash, display_name, role, ward_id, active)
         VALUES ($1, $2, $3, $4, $5, TRUE)
         ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, active = TRUE`,
        [username, hash, `Test ${ATTENDANCE_ROLE_LABELS[role]}`, role, ward],
      );
      row(ATTENDANCE_ROLE_LABELS[role], username, ward ? "(Test Ward 1)" : "");
    }
  } finally {
    await pool.end();
  }

  const text = [
    "TEST LOGINS - Codespace only, not the live portal",
    `Password for every account below:  ${PASSWORD}`,
    "",
    ...lines,
    "",
  ].join("\n");
  fs.writeFileSync(OUT_FILE, text);
  console.log("\n" + text);
  console.log(`Saved to .devcontainer/TEST-LOGINS.txt`);
}

main().catch((err) => {
  console.error("Failed to create test logins:", err);
  process.exit(1);
});
