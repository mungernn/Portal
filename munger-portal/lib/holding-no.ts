/**
 * Strips anything that isn't a letter, digit, or hyphen as the user
 * types - matches the backend's holdingNoSchema validation exactly
 * (nnm-property-tax-api/src/utils/holdingNoSchema.ts), applied at
 * input time instead of only on submit, so a stray space or symbol
 * simply never appears rather than showing an error after the fact.
 */
export function sanitizeHoldingNoInput(raw: string): string {
  return raw.replace(/[^A-Za-z0-9-]/g, "");
}