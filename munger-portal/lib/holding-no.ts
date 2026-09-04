/**
 * Strips anything that isn't a letter, digit, or one of the allowed
 * punctuation characters as the user types - matches the backend's
 * holdingNoSchema validation exactly
 * (nnm-property-tax-api/src/utils/holdingNoSchema.ts), applied at
 * input time instead of only on submit, so a stray space or
 * disallowed symbol simply never appears rather than showing an
 * error after the fact. Spaces are still stripped - that's what
 * originally caused duplicate holdings, and remains the actual
 * problem this exists to prevent.
 */
export function sanitizeHoldingNoInput(raw: string): string {
  return raw.replace(/[^A-Za-z0-9\-/\\()[\],.]/g, "");
}

/**
 * A wider sanitizer for old_holding_no/old_pid specifically - these
 * are legacy reference fields, never used for routing or lookups by
 * URL path/query the way the primary holding_no is, so they can
 * safely allow "+" (seen in real legacy numbers) without the same
 * URL-encoding risk (a literal "+" in a query string is decoded as a
 * space) that's the reason the primary holding_no validator stays
 * stricter. Spaces are still stripped for the same duplicate-holding
 * reason as above.
 */
export function sanitizeOldHoldingNoInput(raw: string): string {
  return raw.replace(/[^A-Za-z0-9\-/\\()[\],.+]/g, "");
}