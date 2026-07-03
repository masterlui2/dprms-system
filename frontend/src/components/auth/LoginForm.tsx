import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { ADMIN_USER, isValidAdminLogin, setMockUser } from "../../lib/mockAuth";
import { DostBrand } from "./DostBrand";

export function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setMessage("Please enter your registered email address and password.");
      return;
    }

    if (!isValidAdminLogin(email, password)) {
      setMessage("Invalid email address or password.");
      return;
    }

    setMessage(null);
    setMockUser(ADMIN_USER);
    navigate("/dashboard");
  }

  return (
    <section className="flex min-h-screen items-center justify-center bg-white px-5 py-8 sm:px-10 lg:px-12">
      <div className="w-full max-w-md">
        <div className="mb-10 flex items-center justify-between lg:hidden">
          <DostBrand />
          <Link
            aria-label="Back to home"
            className="inline-flex size-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-[#073b82] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
            title="Back to home"
            to="/"
          >
            <ArrowLeft className="size-5" />
          </Link>
        </div>

        <header>
          <h2 className="text-3xl font-black text-[#073b82] sm:text-4xl">
            Welcome back
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Sign in to continue to the DOST admin workspace.
          </p>
        </header>

        <form className="mt-8 space-y-5" noValidate onSubmit={handleSubmit}>
          <div>
            <label
              className="text-sm font-bold text-slate-800"
              htmlFor="login-email"
            >
              Email address
            </label>
            <input
              autoComplete="email"
              className="mt-2 h-12 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100"
              id="login-email"
              onChange={(event) => {
                setEmail(event.target.value);
                setMessage(null);
              }}
              placeholder="you@example.com"
              type="email"
              value={email}
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-4">
              <label
                className="text-sm font-bold text-slate-800"
                htmlFor="login-password"
              >
                Password
              </label>
              <button
                className="text-xs font-bold text-[#0f53b7] hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                onClick={() =>
                  setMessage(
                    "Please contact your DOST office to recover your account.",
                  )
                }
                type="button"
              >
                Forgot password?
              </button>
            </div>

            <div className="relative mt-2">
              <input
                autoComplete="current-password"
                className="h-12 w-full rounded-lg border border-slate-300 bg-white px-3.5 pr-12 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100"
                id="login-password"
                onChange={(event) => {
                  setPassword(event.target.value);
                  setMessage(null);
                }}
                placeholder="Enter your password"
                type={showPassword ? "text" : "password"}
                value={password}
              />
              <button
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                onClick={() => setShowPassword((current) => !current)}
                title={showPassword ? "Hide password" : "Show password"}
                type="button"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          {message ? (
            <p
              className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm font-semibold text-amber-900"
              role="status"
            >
              {message}
            </p>
          ) : null}

          <label
            className="flex w-fit cursor-pointer items-center gap-2 text-sm text-slate-600"
            htmlFor="keep-signed-in"
          >
            <input
              checked={keepSignedIn}
              className="size-4 rounded accent-[#0f53b7]"
              id="keep-signed-in"
              onChange={(event) => setKeepSignedIn(event.target.checked)}
              type="checkbox"
            />
            Keep me signed in
          </label>

          <button
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#0f53b7] px-5 text-sm font-black text-white shadow-lg shadow-blue-900/15 transition hover:bg-[#0b3f8b] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
            type="submit"
          >
            Sign in
            <ArrowRight className="size-4" />
          </button>
        </form>
      </div>
    </section>
  );
}
