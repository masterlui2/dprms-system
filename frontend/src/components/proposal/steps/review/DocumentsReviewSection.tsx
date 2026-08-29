import { Pencil } from "lucide-react";

import { getVisibleDocumentRequirements } from "../../../../data/proposal";
import type { ProposalFormData } from "../../../../types/proposal";

interface DocumentsReviewSectionProps {
  data: ProposalFormData;
  onEdit: () => void;
}

export function DocumentsReviewSection({
  data,
  onEdit,
}: DocumentsReviewSectionProps) {
  const requirements = getVisibleDocumentRequirements(data);
  const uploadedCount = requirements.filter(
    (requirement) => data.documents[requirement.key],
  ).length;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-black text-[#073b82]">
            Uploaded Documents
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {uploadedCount} of {requirements.length} required documents
            uploaded.
          </p>
        </div>
        <button
          className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-[#073b82] transition hover:border-[#0f53b7] hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
          onClick={onEdit}
          type="button"
        >
          <Pencil className="size-4" />
          Edit
        </button>
      </div>
      <div className="mt-5 space-y-3">
        {requirements.map((requirement) => {
          const file = data.documents[requirement.key];

          return (
            <div
              className="flex flex-col gap-3 rounded-lg border border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              key={requirement.key}
            >
              <div className="min-w-0">
                <p className="font-bold text-slate-900">{requirement.label}</p>
                <p className="mt-1 break-words text-sm text-slate-600">
                  {file?.name ?? "No file uploaded"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
