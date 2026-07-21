interface CertificationPanelProps {
  certified: boolean;
  error?: string;
  onCertifiedChange: (certified: boolean) => void;
}

export function CertificationPanel({
  certified,
  error,
  onCertifiedChange,
}: CertificationPanelProps) {
  return (
    <div>
      <label
        className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 transition hover:border-[#0f53b7]"
        htmlFor="certified"
      >
        <input
          checked={certified}
          className="mt-1 size-4 shrink-0 accent-[#0f53b7]"
          id="certified"
          onChange={(event) => onCertifiedChange(event.target.checked)}
          type="checkbox"
        />
        <span className="text-sm leading-6 text-slate-600">
          I reviewed this submission and certify that the information and
          uploaded documents are true and complete.
          <span aria-hidden="true" className="ml-1 font-bold text-red-600">
            *
          </span>
        </span>
      </label>
      {error ? (
        <p className="mt-2 text-xs font-semibold text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
