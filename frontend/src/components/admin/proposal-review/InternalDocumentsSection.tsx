import { FileCheck2, FileUp, History, Upload } from 'lucide-react'
import { useState } from 'react'

import { cn } from '../../../utils/cn'

type InternalDocument = {
  fileName?: string
  id: string
  label: string
  status: 'Not uploaded' | 'Uploaded'
  updated?: string
}

const initialDocuments: InternalDocument[] = [
  { id: 'tna', label: 'TNA', status: 'Not uploaded' },
  { id: 'inspection', label: 'Inspection Report', status: 'Not uploaded' },
  { id: 'approval-notice', label: 'Notice of Approval', status: 'Not uploaded' },
  { id: 'moa', label: 'Memorandum of Agreement', status: 'Not uploaded' },
  { id: 'closing-report', label: 'Closing Report', status: 'Not uploaded' },
]

export function InternalDocumentsSection() {
  const [documents, setDocuments] = useState(initialDocuments)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  function saveFile(id: string, file?: File) {
    if (!file) return
    setDocuments((current) => current.map((document) => document.id === id
      ? { ...document, fileName: file.name, status: 'Uploaded', updated: 'Just now' }
      : document))
  }

  const uploaded = documents.filter((document) => document.status === 'Uploaded')

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-4 text-sm leading-6 text-[#073b82]">
        <p className="font-black">Internal project documents</p>
        <p className="mt-1 text-slate-600">Upload and track staff-only records without leaving the application workspace.</p>
      </section>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {documents.map((document) => (
          <label
            className={cn(
              'group flex min-h-44 cursor-pointer flex-col rounded-xl border-2 border-dashed bg-white p-4 transition',
              draggingId === document.id ? 'border-[#0f53b7] bg-blue-50' : document.status === 'Uploaded' ? 'border-emerald-200 hover:border-emerald-300' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/40',
            )}
            key={document.id}
            onDragEnter={() => setDraggingId(document.id)}
            onDragLeave={() => setDraggingId(null)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              setDraggingId(null)
              saveFile(document.id, event.dataTransfer.files[0])
            }}
          >
            <input className="sr-only" onChange={(event) => saveFile(document.id, event.target.files?.[0])} type="file" />
            <div className="flex items-start justify-between gap-3">
              <span className={cn('grid size-10 place-items-center rounded-xl', document.status === 'Uploaded' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                {document.status === 'Uploaded' ? <FileCheck2 className="size-5" /> : <FileUp className="size-5" />}
              </span>
              <span className={cn('rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-wide', document.status === 'Uploaded' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                {document.status}
              </span>
            </div>
            <p className="mt-4 font-black text-slate-900">{document.label}</p>
            {document.fileName ? <p className="mt-1 truncate text-xs font-semibold text-slate-500">{document.fileName}</p> : <p className="mt-1 text-xs leading-5 text-slate-500">Drop a file here or select one from your device.</p>}
            <span className="mt-auto inline-flex items-center gap-2 pt-4 text-xs font-bold text-[#0f53b7]"><Upload className="size-3.5" />{document.status === 'Uploaded' ? 'Replace document' : 'Upload document'}</span>
          </label>
        ))}
      </div>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3"><History className="size-4 text-[#0f53b7]" /><h3 className="font-black text-[#073b82]">Upload history</h3></div>
        {uploaded.length ? <div className="divide-y divide-slate-100">{uploaded.map((document) => <div className="flex items-center justify-between gap-4 px-4 py-3" key={document.id}><div className="min-w-0"><p className="font-bold text-slate-900">{document.label}</p><p className="mt-0.5 truncate text-xs text-slate-500">{document.fileName}</p></div><span className="whitespace-nowrap text-xs font-semibold text-slate-400">{document.updated}</span></div>)}</div> : <p className="px-4 py-8 text-center text-sm text-slate-500">No internal documents have been uploaded for this application.</p>}
      </section>
    </div>
  )
}
