"use client";

import { useId, useState, type FormEvent } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export interface CitizenLoginValues {
  mobile: string;
  password: string;
}

export interface CitizenLoginFormProps {
  /** Called with validated form values. Throw to surface an error message. */
  onSubmit?: (values: CitizenLoginValues) => Promise<void> | void;
  forgotPasswordHref?: string;
  registerHref?: string;
}

const MOBILE_PATTERN = /^[6-9]\d{9}$/;

export function CitizenLoginForm({
  onSubmit,
  forgotPasswordHref = "/forgot-password",
  registerHref = "/register",
}: CitizenLoginFormProps) {
  const mobileId = useId();
  const passwordId = useId();
  const mobileErrorId = `${mobileId}-error`;
  const passwordErrorId = `${passwordId}-error`;

  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    mobile?: string;
    password?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);

  function validate(): boolean {
    const errors: { mobile?: string; password?: string } = {};

    if (!mobile) {
      errors.mobile = "Enter your registered mobile number.";
    } else if (!MOBILE_PATTERN.test(mobile)) {
      errors.mobile = "Enter a valid 10-digit mobile number.";
    }

    if (!password) {
      errors.password = "Enter your password.";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    if (!validate()) return;

    setSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit({ mobile, password });
      } else {
        // Placeholder behaviour until an auth endpoint is wired up.
        await new Promise((resolve) => setTimeout(resolve, 700));
      }
    } catch {
      setFormError(
        "We couldn't log you in. Check your mobile number and password, then try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-7 shadow-sm sm:p-8"
    >
      <h1 className="mb-1 text-xl font-semibold text-slate-900">
        Citizen Login
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        Log in with your registered mobile number to access NNM citizen
        services.
      </p>

      {formError && (
        <div
          role="alert"
          className="mb-5 rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
        >
          {formError}
        </div>
      )}

      <div className="mb-4">
        <label
          htmlFor={mobileId}
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Mobile number
        </label>
        <div className="flex items-stretch overflow-hidden rounded-md border border-slate-300 focus-within:ring-2 focus-within:ring-nnm-blue focus-within:ring-offset-1">
          <span className="flex items-center border-r border-slate-300 bg-slate-50 px-3 text-sm text-slate-500">
            +91
          </span>
          <input
            id={mobileId}
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            maxLength={10}
            placeholder="98XXXXXXXX"
            value={mobile}
            onChange={(e) =>
              setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
            }
            aria-invalid={Boolean(fieldErrors.mobile)}
            aria-describedby={fieldErrors.mobile ? mobileErrorId : undefined}
            className="w-full px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>
        {fieldErrors.mobile && (
          <p id={mobileErrorId} className="mt-1.5 text-xs text-red-600">
            {fieldErrors.mobile}
          </p>
        )}
      </div>

      <div className="mb-2">
        <div className="mb-1.5 flex items-center justify-between">
          <label
            htmlFor={passwordId}
            className="block text-sm font-medium text-slate-700"
          >
            Password
          </label>
          <Link
            href={forgotPasswordHref}
            className="text-xs font-medium text-nnm-blue hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <div className="flex items-stretch overflow-hidden rounded-md border border-slate-300 focus-within:ring-2 focus-within:ring-nnm-blue focus-within:ring-offset-1">
          <input
            id={passwordId}
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={
              fieldErrors.password ? passwordErrorId : undefined
            }
            className="w-full px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="flex items-center px-3 text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:text-nnm-blue"
          >
            {showPassword ? (
              <EyeOff className="h-[18px] w-[18px]" />
            ) : (
              <Eye className="h-[18px] w-[18px]" />
            )}
          </button>
        </div>
        {fieldErrors.password && (
          <p id={passwordErrorId} className="mt-1.5 text-xs text-red-600">
            {fieldErrors.password}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-nnm-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-nnm-blue-dark disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitting ? "Logging in…" : "Log In"}
      </button>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-400">New to the portal?</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <Link
        href={registerHref}
        className="flex w-full items-center justify-center rounded-md border border-nnm-blue px-4 py-2.5 text-sm font-semibold text-nnm-blue transition-colors hover:bg-blue-50"
      >
        Register as New Citizen
      </Link>
    </form>
  );
}
