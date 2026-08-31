/**
 * One-off CLI to create an attendance-module login (jamadar, driver
 * supervisor, sanitation officer/prabhari, attendance admin, or one
 * of the 3 fleet oversight roles). There's no self-service signup by
 * design - someone with database access has to run this, same as
 * create-admin.ts / create-operator.ts.
 *
 * Usage:
 *   npm run create-attendance-user -- <username> <password> "<Display Name>" <role> [wardId]
 *   role is one of: jamadar | driver_supervisor | sanitation_officer | sanitation_prabhari |
 *     attendance_admin | junior_engineer | assistant_engineer_mechanical | maintenance_nodal_clerk
 *   wardId is REQUIRED for jamadar/driver_supervisor, and must be omitted for every other role.
 *
 * Examples:
 *   npm run create-attendance-user -- jward3 "TempPass123!" "Ramesh (Jamadar, Ward 3)" jamadar 3
 *   npm run create-attendance-user -- sofficer1 "TempPass123!" "Suresh Kumar" sanitation_officer
 *   npm run create-attendance-user -- jeng1 "TempPass123!" "Ajay Singh" junior_engineer
 */
import "dotenv/config";
import bcrypt from "bcrypt";
import { Pool } from "pg";
import { WARD_SCOPED_ROLES, CROSS_WARD_ROLES } from "../src/types/attendance.types";

const [username, password, displayName, role, wardIdArg] = process.argv.slice(2);

// Imported from the shared attendance.types.ts (the single source of
// truth for valid roles) rather than a separate hardcoded list here -
// a duplicated list silently goes stale every time a new role is
// added elsewhere (this has happened twice already), since nothing
// forces the two to be updated together.
const VALID_ROLES: string[] = [...WARD_SCOPED_ROLES, ...CROSS_WARD_ROLES];

async function main() {
  if (!username || !password || !displayName || !role) {
    console.error('Usage: npm run create-attendance-user -- <username> <password> "<Display Name>" <role> [wardId]');
    console.error(`role must be one of: ${VALID_ROLES.join(", ")}`);
    process.exit(1);
  }
  if (!VALID_ROLES.includes(role)) {
    console.error(`Invalid role "${role}". Must be one of: ${VALID_ROLES.join(", ")}`);
    process.exit(1);
  }
  // Safe cast - the check above already confirmed role is one of the valid AttendanceRole values.
  const validatedRole = role as import("../src/types/attendance.types").AttendanceRole;
  if (password.length < 8) {
    console.error("Password should be at least 8 characters.");
    process.exit(1);
  }

  const wardId = wardIdArg ? parseInt(wardIdArg, 10) : null;
  if (WARD_SCOPED_ROLES.includes(validatedRole) && !wardId) {
    console.error(`Role "${role}" requires a wardId - run "npm run list-attendance-wards" to see valid ward IDs.`);
    process.exit(1);
  }
  if (CROSS_WARD_ROLES.includes(validatedRole) && wardId) {
    console.error(`Role "${role}" is cross-ward and should not have a wardId.`);
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    if (wardId) {
      const { rows } = await pool.query("SELECT id FROM attendance_wards WHERE id = $1", [wardId]);
      if (rows.length === 0) {
        console.error(`No ward with id ${wardId} - run "npm run list-attendance-wards" to see valid ward IDs, or create one first.`);
        process.exit(1);
      }
    }

    await pool.query(
      `INSERT INTO attendance_users (username, password_hash, display_name, role, ward_id, active)
       VALUES ($1, $2, $3, $4, $5, TRUE)`,
      [username, passwordHash, displayName, role, wardId],
    );
    console.log(`Created attendance login "${username}" (${displayName}) with role ${role}${wardId ? ` in ward ${wardId}` : ""}.`);
  } catch (err) {
    console.error("Failed to create attendance login:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
