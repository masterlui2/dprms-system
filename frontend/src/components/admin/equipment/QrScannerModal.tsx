import { useCallback, useEffect, useId, useRef, useState } from 'react'
import {
  AlertTriangle,
  Camera,
  CameraOff,
  CheckCircle2,
  Keyboard,
  LoaderCircle,
  RefreshCw,
  ScanLine,
} from 'lucide-react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'

import type { EquipmentRecord } from '../../../data/admin'
import {
  equipmentErrorMessage,
  resolveEquipmentQr,
} from '../../../services/equipmentStore'
import { ModalShell } from '../ModalShell'

interface CameraOption {
  id: string
  label: string
}

interface Props {
  onAssetResolved: (asset: EquipmentRecord) => void
  onClose: () => void
}

async function releaseScanner(scanner: Html5Qrcode | null, clear = true) {
  if (!scanner) return

  try {
    if (scanner.isScanning) await scanner.stop()
  } catch {
    // The browser may already have released the media stream.
  }

  if (clear) {
    try {
      await scanner.clear()
    } catch {
      // Clearing an already-unmounted reader is safe to ignore.
    }
  }
}

function cameraMessage(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
  if (message.includes('permission') || message.includes('notallowed')) {
    return 'Camera access was blocked. Allow camera permission for this site, then try again.'
  }
  if (message.includes('notfound') || message.includes('no camera')) {
    return 'No camera was found on this device. You can enter the QR reference manually instead.'
  }
  if (!window.isSecureContext) {
    return 'Camera access requires HTTPS or localhost. Open the system through a secure connection.'
  }
  return 'The camera could not be started. Check whether another application is using it, then retry.'
}

