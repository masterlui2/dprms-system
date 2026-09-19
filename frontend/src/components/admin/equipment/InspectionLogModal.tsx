/**
 * System: DPRMS
 * Purpose: Render inspection log modal for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import
{
    AlertTriangle,
    CheckCircle2,
    ChevronDown,
    ClipboardCheck,
    History,
    ImagePlus,
    LoaderCircle,
    Power,
    ShieldAlert,
    Trash2,
    Wrench,
} from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { reportError } from '../../../utils/error_reporting';

import type { EquipmentRecord } from '../../../data/admin';
import
{
    equipmentErrorMessage,
    submitEquipmentInspection,
    type InspectionCondition,
} from '../../../services/equipment_store';
import { cn } from '../../../utils/cn';
import { ModalShell } from '../ModalShell';

interface Props
{
    objAsset: EquipmentRecord;
    onClose: () => void;
    onSaved: (objAsset: EquipmentRecord) => void;
}

const CONDITION_OPTIONS = [
    {
        value: 'good' as const,
        label: 'Good',
        icon: CheckCircle2,
        tone: 'border-emerald-500 bg-emerald-50 text-emerald-800',
    },
    {
        value: 'fair' as const,
        label: 'Fair',
        icon: Wrench,
        tone: 'border-sky-500 bg-sky-50 text-sky-800',
    },
    {
        value: 'poor' as const,
        label: 'Poor',
        icon: ShieldAlert,
        tone: 'border-amber-500 bg-amber-50 text-amber-900',
    },
    {
        value: 'non-functional' as const,
        label: 'Non-functional',
        icon: Power,
        tone: 'border-rose-500 bg-rose-50 text-rose-800',
    },
];

/** Initial condition. */
function _initialCondition(strCondition: EquipmentRecord['condition']): InspectionCondition
{
    if (strCondition === 'Fair')
    {
        return 'fair';
    }
    if (strCondition === 'Poor')
    {
        return 'poor';
    }
    if (strCondition === 'Non-functional')
    {
        return 'non-functional';
    }
    return 'good';
}

/** Local date. */
function _localDate(): string
{
    const dtNow = new Date();
    const intOffset = dtNow.getTimezoneOffset() * 60_000;
    return new Date(dtNow.getTime() - intOffset).toISOString().slice(0, 10);
}

/** Display date. */
function _displayDate(strValue?: string | null, strFallback = 'Not recorded'): string
{
    if (!strValue)
    {
        return strFallback;
    }
    const dtDate = new Date(strValue.length === 10 ? `${strValue}T00:00:00` : strValue);
    return Number.isNaN(dtDate.getTime())
        ? strFallback
        : dtDate.toLocaleDateString('en-PH', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Format money. */
function _formatMoney(intValue?: number): string
{
    if (intValue === undefined)
    {
        return 'Not recorded';
    }
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 2,
    }).format(intValue);
}

/** Render report field and its available actions. */
function ReportField({
    strLabel,
    children: objChildren,
}: {
    children: ReactNode;
    strLabel: string;
})
{
    return (
        <div className="min-w-0 px-4 py-3">
            <dt className="text-[11px] font-black uppercase tracking-wide text-[#0f53b7]">
                {strLabel}
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-800">{objChildren}</dd>
        </div>
    );
}

/** Render section title and its available actions. */
function SectionTitle({
    children: objChildren,
    strNumber,
}: {
    children: ReactNode;
    strNumber: string;
})
{
    return (
        <h3 className="flex items-center gap-2 text-sm font-black text-slate-900">
            <span className="grid size-6 shrink-0 place-items-center rounded-md bg-blue-50 text-[11px] text-[#0f53b7]">
                {strNumber}
            </span>
            {objChildren}
        </h3>
    );
}

