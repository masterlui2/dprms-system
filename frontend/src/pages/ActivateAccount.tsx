import { useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'

import { DostBrand } from '../components/auth/DostBrand'
import {
  activateApplicantAccount,
  isApplicationActivated,
  setMockUser,
} from '../lib/mockAuth'
import { getApplicationByReference } from '../services/applicationStore'

export function ActivateAccount() {
  const navigate = useNavigate()
  const { referenceNo = '' } = useParams()
  const application = getApplicationByReference(referenceNo)
  const [email, setEmail] = useState(application?.contactEmail ?? '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  if (!referenceNo || !application) {
    return <Navigate replace to="/login" />
  }

  const activeApplication = application
  const activated = isApplicationActivated(referenceNo)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)

    if (password.length < 8) {
      setMessage('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setMessage('Password and confirm password must match.')
      return
    }

    const user = activateApplicantAccount({
      application: activeApplication,
      email,
      password,
    })

    setMockUser(user)
    navigate('/dashboard')
  }

  return (
    <section className="min-h-screen bg-[#f4f8fc] px-5 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <DostBrand />
          <Link
            aria-label="Back to login"
            className="inline-flex size-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-[#073b82]"
            title="Back to login"
            to="/login"
          >
            <ArrowLeft className="size-5" />
          </Link>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#d8e1ee] bg-white shadow-sm">
          <div className="border-b border-[#d8e1ee] bg-[#073b82] px-6 py-5 text-white">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-100">
              Beneficiary portal activation
            </p>
            <h1 className="mt-2 text-2xl font-black">
              Activate account for {application.referenceNo}
            </h1>
          </div>

          <div className="grid gap-6 p-6 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <aside className="rounded-lg border border-slate-200 bg-[#f8fbff] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#0f53b7]">
                Submitted proposal
              </p>
              <h2 className="mt-3 text-lg font-black text-slate-950">
                {application.projectTitle}
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="font-bold text-slate-500">Program</dt>
                  <dd className="mt-1 font-black text-[#073b82]">
                    {application.program}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-slate-500">Organization</dt>
                  <dd className="mt-1 text-slate-800">
                    {application.organizationName}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-slate-500">Status</dt>
                  <dd className="mt-1 text-slate-800">{application.status}</dd>
                </div>
              </dl>
            </aside>

            {activated ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
                <CheckCircle2 className="size-9 text-emerald-700" />
                <h2 className="mt-4 text-xl font-black text-slate-950">
                  Account already activated
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Sign in using the email and password used during activation.
                </p>
                <Link
                  className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-[#0f53b7] px-4 text-sm font-black text-white"
                  to="/login"
                >
                  Go to login
                </Link>
              </div>
            ) : (
              <form className="space-y-4" noValidate onSubmit={handleSubmit}>
                <label className="block">
                  <span className="text-sm font-bold text-slate-800">
                    Email address
                  </span>
                  <input
                    autoComplete="email"
                    className="mt-2 h-12 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm outline-none transition focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100"
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    type="email"
                    value={email}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate-800">
                    Password
                  </span>
                  <input
                    autoComplete="new-password"
                    className="mt-2 h-12 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm outline-none transition focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Minimum 8 characters"
                    required
                    type="password"
                    value={password}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate-800">
                    Confirm password
                  </span>
                  <input
                    autoComplete="new-password"
                    className="mt-2 h-12 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm outline-none transition focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100"
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    type="password"
                    value={confirmPassword}
                  />
                </label>

                {message ? (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm font-semibold text-amber-900">
                    {message}
                  </p>
                ) : null}

                <button
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#0f53b7] px-5 text-sm font-black text-white shadow-lg shadow-blue-900/15 transition hover:bg-[#0b3f8b]"
                  type="submit"
                >
                  Activate account
                  <ArrowRight className="size-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
