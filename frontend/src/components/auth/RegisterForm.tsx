import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { AuthError, registerWithBackend } from "../../services/authService";
import { DostBrand } from "./DostBrand";
import { grantProgramAccess } from "../../lib/programAccess";
import { setMockUser } from "../../lib/mockAuth";
import type { ApplicationProgram } from "../../types/application";

const roleOptions = [
  {
    description:
      "For SETUP proposals from MSMEs or enterprises requesting technology upgrading support.",
    label: " SETUP Proponent",
    value: "MSME_PROPONENT",
  },
  {
    description:
      "For GIA proposals led by project leaders, organizations, schools, or community groups.",
    label: "GIA Project Leader",
    value: "GIA_PROJECT_LEADER",
  },
] as const;

type RegisterRole = (typeof roleOptions)[number]["value"];

const defaultRole: RegisterRole = "MSME_PROPONENT";

const roleDescriptions: Record<RegisterRole, string> = {
  GIA_PROJECT_LEADER:
    "GIA accounts are for project leaders submitting public benefit, research, training, or community-based proposals.",
  MSME_PROPONENT:
    "MSME accounts are for SETUP proponents submitting enterprise upgrading and technology assistance proposals.",
};

const roleLabels: Record<RegisterRole, string> = {
  GIA_PROJECT_LEADER: "GIA Project Leader",
  MSME_PROPONENT: "MSME / SETUP Proponent",
};

const roleValueSet = new Set<RegisterRole>([
  "MSME_PROPONENT",
  "GIA_PROJECT_LEADER",
]);

function isRegisterRole(value: string): value is RegisterRole {
  return roleValueSet.has(value as RegisterRole);
}

function getSelectedProgram(value: string | null): ApplicationProgram | null {
  const program = value?.toUpperCase();

  if (program === "GIA" || program === "SETUP") return program;

  return null;
}

function getSafeRedirect(value: string | null, program: ApplicationProgram | null) {
  if (!value || !program) return null;

  const expectedPath = `/programs/${program.toLowerCase()}`;
  const expectedTarget =
    program === "SETUP" ? `${expectedPath}/register` : expectedPath;

  return value === expectedPath || value === expectedTarget ? value : expectedTarget;
}

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "PR";
}

export function RegisterForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedProgram = getSelectedProgram(searchParams.get("program"));
  const redirectTo = getSafeRedirect(searchParams.get("redirect"), selectedProgram);
  const initialRole: RegisterRole =
    selectedProgram === "GIA" ? "GIA_PROJECT_LEADER" : defaultRole;
  const [form, setForm] = useState({
    confirmPassword: "",
    email: "",
    fullName: "",
    password: "",
    role: initialRole,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (form.password !== form.confirmPassword) {
      setMessage("Password and confirm password must match.");
      return;
    }

    setIsSubmitting(true);

    try {
      await registerWithBackend({
        email: form.email,
        name: form.fullName,
        password: form.password,
        password_confirmation: form.confirmPassword,
        role: form.role,
      });

      if (selectedProgram && redirectTo) {
        grantProgramAccess(selectedProgram);
        setMockUser({
          email: form.email.trim().toLowerCase(),
          initials: getInitials(form.fullName),
          name: form.fullName.trim(),
          program: selectedProgram,
          role: "proponent",
        });
        navigate(redirectTo, { replace: true });
        return;
      }

      setSubmitted(true);
    } catch (error) {
      setMessage(
        error instanceof AuthError
          ? error.message
          : "Unable to connect to the registration server.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage(null);
  }

  return (
    <section className="flex min-h-screen items-center justify-center bg-white px-5 py-8 sm:px-10 lg:px-12">
      <div className="w-full max-w-xl">
        <div className="mb-8 flex items-center justify-between lg:hidden">
          <DostBrand />
          <Link
            aria-label="Back to login"
            className="inline-flex size-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-[#073b82]"
            title="Back to login"
            to="/login"
          >
            <ArrowLeft className="size-5" />
          </Link>
        </div>

        <header>
          <p className="text-sm font-black uppercase tracking-wide text-[#0f53b7]">
            Proponent Registration
          </p>
          <h2 className="mt-2 text-3xl font-black text-[#073b82] sm:text-4xl">
            Create your portal account
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Register as a proponent to prepare GIA or SETUP proposals and track
            official review updates.
          </p>
        </header>

        {submitted ? (
          <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-6">
            <CheckCircle2 className="size-10 text-emerald-700" />
            <h3 className="mt-4 text-xl font-black text-slate-900">
              Registration form captured
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Your account was submitted successfully. You may now sign in with
              the registered email address and password.
            </p>
            <Link
              className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-[#0f53b7] px-4 text-sm font-black text-white"
              to="/login"
            >
              Return to login
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-5" noValidate onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                autoComplete="name"
                label="Full name"
                onChange={(value) => updateField("fullName", value)}
                placeholder="Juan Dela Cruz"
                required
                value={form.fullName}
              />
              <Field
                autoComplete="email"
                label="Email address"
                onChange={(value) => updateField("email", value)}
                placeholder="you@example.com"
                required
                type="email"
                value={form.email}
              />
            </div>

            <label className="block">
              <span className="text-sm font-bold text-slate-800">
                Account role <span className="text-red-600">*</span>
              </span>
              <select
                className="mt-2 h-12 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition disabled:bg-slate-100 disabled:text-slate-500 focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100"
                disabled={Boolean(selectedProgram)}
                onChange={(event) => {
                  const nextRole = event.target.value;

                  if (isRegisterRole(nextRole)) {
                    updateField("role", nextRole);
                  }
                }}
                value={form.role}
              >
                {roleOptions.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {roleDescriptions[form.role]}
              </p>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                autoComplete="new-password"
                label="Password"
                onChange={(value) => updateField("password", value)}
                placeholder="Minimum 8 characters"
                required
                type="password"
                value={form.password}
              />
              <Field
                autoComplete="new-password"
                label="Confirm password"
                onChange={(value) => updateField("confirmPassword", value)}
                placeholder="Re-enter password"
                required
                type="password"
                value={form.confirmPassword}
              />
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
              <input
                className="mt-1 size-4 rounded accent-[#0f53b7]"
                required
                type="checkbox"
              />
              <span>
                I confirm that this account will be registered as{" "}
                <span className="font-bold text-slate-800">
                  {roleLabels[form.role]}
                </span>{" "}
                for DOST GIA / SETUP proposal processing.
              </span>
            </label>

            {message ? (
              <p
                className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm font-semibold text-amber-900"
                role="status"
              >
                {message}
              </p>
            ) : null}

            <button
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#0f53b7] px-5 text-sm font-black text-white shadow-lg shadow-blue-900/15 transition hover:bg-[#0b3f8b]"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Creating account..." : "Create account"}
              <ArrowRight className="size-4" />
            </button>

            <p className="text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link
                className="font-black text-[#0f53b7] hover:underline"
                to="/login"
              >
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </section>
  );
}

function Field({
  autoComplete,
  label,
  onChange,
  placeholder,
  required = false,
  type = "text",
  value,
}: {
  autoComplete?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-800">
        {label}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </span>
      <input
        autoComplete={autoComplete}
        className="mt-2 h-12 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        type={type}
        value={value}
      />
    </label>
  );
}
