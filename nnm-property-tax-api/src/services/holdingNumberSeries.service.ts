import { pool } from "../config/db";
import { propertyRepository } from "../repositories/property.repository";
import {
  NEW_HOLDING_NO_DIGITS,
  NEW_HOLDING_NO_PREFIX,
  PARTIALLY_KNOWN_HOLDING_NO_DIGITS,
  PARTIALLY_KNOWN_HOLDING_NO_PREFIX,
  MIGRATED_HOLDING_NO_DIGITS,
  MIGRATED_HOLDING_NO_PREFIX,
  FINALIZED_MIGRATED_HOLDING_NO_DIGITS,
  FINALIZED_MIGRATED_HOLDING_NO_PREFIX,
} from "../constants/taxRates";

async function getNextHoldingNoForSeries(prefix: string, digits: number): Promise<string> {
  const maxNum = await propertyRepository.getMaxHoldingNoUnderPrefix(prefix);
  return prefix + String(maxNum + 1).padStart(digits, "0");
}

export function getNextNewHoldingNo(): Promise<string> {
  return getNextHoldingNoForSeries(NEW_HOLDING_NO_PREFIX, NEW_HOLDING_NO_DIGITS);
}

export function getNextPartiallyKnownHoldingNo(): Promise<string> {
  return getNextHoldingNoForSeries(PARTIALLY_KNOWN_HOLDING_NO_PREFIX, PARTIALLY_KNOWN_HOLDING_NO_DIGITS);
}

/**
 * MUNG-MIG- numbers come from the same counter as the old records' MIG- numbers (migrated_holding_no_seq, migration
 * 187), so a record's MIG-<n> can always become MUNG-MIG-<n> without colliding with a holding made another way.
 */
export async function getNextMigratedHoldingNo(): Promise<string> {
  return MIGRATED_HOLDING_NO_PREFIX + String(await nextMigratedNumber()).padStart(MIGRATED_HOLDING_NO_DIGITS, "0");
}

/** The next number of the MIG- / MUNG-MIG- counter - above any MUNG-MIG- holding already present. */
export async function nextMigratedNumber(): Promise<number> {
  for (;;) {
    const { rows } = await pool.query<{ n: string }>(`SELECT nextval('migrated_holding_no_seq') AS n`);
    const n = Number(rows[0]!.n);
    // Skip a number already used by a holding (e.g. one created before the counter existed).
    const taken = await propertyRepository.findByHoldingNo(MIGRATED_HOLDING_NO_PREFIX + String(n).padStart(MIGRATED_HOLDING_NO_DIGITS, "0"));
    if (!taken) return n;
  }
}

/** `count` numbers of the MIG- / MUNG-MIG- counter at once, in increasing order (for approving many records together). */
export async function nextMigratedNumbers(count: number): Promise<number[]> {
  const fmt = (n: number) => MIGRATED_HOLDING_NO_PREFIX + String(n).padStart(MIGRATED_HOLDING_NO_DIGITS, "0");
  const out: number[] = [];
  while (out.length < count) {
    const { rows } = await pool.query<{ n: string }>(`SELECT nextval('migrated_holding_no_seq') AS n FROM generate_series(1, $1)`, [
      count - out.length,
    ]);
    const nums = rows.map((r) => Number(r.n));
    // Skip numbers already used by a holding (e.g. one created before the counter existed).
    const { rows: taken } = await pool.query<{ h: string }>(`SELECT upper(holding_no) AS h FROM properties WHERE upper(holding_no) = ANY($1::text[])`, [
      nums.map(fmt),
    ]);
    const t = new Set(taken.map((r) => r.h));
    out.push(...nums.filter((n) => !t.has(fmt(n))));
  }
  return out.sort((x, y) => x - y);
}

export function getNextFinalizedMigratedHoldingNo(): Promise<string> {
  return getNextHoldingNoForSeries(FINALIZED_MIGRATED_HOLDING_NO_PREFIX, FINALIZED_MIGRATED_HOLDING_NO_DIGITS);
}