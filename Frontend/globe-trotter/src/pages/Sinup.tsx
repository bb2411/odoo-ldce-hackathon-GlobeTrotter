import {
  useState,
  type FormEvent,
  type ChangeEvent,
  type CSSProperties,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Globe,
  Check,
} from "lucide-react";

import FormInput from "../Component/auth/FormInput";
import { signupUser } from "../Services/auth";

const PHOTO_URL =
  "https://images.unsplash.com/photo-1774979131447-525875465c2a?w=1200&h=1600&fit=crop&auto=format";

const PLAYFAIR: CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
};

interface Fields {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface Errors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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

function PasswordStrength({
  password,
}: {
  password: string;
}) {
  if (!password) return null;

  const checks = [
    {
      label: "8+ characters",
      met: password.length >= 8,
    },
    {
      label: "Uppercase",
      met: /[A-Z]/.test(password),
    },
    {
      label: "Number",
      met: /[0-9]/.test(password),
    },
  ];

  return (
    <div className="mt-1 flex gap-2">
      {checks.map(({ label, met }) => (
        <span
          key={label}
          className={[
            "flex items-center gap-1 text-[0.65rem] font-medium tracking-wide transition-colors",
            met
              ? "text-emerald-600"
              : "text-slate-400",
          ].join(" ")}
        >
          <span
            className={[
              "inline-flex h-3.5 w-3.5 items-center justify-center rounded-full transition-colors",
              met
                ? "bg-emerald-100"
                : "bg-slate-100",
            ].join(" ")}
          >
            {met && (
              <Check
                size={8}
                strokeWidth={3}
                className="text-emerald-600"
              />
            )}
          </span>

          {label}
        </span>
      ))}
    </div>
  );
}

export default function Signup() {
  const navigate = useNavigate();

  const [fields, setFields] = useState<Fields>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Errors>({});
  const [agreedToTerms, setAgreedToTerms] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [submitError, setSubmitError] =
    useState("");

  function updateField(field: keyof Fields) {
    return (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      setFields((prev) => ({
        ...prev,
        [field]: value,
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

    if (
      !fields.fullName.trim() ||
      fields.fullName.trim().length < 2
    ) {
      errs.fullName =
        "Name must be at least 2 characters";
    }

    if (
      !fields.email ||
      !isValidEmail(fields.email)
    ) {
      errs.email =
        "Enter a valid email address";
    }

    if (
      !fields.password ||
      fields.password.length < 8
    ) {
      errs.password =
        "Password must be at least 8 characters";
    }

    if (
      !fields.confirmPassword ||
      fields.confirmPassword !== fields.password
    ) {
      errs.confirmPassword =
        "Passwords do not match";
    }

    if (!agreedToTerms) {
      errs.terms =
        "You must accept the Terms & Conditions to continue";
    }

    return errs;
  }

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const result = await signupUser({
        fullName: fields.fullName.trim(),
        email: fields.email.trim(),
        password: fields.password,
      });

      if (result.success) {
        navigate("/app/dashboard");
      } else {
        setSubmitError(
          result.message ??
            "Sign up failed. Please try again."
        );
      }
    } catch {
      setSubmitError(
        "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const isFormFilled =
    fields.fullName.trim().length > 0 &&
    fields.email.trim().length > 0 &&
    fields.password.length > 0 &&
    fields.confirmPassword.length > 0 &&
    agreedToTerms;

  const canSubmit =
    !isSubmitting && isFormFilled;

  return (
    <div className="flex min-h-screen overflow-hidden">
      {/* LEFT PHOTO PANEL */}
      <aside className="relative hidden h-screen w-[52%] flex-col overflow-hidden bg-slate-900 lg:flex">
        <img
          src={PHOTO_URL}
          alt="Beautiful travel destination"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1520]/50 via-[#0a1520]/35 to-[#0a1520]/90" />

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
              Begin your journey
            </p>

            <h2
              className="mb-5 leading-[1.05] text-white"
              style={{
                ...PLAYFAIR,
                fontSize:
                  "clamp(2.6rem, 3.8vw, 3.8rem)",
                fontStyle: "italic",
                fontWeight: 400,
                letterSpacing: "-0.01em",
              }}
            >
              Plan your journey.
            </h2>

            <p className="max-w-xs text-[1.05rem] font-light leading-relaxed text-white/65">
              Create unforgettable experiences —
              one carefully planned adventure at a
              time.
            </p>
          </div>

          {/* Features */}
          <div className="mb-0 flex flex-col gap-2.5">
            {[
              "Smart itinerary builder",
              "Real-time flight & hotel search",
              "Collaborate with travel companions",
            ].map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-3"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/30">
                  <Check
                    size={10}
                    strokeWidth={2.5}
                    className="text-white/70"
                  />
                </span>

                <span className="text-sm font-light text-white/60">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* RIGHT FORM PANEL */}
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
              Create your account
            </h1>

            <p className="text-sm font-light leading-relaxed text-slate-500">
              Start planning your next adventure.
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

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-4"
          >
            <FormInput
              label="Full Name"
              icon={<User size={15} />}
              type="text"
              placeholder="Enter your full name"
              value={fields.fullName}
              onChange={updateField("fullName")}
              error={errors.fullName}
              autoComplete="name"
              required
            />

            <FormInput
              label="Email address"
              icon={<Mail size={15} />}
              type="email"
              placeholder="Enter your email"
              value={fields.email}
              onChange={updateField("email")}
              error={errors.email}
              autoComplete="email"
              required
            />

            {/* Password */}
            <div>
              <FormInput
                label="Password"
                icon={<Lock size={15} />}
                isPassword
                placeholder="Create a password"
                value={fields.password}
                onChange={updateField("password")}
                error={errors.password}
                autoComplete="new-password"
                required
              />

              <PasswordStrength
                password={fields.password}
              />
            </div>

            {/* Confirm Password */}
            <FormInput
              label="Confirm Password"
              icon={<Lock size={15} />}
              isPassword
              placeholder="Confirm your password"
              value={fields.confirmPassword}
              onChange={updateField(
                "confirmPassword"
              )}
              error={errors.confirmPassword}
              autoComplete="new-password"
              required
            />

            {/* Terms */}
            <div className="pt-1">
              <label className="flex cursor-pointer select-none items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => {
                    setAgreedToTerms(
                      e.target.checked
                    );

                    if (e.target.checked) {
                      setErrors((prev) => ({
                        ...prev,
                        terms: undefined,
                      }));
                    }
                  }}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded accent-[#1b4f72]"
                />

                <span className="text-sm font-light leading-snug text-slate-500">
                  I agree to the{" "}
                  <button
                    type="button"
                    className="font-medium text-[#1b4f72] transition-colors hover:text-[#154060]"
                  >
                    Terms & Conditions
                  </button>{" "}
                  and{" "}
                  <button
                    type="button"
                    className="font-medium text-[#1b4f72] transition-colors hover:text-[#154060]"
                  >
                    Privacy Policy
                  </button>
                </span>
              </label>

              {errors.terms && (
                <p
                  className="ml-7 mt-1.5 text-xs leading-tight text-red-500"
                  role="alert"
                >
                  {errors.terms}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className={[
                "mt-2 flex w-full items-center justify-center gap-2 rounded-lg py-3.5 text-sm font-semibold tracking-wide text-white",
                "transition-all duration-200",
                canSubmit
                  ? "cursor-pointer bg-[#1b4f72] shadow-sm hover:bg-[#154060] hover:shadow-md active:scale-[0.99]"
                  : "cursor-not-allowed bg-[#1b4f72]/40",
              ].join(" ")}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner />
                  <span>Creating account...</span>
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Login */}
          <p className="mt-7 text-center text-sm font-light text-slate-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-[#1b4f72] transition-colors hover:text-[#154060]"
            >
              Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
