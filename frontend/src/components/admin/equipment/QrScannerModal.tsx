/**
 * System: DPRMS
 * Purpose: Render qr scanner modal for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import
{
    AlertTriangle,
    Camera,
    CameraOff,
    CheckCircle2,
    Keyboard,
    LoaderCircle,
    RefreshCw,
    ScanLine,
} from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { reportError } from '../../../utils/error_reporting';

import type { EquipmentRecord } from '../../../data/admin';
import { equipmentErrorMessage, resolveEquipmentQr } from '../../../services/equipment_store';
import { ModalShell } from '../ModalShell';

interface CameraOption
{
    id: string;
    label: string;
}

interface Props
{
    onAssetResolved: (objAsset: EquipmentRecord) => void;
    onClose: () => void;
}

/** Release scanner. */
async function _releaseScanner(objScanner: Html5Qrcode | null, blnClear = true)
{
    if (!objScanner)
    {
        return;
    }

    try
    {
        if (objScanner.isScanning)
        {
            await objScanner.stop();
        }
    } catch (errCaught)
    {
        reportError(errCaught, 'QrScannerModal: release scanner failed.');

        // The browser may already have released the media stream.
    }

    if (blnClear)
    {
        try
        {
            await objScanner.clear();
        } catch (errCaught)
        {
            reportError(errCaught, 'QrScannerModal: release scanner failed.');

            // Clearing an already-unmounted reader is safe to ignore.
        }
    }
} /* end _releaseScanner */

/** Camera message. */
function _cameraMessage(errError: unknown)
{
    const txtMessage =
        errError instanceof Error ? errError.message.toLowerCase() : String(errError).toLowerCase();
    if (txtMessage.includes('permission') || txtMessage.includes('notallowed'))
    {
        return 'Camera access was blocked. Allow camera permission for this site, then try again.';
    }
    if (txtMessage.includes('notfound') || txtMessage.includes('no camera'))
    {
        return 'No camera was found on this device. You can enter the QR reference manually instead.';
    }
    if (!window.isSecureContext)
    {
        return 'Camera access requires HTTPS or localhost. Open the system through a secure connection.';
    }
    return 'The camera could not be started. Check whether another application is using it, then retry.';
}

