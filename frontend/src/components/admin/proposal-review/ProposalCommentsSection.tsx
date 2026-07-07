import { MessageSquare, Send } from "lucide-react";

export function ProposalCommentsSection() {
  return (
    <section className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="flex items-center gap-2 font-black text-[#073b82]">
        <MessageSquare className="size-4" />
        Reviewer comments
      </h3>
      <label className="mt-4 block">
        <span className="text-sm font-bold text-slate-800">
          Add an internal review note
        </span>
        <textarea
          className="mt-2 min-h-36 w-full resize-y rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100"
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
    </section>
  );
}
