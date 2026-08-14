"use client";

import { useId, useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { requestPasswordReset, type StaffAccountType } from "@/lib/password-reset";

export function ForgotPasswordForm({
  role,
  heading,
  description,
}: {
  role: StaffAccountType;
  heading: string;
  description: string;
}) {
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }
    setSubmitting(true);
    try {
      const msg = await requestPasswordReset(role, email.trim());
      setMessage(msg);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong — please try again.");
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
          className="mt-5 block text-center text-xs font-medium text-nnm-blue hover:underline"
        >
          ← Back to login
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

      <div className="mb-2">
        <label htmlFor={emailId} className="mb-1.5 block text-sm font-medium text-slate-700">
          Registered email
        </label>
        <input
          id={emailId}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-nnm-blue focus:ring-offset-1"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-nnm-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-nnm-blue-dark disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitting ? "Sending…" : "Send Reset Link"}
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