export function QrScannerModal({ onAssetResolved, onClose }: Props) {
  const reactId = useId()
  const readerId = `equipment-qr-reader-${reactId.replace(/:/g, '')}`
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const camerasRef = useRef<CameraOption[]>([])
  const mountedRef = useRef(true)
  const processingRef = useRef(false)
  const decodedCallbackRef = useRef<(decodedText: string) => void>(() => undefined)
  const [cameras, setCameras] = useState<CameraOption[]>([])
  const [selectedCamera, setSelectedCamera] = useState('')
  const [status, setStatus] = useState<'starting' | 'scanning' | 'checking' | 'error'>('starting')
  const [message, setMessage] = useState('Requesting camera access…')
  const [manualCode, setManualCode] = useState('')

  const resolveScan = useCallback(async (decodedText: string) => {
    const value = decodedText.trim()
    if (!value || processingRef.current) return

    processingRef.current = true
    setStatus('checking')
    setMessage('QR detected. Verifying asset and program access…')

    const scanner = scannerRef.current
    try {
      if (scanner?.isScanning) scanner.pause(true)
      const asset = await resolveEquipmentQr(value)
      await releaseScanner(scanner)
      if (mountedRef.current) onAssetResolved(asset)
    } catch (error) {
      if (!mountedRef.current) return
      setStatus('error')
      setMessage(equipmentErrorMessage(error))
      processingRef.current = false
      try {
        if (scanner?.isScanning) scanner.resume()
      } catch {
        // A retry button remains available if the stream cannot resume.
      }
    }
  }, [onAssetResolved])

  decodedCallbackRef.current = (decodedText) => {
    void resolveScan(decodedText)
  }

  const startCamera = useCallback(async (cameraId?: string) => {
    const scanner = scannerRef.current
    if (!scanner) return

    setStatus('starting')
    setMessage('Starting camera…')
    processingRef.current = false

    try {
      if (scanner.isScanning) await releaseScanner(scanner, false)
      const devices = camerasRef.current.length > 0 ? camerasRef.current : await Html5Qrcode.getCameras()
      if (!mountedRef.current || scannerRef.current !== scanner) return

      if (devices.length === 0) throw new Error('No camera found')
      if (camerasRef.current.length === 0) {
        camerasRef.current = devices
        setCameras(devices)
      }

      const preferred = devices.find((device) => /back|rear|environment/i.test(device.label)) ?? devices[0]
      const nextCameraId = cameraId || preferred.id
      setSelectedCamera(nextCameraId)

      await scanner.start(
        nextCameraId,
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const edge = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.68)
            return { width: edge, height: edge }
          },
        },
        (decodedText) => decodedCallbackRef.current(decodedText),
        () => undefined,
      )

      if (!mountedRef.current || scannerRef.current !== scanner) {
        await releaseScanner(scanner)
        return
      }

      setStatus('scanning')
      setMessage('Position the asset QR code inside the frame.')
    } catch (error) {
      if (!mountedRef.current) return
      setStatus('error')
      setMessage(cameraMessage(error))
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    const scanner = new Html5Qrcode(readerId, {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false,
    })
    scannerRef.current = scanner
    void startCamera()

    return () => {
      mountedRef.current = false
      void releaseScanner(scanner)
      if (scannerRef.current === scanner) scannerRef.current = null
    }
  }, [readerId, startCamera])

  const requestClose = useCallback(() => {
    void releaseScanner(scannerRef.current).finally(onClose)
  }, [onClose])

  return (
    <ModalShell
      description="Use a phone or desktop camera to identify a registered asset."
      onClose={requestClose}
      title="Scan Asset QR Code"
      width="md"
    >
      <div className="space-y-5">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-inner">
          <div className="relative aspect-[4/3] min-h-64 w-full bg-slate-950">
            <div
              className="size-full overflow-hidden [&_canvas]:!max-h-full [&_video]:!h-full [&_video]:!w-full [&_video]:!object-cover"
              id={readerId}
            />

            {status === 'starting' || status === 'checking' ? (
              <div className="absolute inset-0 grid place-items-center bg-slate-950/75 text-white backdrop-blur-sm">
                <div className="text-center">
                  <LoaderCircle className="mx-auto size-8 animate-spin" />
                  <p className="mt-3 text-sm font-bold">
                    {status === 'checking' ? 'Verifying asset…' : 'Starting camera…'}
                  </p>
                </div>
              </div>
            ) : null}

            {status === 'error' && !scannerRef.current?.isScanning ? (
              <div className="absolute inset-0 grid place-items-center bg-slate-950 px-6 text-center text-white">
                <CameraOff className="size-10 text-slate-400" />
              </div>
            ) : null}

            {status === 'scanning' ? (
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="relative size-[54%] rounded-2xl border-2 border-white/90 shadow-[0_0_0_999px_rgba(2,6,23,0.28)]">
                  <span className="absolute -left-0.5 -top-0.5 size-8 rounded-tl-2xl border-l-4 border-t-4 border-emerald-400" />
                  <span className="absolute -right-0.5 -top-0.5 size-8 rounded-tr-2xl border-r-4 border-t-4 border-emerald-400" />
                  <span className="absolute -bottom-0.5 -left-0.5 size-8 rounded-bl-2xl border-b-4 border-l-4 border-emerald-400" />
                  <span className="absolute -bottom-0.5 -right-0.5 size-8 rounded-br-2xl border-b-4 border-r-4 border-emerald-400" />
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <div
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
            status === 'error'
              ? 'border-amber-200 bg-amber-50 text-amber-900'
              : status === 'checking'
                ? 'border-blue-200 bg-blue-50 text-blue-900'
                : 'border-emerald-200 bg-emerald-50 text-emerald-900'
          }`}
          role={status === 'error' ? 'alert' : 'status'}
        >
          {status === 'error' ? (
            <AlertTriangle className="mt-0.5 size-5 shrink-0" />
          ) : status === 'checking' ? (
            <LoaderCircle className="mt-0.5 size-5 shrink-0 animate-spin" />
          ) : (
            <ScanLine className="mt-0.5 size-5 shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">
              {status === 'error' ? 'Scanner needs attention' : status === 'checking' ? 'Checking QR code' : 'Scanner ready'}
            </p>
            <p className="mt-0.5 text-xs leading-5 opacity-80">{message}</p>
          </div>
          {status === 'error' ? (
            <button
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-bold text-amber-800 shadow-sm"
              onClick={() => void startCamera(selectedCamera || undefined)}
              type="button"
            >
              <RefreshCw className="size-3.5" /> Retry
            </button>
          ) : null}
        </div>

        {cameras.length > 1 ? (
          <label className="block space-y-1.5">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              <Camera className="size-4" /> Camera
            </span>
            <select
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100"
              onChange={(event) => void startCamera(event.target.value)}
              value={selectedCamera}
            >
              {cameras.map((camera, index) => (
                <option key={camera.id} value={camera.id}>
                  {camera.label || `Camera ${index + 1}`}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Keyboard className="size-4 text-[#0f53b7]" /> Enter QR reference manually
          </div>
          <p className="mt-1 text-xs text-slate-500">Use this fallback when the camera is unavailable or the printed code is damaged.</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              className="h-10 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 font-mono text-sm outline-none focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100"
              onChange={(event) => setManualCode(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void resolveScan(manualCode)
              }}
              placeholder="Example: SETUP-QR-0001"
              value={manualCode}
            />
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0f53b7] px-4 text-sm font-bold text-white transition hover:bg-[#0b3f8b] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!manualCode.trim() || status === 'checking'}
              onClick={() => void resolveScan(manualCode)}
              type="button"
            >
              <CheckCircle2 className="size-4" /> Find asset
            </button>
          </div>
        </section>
      </div>
    </ModalShell>
  )
}
