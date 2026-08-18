const API_BASE_URL =
  process.env.NEXT_PUBLIC_PROPERTY_TAX_API_URL || "http://localhost:4000/api/v1";

/**
 * Public, unauthenticated lookup — used by both the operator's payment
 * form and the citizen-facing payment page. Returns null (not a thrown
 * error) for "not found", since that's an expected, normal outcome
 * while someone is still typing a code — only network/server failures
 * should surface as errors to the caller.
 */
export async function lookupTaxCollectorByCode(code: string): Promise<{ code: string; name: string } | null> {
  const res = await fetch(`${API_BASE_URL}/tax-collectors/lookup/${encodeURIComponent(code)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Could not look up tax collector.");
  return res.json();
}