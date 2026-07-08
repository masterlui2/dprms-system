import { MessageSquare, Send } from "lucide-react";

const reviewComments = [
  {
    author: "Document Validation",
    date: "Jun 24, 2026",
    note: "Core proposal files were received. Verify registration details before endorsement.",
  },
  {
    author: "Technical Review",
    date: "Jun 25, 2026",
    note: "Technical scope is generally aligned with program objectives. Supplier quotation needs cross-checking.",
  },
];

export function ProposalCommentsSection() {
  return (
    <section className="mx-auto max-w-4xl overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <h3 className="flex items-center gap-2 font-black text-[#073b82]">
          <MessageSquare className="size-4" />
          Comments
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Record validation findings, clarification requests, and decision notes.
        </p>
      </div>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
        <div className="divide-y divide-slate-100 border-b border-slate-200 lg:border-b-0 lg:border-r">
          {reviewComments.map((comment) => (
            <article className="px-5 py-4" key={`${comment.author}-${comment.date}`}>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-black text-slate-900">
                  {comment.author}
                </p>
                <span className="text-xs font-semibold text-slate-400">
                  {comment.date}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {comment.note}
              </p>
            </article>
          ))}
        </div>

        <div className="p-5">
          <label className="block">
            <span className="text-sm font-bold text-slate-800">
              Add an internal review note
            </span>
            <textarea
              className="mt-2 min-h-40 w-full resize-y rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100"
              placeholder="Document findings, clarification requests, or decision notes..."
            />
          </label>
          <button
            className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg bg-[#0f53b7] px-4 text-sm font-bold text-white hover:bg-[#0b3f8b]"
            type="button"
          >
            <Send className="size-4" />
            Save comment
          </button>
        </div>
      </div>
    </section>
  );
}
