import {
  useState,
  type FormEvent,
  type ChangeEvent,
  type CSSProperties,
} from "react";

import { Link, useNavigate } from "react-router-dom";

import { Mail, Lock, Globe } from "lucide-react";

import FormInput from "../Component/auth/FormInput";
import { loginUser, requestPasswordReset } from "../Services/auth";

const PHOTO_URL =
  "https://images.unsplash.com/photo-1515266591878-f93e32bc5937?w=1200&h=1600&fit=crop&auto=format";

const PLAYFAIR: CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
};

interface Fields {
  email: string;
  password: string;
}

interface Errors {
  email?: string;
  password?: string;
}

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function LoadingSpinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />

      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();

  const [fields, setFields] = useState<Fields>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<Errors>({});
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  async function handleForgotPassword() {
    const email = window.prompt("Enter the email address for your GlobeTrotter account.");
    if (!email) return;
    const result = await requestPasswordReset(email.trim());
    setSubmitError(result.resetUrl ? `Development reset link created: ${result.resetUrl}` : (result.message || "Unable to request a password reset."));
  }

  function updateField(field: keyof Fields) {
    return (e: ChangeEvent<HTMLInputElement>) => {
      setFields((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));

      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));

      setSubmitError("");
    };
  }

  function validate(): Errors {
    const errs: Errors = {};

    if (!fields.email || !isValidEmail(fields.email)) {
      errs.email = "Enter a valid email address";
    }

    if (!fields.password || fields.password.length < 8) {
      errs.password = "Password must be at least 8 characters";
    }

    return errs;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const errs = validate();

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const result = await loginUser({
        email: fields.email.trim(),
        password: fields.password,
        rememberMe,
      });

      if (result.success) {
        navigate("/app/dashboard");
      } else {
        setSubmitError(
          result.message ?? "Login failed. Please try again."
        );
      }
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isFormFilled =
    fields.email.trim().length > 0 &&
    fields.password.length > 0;

  const canSubmit = !isSubmitting && isFormFilled;

  return (
    <div className="flex min-h-screen overflow-hidden">
      {/* LEFT: PHOTO PANEL */}
      <aside className="relative hidden h-screen w-[52%] flex-col overflow-hidden bg-slate-900 lg:flex">
        <img
          src={PHOTO_URL}
          alt="Aerial view of dramatic mountain ridges"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-[#09152a]/55 via-[#09152a]/40 to-[#09152a]/88" />

        <div className="relative z-10 flex h-full flex-col p-10 xl:p-14">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <Globe
              className="text-white/90"
              size={22}
              strokeWidth={1.5}
            />

            <span
              className="text-[1.25rem] tracking-tight text-white"
              style={{
                ...PLAYFAIR,
                fontWeight: 600,
              }}
            >
              GlobeTrotter
            </span>
          </div>

          {/* Main Copy */}
          <div className="mb-10 mt-auto">
            <p className="mb-5 text-[0.7rem] font-light uppercase tracking-[0.2em] text-white/50">
              Your personal travel companion
            </p>

            <h2
              className="mb-5 leading-[1.05] text-white"
              style={{
                ...PLAYFAIR,
                fontSize: "clamp(2.6rem, 3.8vw, 3.8rem)",
                fontStyle: "italic",
                fontWeight: 400,
                letterSpacing: "-0.01em",
              }}
            >
              Welcome back.
            </h2>

            <p className="max-w-xs text-[1.05rem] font-light leading-relaxed text-white/65">
              Your next adventure is waiting. Sign in and pick up where you
              left off.
            </p>
          </div>

          {/* Destination Pills */}
          <div className="flex flex-wrap gap-2">
            {[
              "Jaipur",
              "Leh",
              "Kochi",
              "Goa",
              "Udaipur",
              "Rishikesh",
            ].map((dest) => (
              <span
                key={dest}
                className="rounded-full border border-white/20 px-3 py-1 text-[0.7rem] font-light tracking-wide text-white/50"
              >
                {dest}
              </span>
            ))}
          </div>
        </div>
      </aside>

      {/* RIGHT: FORM PANEL */}
      <main className="flex h-screen flex-1 items-center justify-center overflow-y-auto bg-white px-6 py-12 sm:px-10">
        <div className="w-full max-w-[22rem]">
          {/* Mobile Logo */}
          <div className="mb-10 flex items-center gap-2 lg:hidden">
            <Globe
              className="text-[#1b4f72]"
              size={21}
              strokeWidth={1.5}
            />

            <span
              className="text-xl tracking-tight text-slate-900"
              style={{
                ...PLAYFAIR,
                fontWeight: 600,
              }}
            >
              GlobeTrotter
            </span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1
              className="mb-2 text-slate-900"
              style={{
                ...PLAYFAIR,
                fontSize: "2.1rem",
                fontWeight: 700,
                lineHeight: 1.15,
              }}
            >
              Sign in
            </h1>

            <p className="text-sm font-light leading-relaxed text-slate-500">
              Welcome back — enter your credentials to continue.
            </p>
          </div>

          {/* Global Error */}
          {submitError && (
            <div
              className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
              role="alert"
            >
              {submitError}
            </div>
          )}

          {/* Login Form */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-4"
          >
            <FormInput
              label="Email address"
              icon={<Mail size={15} />}
              type="email"
              placeholder="you@example.com"
              value={fields.email}
              onChange={updateField("email")}
              error={errors.email}
              autoComplete="email"
              required
            />

            <FormInput
              label="Password"
              icon={<Lock size={15} />}
              isPassword
              placeholder="Your password"
              value={fields.password}
              onChange={updateField("password")}
              error={errors.password}
              autoComplete="current-password"
              required
            />

            {/* Remember Me + Forgot Password */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex cursor-pointer select-none items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) =>
                    setRememberMe(e.target.checked)
                  }
                  className="h-4 w-4 cursor-pointer rounded accent-[#1b4f72]"
                />

                <span className="text-sm font-light text-slate-500">
                  Remember me
                </span>
              </label>

              <button
                type="button"
                className="font-medium text-[#1b4f72] transition-colors hover:text-[#154060] focus-visible:underline"
                onClick={handleForgotPassword}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!canSubmit}
              className={[
                "mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-3.5 text-sm font-semibold tracking-wide text-white",
                "transition-all duration-200",
                canSubmit
                  ? "cursor-pointer bg-[#1b4f72] shadow-sm hover:bg-[#154060] hover:shadow-md active:scale-[0.99]"
                  : "cursor-not-allowed bg-[#1b4f72]/40",
              ].join(" ")}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner />
                  <span>Signing in...</span>
                </>
              ) : (
                "Log In"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-sm font-light text-slate-500">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-semibold text-[#1b4f72] transition-colors hover:text-[#154060]"
            >
              Sign up free
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