/** Render inspection log modal and its available actions. */
export function InspectionLogModal({ objAsset, onClose, onSaved }: Props)
{
    const [strCondition, setStrCondition] = useState<InspectionCondition>(() =>
        _initialCondition(objAsset.condition),
    );
    const [strObservations, setStrObservations] = useState('');
    const [strRecommendations, setStrRecommendations] = useState('');
    const [strInspectionDate, setStrInspectionDate] = useState(_localDate);
    const [arrPhotos, setArrPhotos] = useState<File[]>([]);
    const [strError, setStrError] = useState<string | null>(null);
    const [blnIsSubmitting, setBlnIsSubmitting] = useState(false);
    const blnObservationsRequired = strCondition === 'poor' || strCondition === 'non-functional';
    const blnCanSubmit =
        !blnIsSubmitting &&
        Boolean(objAsset.qrReference) &&
        Boolean(strInspectionDate) &&
        (!blnObservationsRequired || strObservations.trim().length > 0);
    const strSelectedCondition =
        CONDITION_OPTIONS.find((objOption) => objOption.value === strCondition)?.label ?? 'Good';
    const arrPreviews = useMemo(
        () => arrPhotos.map((objFile) => ({ file: objFile, url: URL.createObjectURL(objFile) })),
        [arrPhotos],
    );

    useEffect(
        () => () => arrPreviews.forEach((objPreview) => URL.revokeObjectURL(objPreview.url)),
        [arrPreviews],
    );

    /** Handle submit. */
    async function _handleSubmit()
    {
        if (!blnCanSubmit)
        {
            return;
        }
        setStrError(null);
        setBlnIsSubmitting(true);
        try
        {
            const objUpdated = await submitEquipmentInspection({
                asset: objAsset,
                condition: strCondition,
                inspectionDate: strInspectionDate,
                photos: arrPhotos,
                recommendations: strRecommendations,
                remarks: strObservations,
            });
            onSaved(objUpdated);
        } catch (errSubmitError)
        {
            reportError(errSubmitError, 'InspectionLogModal: handle submit failed.');

            setStrError(equipmentErrorMessage(errSubmitError));
            setBlnIsSubmitting(false);
        }
    }

    /** Add photos. */
    function _addPhotos(objFiles: FileList | null)
    {
        if (!objFiles)
        {
            return;
        }
        const arrIncoming = Array.from(objFiles);
        if (arrPhotos.length + arrIncoming.length > 5)
        {
            setStrError('You can attach up to five inspection photos.');
            return;
        }
        setStrError(null);
        setArrPhotos((arrCurrent) => [...arrCurrent, ...arrIncoming]);
    }

    return (
        <ModalShell
            txtDescription={`${objAsset.program} · ${objAsset.propertyNumber || objAsset.id}`}
            objFooter={
                <div className="flex justify-end gap-2">
                    <button
                        className="h-10 rounded-xl px-4 text-sm font-bold text-slate-600 hover:bg-slate-100"
                        disabled={blnIsSubmitting}
                        onClick={onClose}
                        type="button"
                    >
                        Cancel
                    </button>
                    <button
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0f53b7] px-5 text-sm font-bold text-white shadow-sm hover:bg-[#0b3f8b] disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={!blnCanSubmit}
                        onClick={() => void _handleSubmit()}
                        type="button"
                    >
                        {blnIsSubmitting ? (
                            <LoaderCircle className="size-4 animate-spin" />
                        ) : (
                            <ClipboardCheck className="size-4" />
                        )}
                        {blnIsSubmitting ? 'Saving…' : 'Save report'}
                    </button>
                </div>
            }
            onClose={onClose}
            title="Equipment Inspection Report"
            strWidth="xl"
        >
            <div className="space-y-5">
                <dl className="grid overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2">
                    <div className="bg-white">
                        <ReportField strLabel="I. Project Title">
                            <span className="block">{objAsset.projectTitle}</span>
                            <span className="mt-0.5 block font-mono text-xs font-normal text-slate-500">
                                {objAsset.projectId}
                            </span>
                        </ReportField>
                    </div>
                    <div className="bg-white">
                        <ReportField strLabel="II. Project Cooperator">
                            <span className="block">{objAsset.assignedTo}</span>
                            <span className="mt-0.5 block text-xs font-normal text-slate-500">
                                {objAsset.location}
                            </span>
                        </ReportField>
                    </div>
                    <div className="mt-px bg-white">
                        <ReportField strLabel="III. Date Installed">
                            {_displayDate(objAsset.installationDate)}
                        </ReportField>
                    </div>
                    <div className="mt-px bg-white">
                        <ReportField strLabel="IV. Date Inspected">
                            <input
                                aria-label="Date inspected"
                                className="h-9 w-full max-w-52 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold outline-none focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100"
                                max={_localDate()}
                                onChange={(objEvent) => setStrInspectionDate(objEvent.target.value)}
                                required
                                type="date"
                                value={strInspectionDate}
                            />
                        </ReportField>
                    </div>
                </dl>

                <section>
                    <SectionTitle strNumber="V">
                        List of Equipment Inspected / Installed
                    </SectionTitle>
                    <div className="mt-3 hidden overflow-hidden rounded-xl border border-slate-200 lg:block">
                        <table className="w-full table-fixed border-collapse text-left text-xs">
                            <colgroup>
                                <col className="w-[7%]" />
                                <col className="w-[29%]" />
                                <col className="w-[7%]" />
                                <col className="w-[9%]" />
                                <col className="w-[15%]" />
                                <col className="w-[18%]" />
                                <col className="w-[15%]" />
                            </colgroup>
                            <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                                <tr>
                                    {[
                                        'Item No.',
                                        'Equipment Name / Description',
                                        'Qty',
                                        'Unit',
                                        'Amount',
                                        'Property Number',
                                        'Remarks',
                                    ].map((strHeader) => (
                                        <th
                                            className={cn(
                                                'border-r border-slate-200 px-3 py-2.5 font-semibold last:border-r-0',
                                                ['Item No.', 'Qty', 'Amount'].includes(strHeader) &&
                                                'text-right tabular-nums',
                                            )}
                                            key={strHeader}
                                        >
                                            {strHeader}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-t border-slate-200 text-slate-700">
                                    <td className="border-r border-slate-200 px-3 py-3 text-right tabular-nums">
                                        1
                                    </td>
                                    <td className="border-r border-slate-200 px-3 py-3">
                                        <span className="block font-semibold text-slate-900">
                                            {objAsset.name}
                                        </span>
                                        <span className="mt-0.5 block text-[11px] text-slate-500">
                                            {[
                                                objAsset.brand,
                                                objAsset.model,
                                                objAsset.serialNumber
                                                    ? `SN ${objAsset.serialNumber}`
                                                    : null,
                                            ]
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </span>
                                    </td>
                                    <td className="border-r border-slate-200 px-3 py-3 text-right tabular-nums">
                                        1
                                    </td>
                                    <td className="border-r border-slate-200 px-3 py-3">
                                        {objAsset.unit || 'unit'}
                                    </td>
                                    <td className="border-r border-slate-200 px-3 py-3 text-right font-medium tabular-nums">
                                        {_formatMoney(objAsset.acquisitionCost)}
                                    </td>
                                    <td className="break-words border-r border-slate-200 px-3 py-3 font-mono text-[11px]">
                                        {objAsset.propertyNumber || objAsset.id}
                                    </td>
                                    <td className="px-3 py-3 font-medium">
                                        {strSelectedCondition}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-3 rounded-xl border border-slate-200 p-4 lg:hidden">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="font-bold text-slate-900">{objAsset.name}</p>
                                <p className="mt-1 text-xs text-slate-500">
                                    SN: {objAsset.serialNumber || 'Not recorded'}
                                </p>
                            </div>
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#0f53b7]">
                                {strSelectedCondition}
                            </span>
                        </div>
                        <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
                            <div>
                                <dt className="text-slate-400">Quantity</dt>
                                <dd className="numeric-value font-medium">
                                    1 {objAsset.unit || 'unit'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-slate-400">Amount</dt>
                                <dd className="numeric-value font-medium">
                                    {_formatMoney(objAsset.acquisitionCost)}
                                </dd>
                            </div>
                            <div className="col-span-2">
                                <dt className="text-slate-400">Property number</dt>
                                <dd className="font-mono font-medium">
                                    {objAsset.propertyNumber || objAsset.id}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    <fieldset className="mt-4">
                        <legend className="text-xs font-bold text-slate-600">
                            Condition observed
                        </legend>
                        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {CONDITION_OPTIONS.map((objOption) =>
                            {
                                const Icon = objOption.icon;
                                const blnSelected = strCondition === objOption.value;
                                return (
                                    <button
                                        aria-pressed={blnSelected}
                                        className={cn(
                                            'flex h-11 items-center justify-center gap-2 rounded-xl border-2 px-3 text-xs font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100',
                                            blnSelected
                                                ? objOption.tone
                                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                                        )}
                                        key={objOption.value}
                                        onClick={() => setStrCondition(objOption.value)}
                                        type="button"
                                    >
                                        <Icon className="size-4" />
                                        {objOption.label}
                                    </button>
                                );
                            })}
                        </div>
                    </fieldset>
                </section>

                <section>
                    <SectionTitle strNumber="VI">
                        Observations / Problems Encountered{' '}
                        {blnObservationsRequired ? <span className="text-rose-600">*</span> : null}
                    </SectionTitle>
                    <textarea
                        aria-label="Observations or problems encountered"
                        className="mt-2 min-h-24 w-full resize-y rounded-xl border border-slate-300 p-3 text-sm leading-6 outline-none placeholder:text-slate-400 focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100"
                        maxLength={3000}
                        onChange={(objEvent) => setStrObservations(objEvent.target.value)}
                        placeholder="Enter observations or problems found."
                        value={strObservations}
                    />
                </section>

                <section>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <SectionTitle strNumber="VII">Pictures</SectionTitle>
                        <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-[#0f53b7] px-3 text-xs font-bold text-[#0f53b7] hover:bg-blue-50">
                            <ImagePlus className="size-4" />
                            Add pictures
                            <input
                                accept="image/jpeg,image/png,image/webp"
                                className="sr-only"
                                multiple
                                onChange={(objEvent) =>
                                {
                                    _addPhotos(objEvent.target.files);
                                    objEvent.target.value = '';
                                }}
                                type="file"
                            />
                        </label>
                    </div>
                    {arrPreviews.length ? (
                        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                            {arrPreviews.map((objPreview, intIndex) => (
                                <div
                                    className="relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                                    key={`${objPreview.file.name}-${intIndex}`}
                                >
                                    <img
                                        alt={`Inspection upload ${intIndex + 1}`}
                                        className="size-full object-cover"
                                        src={objPreview.url}
                                    />
                                    <button
                                        aria-label={`Remove ${objPreview.file.name}`}
                                        className="absolute right-2 top-2 grid size-8 place-items-center rounded-lg bg-white/95 text-rose-600 shadow-sm hover:bg-rose-50"
                                        onClick={() =>
                                            setArrPhotos((arrCurrent) =>
                                                arrCurrent.filter(
                                                    (_objUnused, intItemIndex) =>
                                                        intItemIndex !== intIndex,
                                                ),
                                            )
                                        }
                                        type="button"
                                    >
                                        <Trash2 className="size-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="mt-2 text-xs text-slate-400">No pictures added.</p>
                    )}
                </section>

                <section>
                    <SectionTitle strNumber="VIII">Recommendations</SectionTitle>
                    <textarea
                        aria-label="Recommendations"
                        className="mt-2 min-h-24 w-full resize-y rounded-xl border border-slate-300 p-3 text-sm leading-6 outline-none placeholder:text-slate-400 focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100"
                        maxLength={3000}
                        onChange={(objEvent) => setStrRecommendations(objEvent.target.value)}
                        placeholder="Enter recommended action, if any."
                        value={strRecommendations}
                    />
                </section>

                <details className="group rounded-xl border border-slate-200 bg-slate-50/60">
                    <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-xs font-bold text-slate-600">
                        <History className="size-4 text-[#0f53b7]" />
                        Previous inspections{' '}
                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] ring-1 ring-slate-200">
                            {objAsset.inspectionHistory?.length ?? 0}
                        </span>
                        <ChevronDown className="ml-auto size-4 transition group-open:rotate-180" />
                    </summary>
                    <div className="border-t border-slate-200 p-4">
                        {objAsset.inspectionHistory?.length ? (
                            <div className="space-y-3">
                                {objAsset.inspectionHistory.map((objEntry) => (
                                    <article
                                        className="rounded-xl bg-white p-3 ring-1 ring-slate-200"
                                        key={objEntry.id}
                                    >
                                        <p className="text-xs font-black text-slate-800">
                                            {_displayDate(objEntry.inspectedAt)} ·{' '}
                                            {objEntry.condition}
                                        </p>
                                        <p className="mt-0.5 text-[11px] text-slate-500">
                                            {objEntry.inspector}
                                        </p>
                                        {objEntry.observations ? (
                                            <p className="mt-2 text-xs leading-5 text-slate-700">
                                                {objEntry.observations}
                                            </p>
                                        ) : null}
                                        {objEntry.recommendations ? (
                                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                                Recommendation: {objEntry.recommendations}
                                            </p>
                                        ) : null}
                                        {objEntry.photos.length ? (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {objEntry.photos.map((strPhoto, intIndex) => (
                                                    <a
                                                        href={strPhoto}
                                                        key={strPhoto}
                                                        rel="noreferrer"
                                                        target="_blank"
                                                    >
                                                        <img
                                                            alt={`Inspection ${objEntry.id} photo ${intIndex + 1}`}
                                                            className="size-14 rounded-lg border border-slate-200 object-cover"
                                                            src={strPhoto}
                                                        />
                                                    </a>
                                                ))}
                                            </div>
                                        ) : null}
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-xs text-slate-500">
                                No previous inspections.
                            </p>
                        )}
                    </div>
                </details>

                {!objAsset.qrReference ? (
                    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        This asset needs an active QR code before an inspection can be saved.
                    </div>
                ) : null}
                {strError ? (
                    <div
                        className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800"
                        role="alert"
                    >
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        {strError}
                    </div>
                ) : null}
            </div>
        </ModalShell>
    ); // end return
} /* end InspectionLogModal */
