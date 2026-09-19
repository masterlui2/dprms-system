/**
 * System: DPRMS
 * Purpose: Render pdf thumbnail for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { FileText, Loader2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { useEffect, useRef, useState } from 'react';
import { viewDocumentBlobForStaff } from '../../services/document_store';
import { cn } from '../../utils/cn';
import { reportError } from '../../utils/error_reporting';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

const g_objDataUrlCache = new Map<string, string>();
const g_objDocumentBlobUrlCache = new Map<number, string>();
const g_objDocumentBlobRequests = new Map<number, Promise<string>>();

/** Get document blob url. */
async function _getDocumentBlobUrl(intDocumentId: number): Promise<string>
{
    const strCached = g_objDocumentBlobUrlCache.get(intDocumentId);
    if (strCached)
    {
        return strCached;
    }

    const objPending = g_objDocumentBlobRequests.get(intDocumentId);
    if (objPending)
    {
        return objPending;
    }

    const objRequest = viewDocumentBlobForStaff(intDocumentId)
        .then((strBlobUrl) =>
        {
            g_objDocumentBlobUrlCache.set(intDocumentId, strBlobUrl);
            return strBlobUrl;
        })
        .finally(() =>
        {
            g_objDocumentBlobRequests.delete(intDocumentId);
        });

    g_objDocumentBlobRequests.set(intDocumentId, objRequest);
    return objRequest;
} /* end _getDocumentBlobUrl */

interface PdfThumbnailProps
{
    strUrl?: string | null;
    intDocumentId?: number | null;
    className?: string;
    strAlt?: string;
    title?: string;
}

