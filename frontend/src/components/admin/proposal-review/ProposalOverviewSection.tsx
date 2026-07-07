import {
  Building2,
  CalendarClock,
  CheckCircle2,
  Eye,
  MapPin,
  ShieldCheck,
  UserRound,
  Wallet,
} from "lucide-react";

import { formatCurrency, type ProposalRecord } from "../../../data/admin";
import { getProponentDetails } from "./proponentDetails";

interface ProposalOverviewSectionProps {
  onReviewFiles: () => void;
  proposal: ProposalRecord;
}

export function ProposalOverviewSection({
  onReviewFiles,
  proposal,
}: ProposalOverviewSectionProps) {
  const proponent = getProponentDetails(proposal);

  const summaryCards = [
    {
      label: "Program",
      value: proposal.program,
      helper: "DOST assistance track",
      icon: ShieldCheck,
    },
    {
      label: "Requested budget",
      value: formatCurrency(proposal.amount),
      helper: "For review and validation",
      icon: Wallet,
    },
    {
      label: "Project location",
      value: "Davao Oriental",
      helper: "Implementation area",
      icon: MapPin,
    },
    {
      label: "Timeline",
      value: "12 months",
      helper: `Submitted ${proposal.submitted}`,
      icon: CalendarClock,
    },
  ];

  const personalDetails = [
    ["Organization", proposal.organization],
    ["Contact person", proponent.contactPerson],
    ["Designation", proponent.designation],
    ["Email address", proponent.email],
    ["Mobile number", proponent.mobile],
    ["Organization type", proponent.organizationType],
    ["Address", proponent.address],
  ];

  const objectives = [
    "Improve production efficiency and product consistency.",
    "Adopt suitable technology and strengthen staff capability.",
    "Increase market readiness and sustainable enterprise growth.",
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f53b7]">
            Review workspace
          </p>
          <h3 className="mt-1 text-xl font-black text-[#073b82]">
            Proponent and Proposal Overview
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            A consolidated view of the proponent profile, proposal summary, and
            readiness checks before final action.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <span className="grid size-11 place-items-center rounded-full bg-white text-emerald-700 shadow-sm">
            <CheckCircle2 className="size-5" />
          </span>
          <div>
            <p className="text-lg font-black text-slate-900">
              {proposal.completeness}% complete
            </p>
            <p className="text-xs font-semibold text-emerald-700">
              Ready for review
            </p>
          </div>
        </div>
      </div>

      <div className="max-h-[58vh] overflow-y-auto p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map(({ helper, icon: Icon, label, value }) => (
            <div
              className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
              key={label}
            >
              <span className="grid size-10 place-items-center rounded-xl bg-white text-[#0f53b7] shadow-sm">
                <Icon className="size-5" />
              </span>
              <p className="mt-4 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                {label}
              </p>
              <p className="mt-1 text-base font-black text-slate-900">
                {value}
              </p>
              <p className="mt-1 text-xs text-slate-500">{helper}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-[#0f53b7]">
                <UserRound className="size-5" />
              </span>
              <div>
                <h4 className="font-black text-slate-900">
                  Proponent Personal Details
                </h4>
                <p className="text-xs text-slate-500">
                  Contact and organization information
                </p>
              </div>
            </div>

            <dl className="mt-4 divide-y divide-slate-100">
              {personalDetails.map(([label, value]) => (
                <div
                  className="grid gap-1 py-3 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4"
                  key={label}
                >
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    {label}
                  </dt>
                  <dd className="text-sm font-semibold text-slate-800">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-[#0f53b7]">
                <Building2 className="size-5" />
              </span>
              <div>
                <h4 className="font-black text-slate-900">
                  Proposal Summary
                </h4>
                <p className="text-xs text-slate-500">
                  Main objective and review ownership
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-600">
              The proposal seeks DOST support to implement a practical science
              and technology intervention that improves operational capacity,
              product quality, and long-term enterprise sustainability.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Assigned reviewer
                </p>
                <p className="mt-1 text-sm font-black text-slate-900">
                  {proposal.reviewer}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Current status
                </p>
                <p className="mt-1 text-sm font-black text-slate-900">
                  {proposal.status}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <h5 className="text-sm font-black text-slate-900">
                Project objectives
              </h5>
              <ul className="mt-3 space-y-3">
                {objectives.map((objective) => (
                  <li
                    className="flex gap-3 text-sm leading-6 text-slate-600"
                    key={objective}
                  >
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-black text-[#073b82] transition hover:bg-blue-100 sm:w-auto"
              onClick={onReviewFiles}
              type="button"
            >
              <Eye className="size-4" />
              Review submitted files
            </button>
          </section>
        </div>
      </div>
    </section>
  );
}
