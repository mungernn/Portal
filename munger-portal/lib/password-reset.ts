const API_BASE_URL =
  process.env.NEXT_PUBLIC_PROPERTY_TAX_API_URL || "http://localhost:4000/api/v1";

export type StaffAccountType = "admin" | "operator";

function basePath(accountType: StaffAccountType): string {
  return accountType === "admin" ? `${API_BASE_URL}/admin/auth` : `${API_BASE_URL}/auth`;
}

/**
 * Always resolves successfully (the backend intentionally returns the
 * same generic message whether or not the email matches an account —
 * see the backend's requestPasswordReset for why). A network/server
 * failure is the only thing that throws here.
 */
export async function requestPasswordReset(accountType: StaffAccountType, email: string): Promise<string> {
  const res = await fetch(`${basePath(accountType)}/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "Something went wrong — please try again.");
  return body.message as string;
}

export async function submitPasswordReset(
  accountType: StaffAccountType,
  token: string,
  newPassword: string,
): Promise<string> {
  const res = await fetch(`${basePath(accountType)}/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "Could not reset your password.");
  return body.message as string;
}