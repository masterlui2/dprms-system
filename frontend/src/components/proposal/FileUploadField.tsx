import { useRef, useState } from 'react'
import { CheckCircle2, FileText, Trash2, Upload } from 'lucide-react'

import type { DocumentRequirement } from '../../data/proposal'
import { cn } from '../../utils/cn'

const maximumFileSize = 10 * 1024 * 1024

interface FileUploadFieldProps {
  error?: string
  file: File | null
  onChange: (file: File | null) => void
  requirement: DocumentRequirement
}

export function FileUploadField({
  error,
  file,
  onChange,
  requirement,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const errorMessage = fileError ?? error
  const inputId = `document-${requirement.key}`

  function selectFile(selectedFile?: File) {
    if (!selectedFile) return

    if (selectedFile.size > maximumFileSize) {
      setFileError('This file is larger than the 10 MB limit.')
      return
    }

    setFileError(null)
    onChange(selectedFile)
  }

  function removeFile() {
    setFileError(null)
    onChange(null)

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div
      className={cn(
        'rounded-lg border bg-white p-4 transition',
        errorMessage ? 'border-red-300' : file ? 'border-emerald-300' : 'border-slate-200',
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-lg',
            file ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-[#0f53b7]',
          )}
        >
          {file ? <CheckCircle2 className="size-5" /> : <FileText className="size-5" />}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900">
            {requirement.label}
            <span aria-label="required" className="ml-1 text-red-600">
              *
            </span>
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{requirement.description}</p>
          {file ? (
            <p className="mt-1 truncate text-xs font-semibold text-emerald-700">{file.name}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {file ? (
            <button
              aria-label={`Remove ${requirement.label}`}
              className="inline-flex size-10 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100"
              onClick={removeFile}
              title="Remove file"
              type="button"
            >
              <Trash2 className="size-4" />
            </button>
          ) : (
            <label
              className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 px-3.5 text-sm font-bold text-[#073b82] transition hover:border-[#0f53b7] hover:bg-blue-50 focus-within:ring-4 focus-within:ring-blue-100"
              htmlFor={inputId}
            >
              <Upload className="size-4" />
              Choose file
            </label>
          )}
          <input
            accept={requirement.accept}
            className="sr-only"
            id={inputId}
            onChange={(event) => selectFile(event.target.files?.[0])}
            ref={inputRef}
            type="file"
          />
        </div>
      </div>

      {errorMessage ? (
        <p className="mt-3 text-xs font-semibold text-red-600" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  )
}
