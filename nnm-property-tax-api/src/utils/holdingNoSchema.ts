import { z } from "zod";

/**
 * Shared validator for holding numbers everywhere they're accepted as
 * input (route params, request bodies, query strings) - alphanumeric
 * and hyphen only, no spaces or other punctuation. Matches the actual
 * format in use (e.g. "MUNG-00022", "MUNGMC-000123") while rejecting
 * anything a citizen or operator might paste in with stray whitespace
 * or typos using the wrong separator character.
 *
 * .trim() runs first so incidental leading/trailing whitespace from
 * copy-paste doesn't itself trigger the regex failure - only spaces
 * *within* the value are actually disallowed.
 */
export const holdingNoSchema = z
  .string()
  .trim()
  .min(1, "Holding number is required")
  .max(32)
  .regex(/^[A-Za-z0-9-]+$/, "Holding number can only contain letters, numbers, and hyphens (-) - no spaces or other characters");