/** Render pdf thumbnail and its available actions. */
export function PdfThumbnail({
    strUrl,
    intDocumentId,
    className: strClassName,
    strAlt = 'PDF Preview',
    title: strTitle,
}: PdfThumbnailProps)
{
    const objContainerRef = useRef<HTMLDivElement | null>(null);
    const strCacheKey = intDocumentId ? `doc_${intDocumentId}` : strUrl || null;
    const [strCachedDataUrl, setStrCachedDataUrl] = useState<string | null>(() =>
        strCacheKey ? g_objDataUrlCache.get(strCacheKey) || null : null,
    );
    const [blnIsVisible, setBlnIsVisible] = useState(Boolean(strCachedDataUrl));
    const [blnLoading, setBlnLoading] = useState(false);
    const [, setHasError] = useState<boolean>(false);

    useEffect(
        () =>
        {
            const strCached = strCacheKey ? g_objDataUrlCache.get(strCacheKey) : null;
            setStrCachedDataUrl(strCached || null);
            setBlnLoading(false);
            setHasError(false);

            if (strCached || (!strUrl && !intDocumentId))
            {
                setBlnIsVisible(Boolean(strCached));
                return;
            }

            const objElement = objContainerRef.current;
            if (!objElement || typeof IntersectionObserver === 'undefined')
            {
                setBlnIsVisible(true);
                return;
            }

            setBlnIsVisible(false);
            const objObserver = new IntersectionObserver(
                (arrEntries) =>
                {
                    if (arrEntries.some((objEntry) => objEntry.isIntersecting))
                    {
                        setBlnIsVisible(true);
                        objObserver.disconnect();
                    }
                },
                { rootMargin: '240px 0px' },
            );
            objObserver.observe(objElement);

            return () => objObserver.disconnect();
        } /* end PdfThumbnail */,
        [strCacheKey, intDocumentId, strUrl],
    );

    useEffect(
        () =>
        {
            if (strCacheKey && g_objDataUrlCache.has(strCacheKey))
            {
                setStrCachedDataUrl(g_objDataUrlCache.get(strCacheKey)!);
                setBlnLoading(false);
                setHasError(false);
                return;
            }

            if (!strUrl && !intDocumentId)
            {
                setBlnLoading(false);
                return;
            }

            if (!blnIsVisible)
            {
                return;
            }

            let blnIsCancelled = false;
            setBlnLoading(true);
            setHasError(false);

            /** Render page. */
            async function _renderPage()
            {
                let strActiveUrl = strUrl;
                let strCreatedBlobUrl: string | null = null;

                try
                {
                    if (!strActiveUrl && intDocumentId)
                    {
                        strCreatedBlobUrl = await _getDocumentBlobUrl(intDocumentId);
                        strActiveUrl = strCreatedBlobUrl;
                    }

                    if (!strActiveUrl)
                    {
                        throw new Error('No PDF URL available');
                    }

                    let objPdf: pdfjsLib.PDFDocumentProxy | null = null;

                    try
                    {
                        const objLoadingTask = pdfjsLib.getDocument({ url: strActiveUrl });
                        objPdf = await objLoadingTask.promise;
                    } catch (errCaught)
                    {
                        reportError(errCaught, 'PdfThumbnail: render page failed.');

                        if (intDocumentId && strActiveUrl !== strCreatedBlobUrl)
                        {
                            strCreatedBlobUrl = await _getDocumentBlobUrl(intDocumentId);
                            strActiveUrl = strCreatedBlobUrl;
                            const objRetryTask = pdfjsLib.getDocument({ url: strActiveUrl });
                            objPdf = await objRetryTask.promise;
                        } else
                        {
                            throw new Error('Could not open PDF file');
                        }
                    }

                    if (blnIsCancelled || !objPdf)
                    {
                        return;
                    }

                    const objPage = await objPdf.getPage(1);
                    if (blnIsCancelled)
                    {
                        return;
                    }

                    const objViewport = objPage.getViewport({ scale: 0.6 });
                    const objCanvas = document.createElement('canvas');
                    const objContext = objCanvas.getContext('2d');
                    if (!objContext)
                    {
                        throw new Error('No 2d context');
                    }

                    objCanvas.height = objViewport.height;
                    objCanvas.width = objViewport.width;

                    const objRenderContext = {
                        canvasContext: objContext,
                        viewport: objViewport,
                        canvas: objCanvas,
                    };

                    await objPage.render(objRenderContext).promise;
                    if (blnIsCancelled)
                    {
                        return;
                    }

                    const strDataUrl = objCanvas.toDataURL('image/webp', 0.85);
                    if (strCacheKey)
                    {
                        g_objDataUrlCache.set(strCacheKey, strDataUrl);
                    }
                    if (strUrl)
                    {
                        g_objDataUrlCache.set(strUrl, strDataUrl);
                    }
                    setStrCachedDataUrl(strDataUrl);
                    setBlnLoading(false);
                } /* end try */ catch (errCaught)
                {
                    reportError(errCaught, 'PdfThumbnail: render page failed.');

                    if (!blnIsCancelled)
                    {
                        setHasError(true);
                        setBlnLoading(false);
                    }
                }
            } /* end _renderPage */

            _renderPage();

            return () =>
            {
                blnIsCancelled = true;
            };
        } /* end PdfThumbnail */,
        [strUrl, intDocumentId, strCacheKey, blnIsVisible],
    );

    if (strCachedDataUrl)
    {
        return (
            <div
                ref={objContainerRef}
                className="relative h-full w-full overflow-hidden bg-white flex items-start justify-center"
            >
                <img
                    src={strCachedDataUrl}
                    alt={strAlt}
                    className={cn(
                        'h-full w-full object-cover object-top select-none bg-white',
                        strClassName,
                    )}
                />
            </div>
        );
    }

    if (blnLoading)
    {
        return (
            <div
                ref={objContainerRef}
                className={cn(
                    'flex h-full w-full flex-col items-center justify-center bg-white p-2 text-slate-400 select-none',
                    strClassName,
                )}
            >
                <Loader2 className="size-4 animate-spin text-[#0f53b7]" />
                <span className="mt-1 text-[10px] font-medium text-slate-500">
                    Loading preview...
                </span>
            </div>
        );
    }

    return (
        <div
            ref={objContainerRef}
            className={cn(
                'relative flex h-full w-full flex-col justify-between overflow-hidden bg-white p-2.5 shadow-2xs select-none',
                strClassName,
            )}
        >
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
            <p
                className="truncate text-[9px] font-bold text-slate-700 text-center"
                title={strTitle}
            >
                {strTitle || 'Document'}
            </p>
        </div>
    );
} /* end PdfThumbnail */
