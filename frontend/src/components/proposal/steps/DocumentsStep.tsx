import { CheckCircle2, Circle, FileCheck2, Upload, XCircle } from 'lucide-react'

import { getDocumentRequirements } from '../../../data/proposal'
import type {
  ProposalDocumentKey,
  ProposalFormData,
  ProposalFormErrors,
} from '../../../types/proposal'
import { cn } from '../../../utils/cn'
import { ProposalSectionHeading } from '../ProposalSectionHeading'

interface DocumentsStepProps {
  data: ProposalFormData
  errors: ProposalFormErrors
  onDocumentChange: (documentKey: ProposalDocumentKey, file: File | null) => void
}

export function DocumentsStep({
  data,
  errors,
  onDocumentChange,
}: DocumentsStepProps) {
  const requirements = getDocumentRequirements(data.proposalType).filter(
    (requirement) => requirement.required,
  )
  const uploadedCount = requirements.filter(
    (requirement) => data.documents[requirement.key],
  ).length
  const remainingCount = requirements.length - uploadedCount
  const progress = requirements.length
    ? Math.round((uploadedCount / requirements.length) * 100)
    : 0
  const isGia = data.proposalType === 'GIA'

  return (
    <div className="space-y-6">
      <ProposalSectionHeading
        description="Upload clear and complete copies of each required document."
        divided={false}
        title="Upload Supporting Documents"
      />

      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 sm:flex-row sm:gap-8">
        <p>
          <span className="font-bold text-slate-800">Accepted Formats:</span>{' '}
          PDF, DOCX, XLSX, JPG, PNG
        </p>
        <p>
          <span className="font-bold text-slate-800">Maximum Size:</span> 10 MB
          per file
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        <FileCheck2 className="mt-0.5 size-5 shrink-0 text-amber-700" />
        <p>
          The required documents below are based on the selected DOST program.
          Please upload all required files before submitting your proposal.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-sm font-black text-[#073b82]">
              Required Documents
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {data.proposalType
                ? `${requirements.length} documents required for ${data.proposalType}`
                : 'Select a program in Step 2 to view its requirements.'}
            </p>
          </div>

          <div className="flex items-center gap-5 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <CheckCircle2 className="size-4" />
              {uploadedCount} Uploaded
            </span>
            <span className="flex items-center gap-1.5 text-slate-500">
              <Circle className="size-4" />
              {remainingCount} Remaining
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div
            aria-label={`${progress}% of required documents uploaded`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={progress}
            className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200"
            role="progressbar"
          >
            <div
              className="h-full rounded-full bg-emerald-600 transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="w-10 text-right text-xs font-black text-slate-700">
            {progress}%
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white xl:block">
          <table className="w-full table-fixed text-left text-sm">
            <thead className="bg-[#f8fbff] text-xs font-black uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-[24%] px-4 py-3">Requirement</th>
                <th className="w-[14%] px-4 py-3">Applies To</th>
                <th className="w-[14%] px-4 py-3">Status</th>
                <th className="w-[20%] px-4 py-3">Uploaded File</th>
                <th className="w-[18%] px-4 py-3">DOST Remarks</th>
                <th className="w-[10%] px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requirements.map((requirement) => {
                const file = data.documents[requirement.key]
                const error = errors[`documents.${requirement.key}`]
                const status = file ? 'Uploaded' : 'Missing'

                return (
                  <tr key={requirement.key}>
                    <td className="px-4 py-4 align-top">
                      <p className="font-bold text-slate-900">{requirement.label}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {requirement.description}
                      </p>
                    </td>
                    <td className="px-4 py-4 align-top font-semibold text-slate-700">
                      {isGia ? 'GIA' : 'SETUP'}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span
                        className={cn(
                          'inline-flex rounded-lg px-2.5 py-1 text-xs font-black',
                          file
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-800',
                        )}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span className="break-words text-xs font-semibold text-slate-600">
                        {file?.name ?? 'No file uploaded'}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p className="text-xs leading-5 text-slate-500">
                        {error ?? (file ? 'Ready for DOST review after submission.' : 'Upload required document.')}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-right align-top">
                      <label className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border border-blue-200 text-[#0f53b7] transition hover:bg-blue-50" title={file ? 'Replace file' : 'Upload file'}>
                        <Upload className="size-4" />
                        <input
                          accept={requirement.accept}
                          className="sr-only"
                          onChange={(event) =>
                            onDocumentChange(
                              requirement.key,
                              event.target.files?.[0] ?? null,
                            )
                          }
                          type="file"
                        />
                      </label>
                      {file ? (
                        <button
                          aria-label={`Remove ${requirement.label}`}
                          className="ml-1 inline-flex size-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                          onClick={() => onDocumentChange(requirement.key, null)}
                          type="button"
                        >
                          <XCircle className="size-4" />
                        </button>
                      ) : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 xl:hidden">
          {requirements.map((requirement) => {
            const file = data.documents[requirement.key]
            const error = errors[`documents.${requirement.key}`]

            return (
              <article
                className="rounded-xl border border-slate-200 bg-white p-4"
                key={requirement.key}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">{requirement.label}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {requirement.description}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-lg px-2.5 py-1 text-xs font-black',
                      file
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-800',
                    )}
                  >
                    {file ? 'Uploaded' : 'Missing'}
                  </span>
                </div>
                <dl className="mt-4 grid gap-3 text-sm">
                  <div>
                    <dt className="text-xs font-black uppercase text-slate-400">
                      Applies To
                    </dt>
                    <dd className="mt-1 font-semibold text-slate-700">
                      {isGia ? 'GIA' : 'SETUP'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-black uppercase text-slate-400">
                      Uploaded File
                    </dt>
                    <dd className="mt-1 break-words font-semibold text-slate-700">
                      {file?.name ?? 'No file uploaded'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-black uppercase text-slate-400">
                      DOST Remarks
                    </dt>
                    <dd className="mt-1 text-slate-600">
                      {error ?? (file ? 'Ready for DOST review after submission.' : 'Upload required document.')}
                    </dd>
                  </div>
                </dl>
                <div className="mt-4 flex gap-2">
                  <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-[#0f53b7] px-3 text-sm font-bold text-white">
                    <Upload className="size-4" />
                    {file ? 'Replace' : 'Upload'}
                    <input
                      accept={requirement.accept}
                      className="sr-only"
                      onChange={(event) =>
                        onDocumentChange(
                          requirement.key,
                          event.target.files?.[0] ?? null,
                        )
                      }
                      type="file"
                    />
                  </label>
                  {file ? (
                    <button
                      className="inline-flex h-10 items-center rounded-lg border border-slate-300 px-3 text-sm font-bold text-slate-700"
                      onClick={() => onDocumentChange(requirement.key, null)}
                      type="button"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
