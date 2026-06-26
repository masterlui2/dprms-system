import { Link } from 'react-router-dom'

export function Login() {
  return (
    <main className="grid min-h-screen bg-[#f6f8fb] px-4 py-8 text-slate-900 lg:grid-cols-[1fr_520px] lg:px-0 lg:py-0">
      <section className="hidden bg-[#105c4a] px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-lg bg-white text-base font-bold text-[#105c4a]">
            D
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-100">DOST</p>
            <h1 className="text-2xl font-bold">DPRMS</h1>
          </div>
        </div>

        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-100">
            Project and Resource Management
          </p>
          <h2 className="mt-4 text-5xl font-bold leading-tight">
            Monitor project delivery and resource allocation in one workspace.
          </h2>
          <p className="mt-5 text-lg text-emerald-50">
            Built for a clean capstone workflow with a Laravel API, React UI, and
            future prediction service integration.
          </p>
        </div>

        <p className="text-sm text-emerald-100">DPRMS Capstone Scaffold</p>
      </section>

      <section className="mx-auto flex w-full max-w-md flex-col justify-center lg:px-12">
        <div className="mb-8 lg:hidden">
          <div className="grid size-11 place-items-center rounded-lg bg-[#105c4a] text-base font-bold text-white">
            D
          </div>
          <h1 className="mt-4 text-3xl font-bold">DPRMS</h1>
          <p className="mt-2 text-slate-600">DOST Project and Resource Management System</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-[#105c4a]">Welcome back</p>
            <h2 className="mt-2 text-2xl font-bold">Sign in to continue</h2>
            <p className="mt-2 text-sm text-slate-600">
              Authentication screens are scaffolded for UI work. Sanctum-backed
              login can be connected when auth endpoints are added.
            </p>
          </div>

          <form className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Email address</span>
              <input
                className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-[#105c4a] focus:ring-4 focus:ring-emerald-100"
                placeholder="admin@dprms.local"
                type="email"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Password</span>
              <input
                className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-[#105c4a] focus:ring-4 focus:ring-emerald-100"
                placeholder="Enter your password"
                type="password"
              />
            </label>

            <Link
              className="flex h-11 w-full items-center justify-center rounded-lg bg-[#105c4a] px-4 text-sm font-bold text-white transition hover:bg-[#0c4639]"
              to="/dashboard"
            >
              Open Dashboard
            </Link>
          </form>
        </div>
      </section>
    </main>
  )
}
