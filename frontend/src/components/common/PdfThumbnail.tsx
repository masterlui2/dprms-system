import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { FileText, Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'
import { viewDocumentBlobForStaff } from '../../services/documentStore'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

const dataUrlCache = new Map<string, string>()
const documentBlobUrlCache = new Map<number, string>()
const documentBlobRequests = new Map<number, Promise<string>>()

async function getDocumentBlobUrl(documentId: number): Promise<string> {
  const cached = documentBlobUrlCache.get(documentId)
  if (cached) return cached

  const pending = documentBlobRequests.get(documentId)
  if (pending) return pending

  const request = viewDocumentBlobForStaff(documentId)
    .then((blobUrl) => {
      documentBlobUrlCache.set(documentId, blobUrl)
      return blobUrl
    })
    .finally(() => {
      documentBlobRequests.delete(documentId)
    })

  documentBlobRequests.set(documentId, request)
  return request
}

interface PdfThumbnailProps {
  url?: string | null
  documentId?: number | null
  className?: string
  alt?: string
  title?: string
}

export function PdfThumbnail({
  url,
  documentId,
  className,
  alt = 'PDF Preview',
  title,
}: PdfThumbnailProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const cacheKey = documentId ? `doc_${documentId}` : url || null
  const [cachedDataUrl, setCachedDataUrl] = useState<string | null>(() =>
    cacheKey ? dataUrlCache.get(cacheKey) || null : null
  )
  const [isVisible, setIsVisible] = useState(Boolean(cachedDataUrl))
  const [loading, setLoading] = useState(false)
  const [, setHasError] = useState<boolean>(false)

  useEffect(() => {
    const cached = cacheKey ? dataUrlCache.get(cacheKey) : null
    setCachedDataUrl(cached || null)
    setLoading(false)
    setHasError(false)

    if (cached || (!url && !documentId)) {
      setIsVisible(Boolean(cached))
      return
    }

    const element = containerRef.current
    if (!element || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true)
      return
    }

    setIsVisible(false)
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '240px 0px' },
    )
    observer.observe(element)

    return () => observer.disconnect()
  }, [cacheKey, documentId, url])

  useEffect(() => {
    if (cacheKey && dataUrlCache.has(cacheKey)) {
      setCachedDataUrl(dataUrlCache.get(cacheKey)!)
      setLoading(false)
      setHasError(false)
      return
    }

    if (!url && !documentId) {
      setLoading(false)
      return
    }

    if (!isVisible) return

    let isCancelled = false
    setLoading(true)
    setHasError(false)

    async function renderPage() {
      let activeUrl = url
      let createdBlobUrl: string | null = null

      try {
        if (!activeUrl && documentId) {
          createdBlobUrl = await getDocumentBlobUrl(documentId)
          activeUrl = createdBlobUrl
        }

        if (!activeUrl) throw new Error('No PDF URL available')

        let pdf: pdfjsLib.PDFDocumentProxy | null = null

        try {
          const loadingTask = pdfjsLib.getDocument({ url: activeUrl })
          pdf = await loadingTask.promise
        } catch {
          if (documentId && activeUrl !== createdBlobUrl) {
            createdBlobUrl = await getDocumentBlobUrl(documentId)
            activeUrl = createdBlobUrl
            const retryTask = pdfjsLib.getDocument({ url: activeUrl })
            pdf = await retryTask.promise
          } else {
            throw new Error('Could not open PDF file')
          }
        }

        if (isCancelled || !pdf) return

        const page = await pdf.getPage(1)
        if (isCancelled) return

        const viewport = page.getViewport({ scale: 0.6 })
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        if (!context) throw new Error('No 2d context')

        canvas.height = viewport.height
        canvas.width = viewport.width

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        }

        await page.render(renderContext).promise
        if (isCancelled) return

        const dataUrl = canvas.toDataURL('image/webp', 0.85)
        if (cacheKey) {
          dataUrlCache.set(cacheKey, dataUrl)
        }
        if (url) {
          dataUrlCache.set(url, dataUrl)
        }
        setCachedDataUrl(dataUrl)
        setLoading(false)
      } catch {
        if (!isCancelled) {
          setHasError(true)
          setLoading(false)
        }
      }
    }

    renderPage()

    return () => {
      isCancelled = true
    }
  }, [url, documentId, cacheKey, isVisible])

  if (cachedDataUrl) {
    return (
      <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-white flex items-start justify-center">
        <img
          src={cachedDataUrl}
          alt={alt}
          className={cn('h-full w-full object-cover object-top select-none bg-white', className)}
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div ref={containerRef} className={cn('flex h-full w-full flex-col items-center justify-center bg-white p-2 text-slate-400 select-none', className)}>
        <Loader2 className="size-4 animate-spin text-[#0f53b7]" />
        <span className="mt-1 text-[10px] font-medium text-slate-500">Loading preview...</span>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={cn('relative flex h-full w-full flex-col justify-between overflow-hidden bg-white p-2.5 shadow-2xs select-none', className)}>
      <div className="flex items-center justify-between gap-1 border-b border-slate-100 pb-1.5">
        <span className="inline-flex items-center gap-0.5 rounded bg-blue-50 px-1 py-0.2 text-[8px] font-black uppercase text-[#0f53b7]">
          <FileText className="size-2.5" />
          <span>PDF</span>
        </span>
        <span className="text-[8px] font-medium text-slate-400 font-mono">Page 1</span>
      </div>
      <div className="my-1 space-y-1 opacity-70">
        <div className="h-1.5 w-3/4 rounded-full bg-slate-300" />
        <div className="h-1 w-full rounded-full bg-slate-200" />
        <div className="h-1 w-5/6 rounded-full bg-slate-200" />
        <div className="h-1 w-2/3 rounded-full bg-slate-200" />
        <div className="h-1 w-4/5 rounded-full bg-slate-200" />
      </div>
      <p className="truncate text-[9px] font-bold text-slate-700 text-center" title={title}>
        {title || 'Document'}
      </p>
    </div>
  )
}