/** Render qr scanner modal and its available actions. */
export function QrScannerModal({ onAssetResolved, onClose }: Props)
{
    const strReactId = useId();
    const strReaderId = `equipment-qr-reader-${strReactId.replace(/:/g, '')}`;
    const objScannerRef = useRef<Html5Qrcode | null>(null);
    const objCamerasRef = useRef<CameraOption[]>([]);
    const objMountedRef = useRef(true);
    const objProcessingRef = useRef(false);
    const objDecodedCallbackRef = useRef<(strDecodedText: string) => void>(() => undefined);
    const [arrCameras, setArrCameras] = useState<CameraOption[]>([]);
    const [strSelectedCamera, setStrSelectedCamera] = useState('');
    const [strStatus, setStrStatus] = useState<'starting' | 'scanning' | 'checking' | 'error'>(
        'starting',
    );
    const [txtMessage, setTxtMessage] = useState('Requesting camera access…');
    const [strManualCode, setStrManualCode] = useState('');

    const _resolveScan = useCallback(
        async (strDecodedText: string) =>
        {
            const strValue = strDecodedText.trim();
            if (!strValue || objProcessingRef.current)
            {
                return;
            }

            objProcessingRef.current = true;
            setStrStatus('checking');
            setTxtMessage('QR detected. Verifying asset and program access…');

            const objScanner = objScannerRef.current;
            try
            {
                if (objScanner?.isScanning)
                {
                    objScanner.pause(true);
                }
                const objAsset = await resolveEquipmentQr(strValue);
                await _releaseScanner(objScanner);
                if (objMountedRef.current)
                {
                    onAssetResolved(objAsset);
                }
            } catch (errError)
            {
                reportError(errError, 'QrScannerModal: resolve scan failed.');

                if (!objMountedRef.current)
                {
                    return;
                }
                setStrStatus('error');
                setTxtMessage(equipmentErrorMessage(errError));
                objProcessingRef.current = false;
                try
                {
                    if (objScanner?.isScanning)
                    {
                        objScanner.resume();
                    }
                } catch (errCaught)
                {
                    reportError(errCaught, 'QrScannerModal: resolve scan failed.');

                    // A retry button remains available if the stream cannot resume.
                }
            }
        } /* end _resolveScan */,
        [onAssetResolved],
    );

    objDecodedCallbackRef.current = (strDecodedText) =>
    {
        void _resolveScan(strDecodedText);
    };

    const _startCamera = useCallback(
        async (strCameraId?: string) =>
        {
            const objScanner = objScannerRef.current;
            if (!objScanner)
            {
                return;
            }

            setStrStatus('starting');
            setTxtMessage('Starting camera…');
            objProcessingRef.current = false;

            try
            {
                if (objScanner.isScanning)
                {
                    await _releaseScanner(objScanner, false);
                }
                const arrDevices =
                    objCamerasRef.current.length > 0
                        ? objCamerasRef.current
                        : await Html5Qrcode.getCameras();
                if (!objMountedRef.current || objScannerRef.current !== objScanner)
                {
                    return;
                }

                if (arrDevices.length === 0)
                {
                    throw new Error('No camera found');
                }
                if (objCamerasRef.current.length === 0)
                {
                    objCamerasRef.current = arrDevices;
                    setArrCameras(arrDevices);
                }

                const objPreferred =
                    arrDevices.find((objDevice) =>
                        /back|rear|environment/i.test(objDevice.label),
                    ) ?? arrDevices[0];
                const strNextCameraId = strCameraId || objPreferred.id;
                setStrSelectedCamera(strNextCameraId);

                await objScanner.start(
                    strNextCameraId,
                    {
                        fps: 10,
                        qrbox: (intViewfinderWidth, intViewfinderHeight) =>
                        {
                            const intEdge = Math.floor(
                                Math.min(intViewfinderWidth, intViewfinderHeight) * 0.68,
                            );
                            return { width: intEdge, height: intEdge };
                        },
                    },
                    (strDecodedText) => objDecodedCallbackRef.current(strDecodedText),
                    () => undefined,
                );

                if (!objMountedRef.current || objScannerRef.current !== objScanner)
                {
                    await _releaseScanner(objScanner);
                    return;
                }

                setStrStatus('scanning');
                setTxtMessage('Position the asset QR code inside the frame.');
            } /* end try */ catch (errError)
            {
                reportError(errError, 'QrScannerModal: start camera failed.');

                if (!objMountedRef.current)
                {
                    return;
                }
                setStrStatus('error');
                setTxtMessage(_cameraMessage(errError));
            }
        } /* end _startCamera */,
        [],
    );

    useEffect(() =>
    {
        objMountedRef.current = true;
        const objScanner = new Html5Qrcode(strReaderId, {
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
            verbose: false,
        });
        objScannerRef.current = objScanner;
        void _startCamera();

        return () =>
        {
            objMountedRef.current = false;
            void _releaseScanner(objScanner);
            if (objScannerRef.current === objScanner)
            {
                objScannerRef.current = null;
            }
        };
    }, [strReaderId, _startCamera]);

    const _requestClose = useCallback(() =>
    {
        void _releaseScanner(objScannerRef.current).finally(onClose);
    }, [onClose]);

    const blnIsScannerStarting = strStatus === 'starting' || strStatus === 'checking';
    const blnCanRetryScanner = strStatus === 'error' && !objScannerRef.current?.isScanning;

    return (
        <ModalShell
            txtDescription="Use a phone or desktop camera to identify a registered asset."
            onClose={_requestClose}
            title="Scan Asset QR Code"
            strWidth="md"
        >
            <div className="space-y-5">
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-inner">
                    <div className="relative aspect-[4/3] min-h-64 w-full bg-slate-950">
                        <div
                            className="size-full overflow-hidden [&_canvas]:!max-h-full [&_video]:!h-full [&_video]:!w-full [&_video]:!object-cover"
                            id={strReaderId}
                        />

                        {blnIsScannerStarting ? (
                            <div className="absolute inset-0 grid place-items-center bg-slate-950/75 text-white backdrop-blur-sm">
                                <div className="text-center">
                                    <LoaderCircle className="mx-auto size-8 animate-spin" />
                                    <p className="mt-3 text-sm font-bold">
                                        {strStatus === 'checking'
                                            ? 'Verifying asset…'
                                            : 'Starting camera…'}
                                    </p>
                                </div>
                            </div>
                        ) : null}

                        {blnCanRetryScanner ? (
                            <div className="absolute inset-0 grid place-items-center bg-slate-950 px-6 text-center text-white">
                                <CameraOff className="size-10 text-slate-400" />
                            </div>
                        ) : null}

                        {strStatus === 'scanning' ? (
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
                    className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${strStatus === 'error'
                        ? 'border-amber-200 bg-amber-50 text-amber-900'
                        : strStatus === 'checking'
                            ? 'border-blue-200 bg-blue-50 text-blue-900'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-900'
                        }`}
                    role={strStatus === 'error' ? 'alert' : 'status'}
                >
                    {strStatus === 'error' ? (
                        <AlertTriangle className="mt-0.5 size-5 shrink-0" />
                    ) : strStatus === 'checking' ? (
                        <LoaderCircle className="mt-0.5 size-5 shrink-0 animate-spin" />
                    ) : (
                        <ScanLine className="mt-0.5 size-5 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold">
                            {strStatus === 'error'
                                ? 'Scanner needs attention'
                                : strStatus === 'checking'
                                    ? 'Checking QR code'
                                    : 'Scanner ready'}
                        </p>
                        <p className="mt-0.5 text-xs leading-5 opacity-80">{txtMessage}</p>
                    </div>
                    {strStatus === 'error' ? (
                        <button
                            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-bold text-amber-800 shadow-sm"
                            onClick={() => void _startCamera(strSelectedCamera || undefined)}
                            type="button"
                        >
                            <RefreshCw className="size-3.5" /> Retry
                        </button>
                    ) : null}
                </div>

                {arrCameras.length > 1 ? (
                    <label className="block space-y-1.5">
                        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                            <Camera className="size-4" /> Camera
                        </span>
                        <select
                            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100"
                            onChange={(objEvent) => void _startCamera(objEvent.target.value)}
                            value={strSelectedCamera}
                        >
                            {arrCameras.map((objCamera, intIndex) => (
                                <option key={objCamera.id} value={objCamera.id}>
                                    {objCamera.label || `Camera ${intIndex + 1}`}
                                </option>
                            ))}
                        </select>
                    </label>
                ) : null}

                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                        <Keyboard className="size-4 text-[#0f53b7]" /> Enter QR reference manually
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                        Use this fallback when the camera is unavailable or the printed code is
                        damaged.
                    </p>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <input
                            className="h-10 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 font-mono text-sm outline-none focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100"
                            onChange={(objEvent) => setStrManualCode(objEvent.target.value)}
                            onKeyDown={(objEvent) =>
                            {
                                if (objEvent.key === 'Enter')
                                {
                                    void _resolveScan(strManualCode);
                                }
                            }}
                            placeholder="Example: SETUP-QR-0001"
                            value={strManualCode}
                        />
                        <button
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0f53b7] px-4 text-sm font-bold text-white transition hover:bg-[#0b3f8b] disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={!strManualCode.trim() || strStatus === 'checking'}
                            onClick={() => void _resolveScan(strManualCode)}
                            type="button"
                        >
                            <CheckCircle2 className="size-4" /> Find asset
                        </button>
                    </div>
                </section>
            </div>
        </ModalShell>
    ); // end return
} /* end QrScannerModal */
