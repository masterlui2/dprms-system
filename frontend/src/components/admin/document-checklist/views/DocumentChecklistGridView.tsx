/**
 * System: DPRMS
 * Purpose: Render document checklist grid view for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import
{
    Check,
    Download,
    Eye,
    FileCheck2,
    FileText,
    History,
    Plus,
    Trash2,
    Upload,
    UploadCloud,
} from 'lucide-react';
import type { DocumentChecklistItem } from '../../../../services/document_checklist_store';
import { cn } from '../../../../utils/cn';
import { PdfThumbnail } from '../../../common/PdfThumbnail';
import { getItemComplianceState } from '../utils';

interface DocumentChecklistGridViewProps
{
    arrFilteredItems: DocumentChecklistItem[];
    objBlobMap: Record<string, string>;
    blnCanReview: boolean;
    blnCanUpload: boolean;
    handleOpenReviewModal: (objItem: DocumentChecklistItem) => void;
    handlePreviewDocument: (objItem: DocumentChecklistItem) => void;
    handleDownloadItem: (objItem: DocumentChecklistItem) => void;
    handleOpenUploadModal: (objItem: DocumentChecklistItem) => void;
    setVersionModalDoc: (objItem: DocumentChecklistItem) => void;
    handleRemoveFile: (objItem: DocumentChecklistItem) => void;
    handleToggleItemVerify: (strItemId: string) => void;
}

/** Render document checklist grid view and its available actions. */
export function DocumentChecklistGridView({
    arrFilteredItems,
    objBlobMap,
    blnCanReview,
    blnCanUpload,
    handleOpenReviewModal,
    handlePreviewDocument,
    handleDownloadItem,
    handleOpenUploadModal,
    setVersionModalDoc,
    handleRemoveFile,
    handleToggleItemVerify,
}: DocumentChecklistGridViewProps)
{
    return (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {arrFilteredItems.map(
                (objItem, intIndex) =>
                {
                    const blnHasFile = Boolean(objItem.uploadedDoc);
                    const strBlobUrl =
                        objBlobMap[objItem.id] ||
                        (objItem.uploadedDoc?.file_path?.startsWith('blob:')
                            ? objItem.uploadedDoc.file_path
                            : null);
                    const objState = getItemComplianceState(objItem);

                    const intArchivedVersionCount =
                        objItem.uploadedDoc?.archived_versions?.length ?? 0;
                    const blnHasVersionHistory = intArchivedVersionCount > 0;

                    return (
                        <div
                            key={objItem.id}
                            className={cn(
                                'group flex flex-col justify-between rounded-2xl border p-2.5 bg-white transition duration-200 hover:shadow-md',
                                objState.type === 'RETURNED'
                                    ? 'border-rose-300/90 bg-rose-50/15 hover:border-rose-400'
                                    : objState.type === 'UNDER_REVIEW'
                                        ? 'border-blue-200/90 bg-blue-50/10 hover:border-[#0f53b7]/60'
                                        : blnHasFile
                                            ? 'border-slate-200/90 hover:border-[#0f53b7]/60'
                                            : 'border-dashed border-slate-300 hover:border-[#0f53b7]/60 bg-slate-50/40',
                            )}
                        >
                            <div>
                                <div
                                    onClick={() =>
                                        blnHasFile
                                            ? blnCanReview
                                                ? handleOpenReviewModal(objItem)
                                                : handlePreviewDocument(objItem)
                                            : blnCanUpload && handleOpenUploadModal(objItem)
                                    }
                                    className={cn(
                                        'relative h-36 sm:h-40 w-full overflow-hidden rounded-xl border flex flex-col items-center justify-center cursor-pointer transition select-none',
                                        blnHasFile
                                            ? 'bg-slate-50 border-slate-200/80 group-hover:border-[#0f53b7]/40 shadow-2xs'
                                            : 'bg-white border-dashed border-slate-300 hover:bg-blue-50/40 hover:border-[#0f53b7]',
                                    )}
                                >
                                    {blnHasFile ? (
                                        <div className="relative h-full w-full overflow-hidden bg-white p-1 flex items-center justify-center">
                                            <div className="relative h-full w-full overflow-hidden rounded-lg bg-white shadow-2xs border border-slate-200/60">
                                                <PdfThumbnail
                                                    strUrl={strBlobUrl}
                                                    intDocumentId={objItem.uploadedDoc?.id}
                                                    title={
                                                        objItem.uploadedDoc?.file_name ||
                                                        objItem.name
                                                    }
                                                    strAlt={
                                                        objItem.uploadedDoc?.file_name ||
                                                        objItem.name
                                                    }
                                                />
                                            </div>
                                            <div className="absolute inset-0 bg-transparent transition group-hover:bg-blue-900/10 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                <span className="rounded-xl bg-slate-900/80 px-2.5 py-1 text-[11px] font-bold text-white shadow-md flex items-center gap-1">
                                                    {blnCanReview ? (
                                                        <FileCheck2 className="size-3" />
                                                    ) : (
                                                        <Eye className="size-3" />
                                                    )}
                                                    <span>
                                                        {blnCanReview ? 'Review' : 'Preview'}
                                                    </span>
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center gap-1.5 p-3 text-center">
                                            <span className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-[#0f53b7] transition">
                                                <UploadCloud className="size-4.5" />
                                            </span>
                                            <p className="text-xs font-bold text-slate-700 group-hover:text-[#0f53b7]">
                                                Upload PDF
                                            </p>
                                            <p className="text-[10px] text-slate-400">
                                                Click or drag file
                                            </p>
                                        </div>
                                    )}

                                    {blnHasVersionHistory && (
                                        <button
                                            type="button"
                                            onClick={(objEvent) =>
                                            {
                                                objEvent.stopPropagation();
                                                setVersionModalDoc(objItem);
                                            }}
                                            className="absolute top-2 right-2 z-10 inline-flex items-center gap-0.5 rounded-md bg-slate-100/90 px-1.5 py-0.5 text-[9px] font-medium font-mono text-slate-500 border border-slate-200/80 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer shadow-2xs"
                                            title={`Version ${intArchivedVersionCount + 1} (${intArchivedVersionCount} prior versions - click to view history)`}
                                        >
                                            <History className="size-2.5 text-slate-400" />
                                            <span>v{intArchivedVersionCount + 1}</span>
                                        </button>
                                    )}
                                </div>

                                <div className="mt-2.5 space-y-1">
                                    <div className="flex items-center justify-between gap-1">
                                        <h4
                                            className="truncate text-xs font-bold text-slate-950 flex-1"
                                            title={`${intIndex + 1}. ${objItem.name}`}
                                        >
                                            {intIndex + 1}. {objItem.name}
                                        </h4>
                                        {objState.label ? (
                                            <span
                                                className={cn(
                                                    'shrink-0 whitespace-nowrap text-xs font-bold leading-none',
                                                    objState.type === 'SATISFIED'
                                                        ? 'text-emerald-700'
                                                        : objState.badgeClass,
                                                )}
                                            >
                                                {objState.label}
                                            </span>
                                        ) : null}
                                    </div>

                                    {blnHasFile ? (
                                        <p
                                            className="truncate text-[11px] text-slate-500 font-medium flex items-center gap-1"
                                            title={objItem.uploadedDoc?.file_name}
                                        >
                                            <FileText className="size-3 shrink-0 text-slate-400" />
                                            <span className="truncate">
                                                {objItem.uploadedDoc?.file_name}
                                            </span>
                                        </p>
                                    ) : (
                                        <p
                                            className="truncate text-[10px] text-slate-400 font-medium"
                                            title={objItem.group}
                                        >
                                            {objItem.group}
                                        </p>
                                    )}

                                    <div className="flex items-center justify-end gap-1 text-[11px] text-slate-500">
                                        <div className="flex shrink-0 items-center gap-1">
                                            {blnHasFile && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        blnCanReview
                                                            ? handleOpenReviewModal(objItem)
                                                            : handlePreviewDocument(objItem)
                                                    }
                                                    className={cn(
                                                        'inline-flex size-6 items-center justify-center rounded-lg border transition shadow-2xs cursor-pointer',
                                                        blnCanReview &&
                                                            (objState.type === 'UNDER_REVIEW' ||
                                                                objState.type === 'RETURNED')
                                                            ? 'border-[#0f53b7] bg-[#0f53b7] text-white hover:bg-[#0b3f8b]'
                                                            : 'border-slate-200 text-slate-700 hover:bg-[#E6EEF4]/70 hover:text-[#0f53b7]',
                                                    )}
                                                    title={
                                                        blnCanReview
                                                            ? 'Review Document'
                                                            : 'Preview Document'
                                                    }
                                                >
                                                    {blnCanReview ? (
                                                        <FileCheck2 className="size-3" />
                                                    ) : (
                                                        <Eye className="size-3" />
                                                    )}
                                                </button>
                                            )}

                                            {blnHasFile ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            void handleDownloadItem(objItem)
                                                        }
                                                        className="inline-flex size-6 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                                                        title="Download"
                                                    >
                                                        <Download className="size-3" />
                                                    </button>

                                                    {blnCanUpload && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleOpenUploadModal(objItem)
                                                                }
                                                                className="inline-flex size-6 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-[#0f53b7] transition cursor-pointer"
                                                                title="Replace Document"
                                                            >
                                                                <Upload className="size-3" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleRemoveFile(objItem)
                                                                }
                                                                className="inline-flex size-6 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                                                                title="Remove Document"
                                                            >
                                                                <Trash2 className="size-3" />
                                                            </button>
                                                        </>
                                                    )}
                                                </>
                                            ) : (
                                                blnCanUpload && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleToggleItemVerify(objItem.id)
                                                            }
                                                            title={
                                                                objItem.isPresent
                                                                    ? 'Checked (Click to uncheck)'
                                                                    : 'Click to manually verify offline'
                                                            }
                                                            className={cn(
                                                                'flex size-6 items-center justify-center rounded-lg border transition cursor-pointer',
                                                                objItem.isPresent
                                                                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs hover:bg-emerald-700'
                                                                    : 'border-slate-300 bg-white text-transparent hover:border-slate-400 hover:bg-slate-50',
                                                            )}
                                                        >
                                                            <Check className="size-3.5 stroke-[3]" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleOpenUploadModal(objItem)
                                                            }
                                                            className="inline-flex size-6 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-[#0f53b7] transition cursor-pointer"
                                                            title="Upload PDF scan"
                                                        >
                                                            <Plus className="size-3.5" />
                                                        </button>
                                                    </>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ); // end return
                } /* end DocumentChecklistGridView */,
            )}
        </div>
    ); // end return
} /* end DocumentChecklistGridView */
