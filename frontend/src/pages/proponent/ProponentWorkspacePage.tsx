import { CheckCircle2, Clock3, FilePenLine, Send } from "lucide-react";
import { Link } from "react-router-dom";

import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminPanel } from "../../components/admin/AdminPanel";
import { StatusPill } from "../../components/admin/StatusPill";

const checklist = [
  "Business profile and enterprise registration",
  "Itemized budget proposal and quotations",
  "Updated production, sales, and employment figures",
  "Latest accomplishment or sustainability report",
];

const timeline = [
  {
    icon: FilePenLine,
    title: "Draft your submission",
    description: "Prepare the proposal package and validate supporting files before final upload.",
  },
  {
    icon: Send,
    title: "Submit to DOST",
    description: "Send the completed proposal and wait for document screening feedback.",
  },
  {
    icon: Clock3,
    title: "Respond to comments",
    description: "Track notifications, upload revisions, and confirm compliance requirements.",
  },
  {
    icon: CheckCircle2,
    title: "Monitor approval",
    description: "Review endorsements, budget comments, and final approval results.",
  },
];

export function ProponentWorkspacePage() {
  return (
    <div className="space-y-7">
      <AdminPageHeader
        action={
          <Link
            className="inline-flex h-11 items-center rounded-xl bg-[#0f53b7] px-4 text-sm font-bold text-white transition hover:bg-[#0b3f8b]"
            to="/programs/setup"
          >
            Start new proposal
          </Link>
        }
        description="Prepare submissions, complete requirements, and respond to review comments."
        eyebrow="Proposal Workspace"
        title="Submission center"
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <AdminPanel title="Submission checklist">
          <div className="space-y-3 p-5">
            {checklist.map((item) => (
              <div
                className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
                key={item}
              >
                <CheckCircle2 className="mt-0.5 size-4 text-[#0f53b7]" />
                <p className="text-sm text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel title="Workflow">
          <div className="space-y-3 p-5">
            {timeline.map((step) => (
              <article
                className="rounded-2xl border border-slate-200 bg-[#f8fbff] p-4"
                key={step.title}
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-2xl bg-blue-50 text-[#0f53b7]">
                    <step.icon className="size-4" />
                  </span>
                  <div>
                    <p className="font-bold text-slate-900">{step.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {step.description}
                    </p>
                  </div>
                </div>
              </article>
            ))}
            <StatusPill tone="info">Notifications stay available in the header while signed in.</StatusPill>
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}
