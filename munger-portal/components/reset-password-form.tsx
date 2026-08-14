"use client";

import { useId, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { submitPasswordReset, type StaffAccountType } from "@/lib/password-reset";

export function ResetPasswordForm({
  role,
  heading,
  description,
}: {
  role: StaffAccountType;
  heading: string;
  description: string;
}) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const passwordId = useId();
  const confirmId = useId();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("This reset link is missing its token — please use the link from your email exactly as sent.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      const msg = await submitPasswordReset(role, token, newPassword);
      setMessage(msg);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset your password.");
    } finally {
      setSubmitting(false);
    }
  }

  if (message) {
    return (
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
        <div role="status" className="flex items-start gap-2.5 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {message}
        </div>
        <Link
          href={`/portal-login/${role}`}
          className="mt-5 block text-center text-sm font-semibold text-nnm-blue hover:underline"
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-7 shadow-sm sm:p-8"
    >
      <h1 className="mb-1 text-xl font-semibold text-slate-900">{heading}</h1>
      <p className="mb-6 text-sm text-slate-500">{description}</p>

      {error && (
        <div role="alert" className="mb-5 rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      {!token && (
        <div role="alert" className="mb-5 rounded-md border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">
          No reset token found in this link. Open this page using the exact link from your email.
        </div>
      )}

      <div className="mb-4">
        <label htmlFor={passwordId} className="mb-1.5 block text-sm font-medium text-slate-700">
          New password
        </label>
        <div className="flex items-stretch overflow-hidden rounded-md border border-slate-300 focus-within:ring-2 focus-within:ring-nnm-blue focus-within:ring-offset-1">
          <input
            id={passwordId}
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="flex items-center px-3 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
          </button>
        </div>
      </div>

      <div className="mb-2">
        <label htmlFor={confirmId} className="mb-1.5 block text-sm font-medium text-slate-700">
          Confirm new password
        </label>
        <input
          id={confirmId}
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-nnm-blue focus:ring-offset-1"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-nnm-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-nnm-blue-dark disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitting ? "Resetting…" : "Reset Password"}
      </button>

      <Link
        href={`/portal-login/${role}`}
        className="mt-5 block text-center text-xs font-medium text-nnm-blue hover:underline"
      >
        ← Back to login
      </Link>
    </form>
  );
}