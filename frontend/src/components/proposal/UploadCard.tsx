import { useRef, useState } from 'react'
import {
  Check,
  CheckCircle2,
  Eye,
  FileText,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react'

import type { DocumentRequirement } from '../../data/proposal'
import { cn } from '../../utils/cn'

const maximumFileSize = 10 * 1024 * 1024

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface UploadCardProps {
  error?: string
  file: File | null
  onChange: (file: File | null) => void
  requirement: DocumentRequirement
}

export function UploadCard({
  error,
  file,
  onChange,
  requirement,
}: UploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const errorMessage = fileError ?? error
  const inputId = `document-${requirement.key}`

  function selectFile(selectedFile?: File) {
    if (!selectedFile) return

    const extension = `.${selectedFile.name.split('.').pop()?.toLowerCase()}`
    const acceptedExtensions = requirement.accept
      .split(',')
      .map((accepted) => accepted.trim().toLowerCase())

    if (!acceptedExtensions.includes(extension)) {
      setFileError(
        'This file type is not supported. Choose a PDF, DOCX, XLSX, JPG, or PNG file.',
      )
      return
    }

    if (selectedFile.size > maximumFileSize) {
      setFileError('This file exceeds the 10 MB maximum size.')
      return
    }

    setFileError(null)
    onChange(selectedFile)
  }

  function previewFile() {
    if (!file) return

    const previewUrl = URL.createObjectURL(file)
    window.open(previewUrl, '_blank', 'noopener,noreferrer')
    window.setTimeout(() => URL.revokeObjectURL(previewUrl), 60_000)
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
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
            <div className="mt-3" aria-live="polite">
              <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <Check className="size-3.5" />
                File uploaded
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                {file.name}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {formatFileSize(file.size)}
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {file ? (
            <>
              <button
                aria-label={`Preview ${requirement.label}`}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-bold text-[#073b82] transition hover:border-[#0f53b7] hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                onClick={previewFile}
                type="button"
              >
                <Eye className="size-4" />
                Preview
              </button>
              <label
                className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-bold text-[#073b82] transition hover:border-[#0f53b7] hover:bg-blue-50 focus-within:ring-4 focus-within:ring-blue-100"
                htmlFor={inputId}
              >
                <RefreshCw className="size-4" />
                Replace
              </label>
              <button
                aria-label={`Remove ${requirement.label}`}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-bold text-slate-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100"
                onClick={removeFile}
                type="button"
              >
                <Trash2 className="size-4" />
                Remove
              </button>
            </>
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
            onChange={(event) => {
              selectFile(event.target.files?.[0])
              event.currentTarget.value = ''
            }}
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
