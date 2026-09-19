/**
 * System: DPRMS
 * Purpose: Render inventory page for the application pages.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import
{
    Boxes,
    Camera,
    CircleCheck,
    ClipboardCheck,
    LoaderCircle,
    PackageCheck,
    Plus,
    Printer,
    RefreshCw,
    Wrench,
} from 'lucide-react';
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { reportError } from '../../utils/error_reporting';

import { AdminSelect } from '../../components/admin/AdminFilters';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminPanel } from '../../components/admin/AdminPanel';
import { DataTable, type DataColumn } from '../../components/admin/DataTable';
import { EquipmentRegistrationModal } from '../../components/admin/equipment/EquipmentRegistrationModal';
import { InspectionLogModal } from '../../components/admin/equipment/InspectionLogModal';
import { QrStickerSheetModal } from '../../components/admin/equipment/QrStickerSheetModal';
import { MetricCard } from '../../components/admin/MetricCard';
import { ModalShell } from '../../components/admin/ModalShell';
import type { EquipmentRecord, Program } from '../../data/admin';
import
{
    equipmentErrorMessage,
    fetchEquipment,
    fetchEquipmentDetails,
    fetchEquipmentRegistrationOptions,
    type EquipmentRegistrationOptions,
    type EquipmentStatistics,
} from '../../services/equipment_store';
import { cn } from '../../utils/cn';

const QrScannerModal = lazy(() =>
    import('../../components/admin/equipment/QrScannerModal').then((objModule) => ({
        default: objModule.QrScannerModal,
    })),
);

type ProgramFilters = Record<Program, { categoryId: string; condition: string; }>;

const EMPTY_STATISTICS: EquipmentStatistics = {
    condition_alerts: 0,
    currently_issued: 0,
    good_condition: 0,
    total_equipment: 0,
};

/** Condition class. */
function _conditionClass(strCondition: EquipmentRecord['condition']): string
{
    if (strCondition === 'Good')
    {
        return 'text-emerald-700';
    }
    if (strCondition === 'Fair')
    {
        return 'text-sky-700';
    }
    if (strCondition === 'Poor')
    {
        return 'text-amber-700';
    }
    return 'text-rose-700';
}

/** Render inventory actions and its available actions. */
function InventoryActions({
    objEquipment,
    onInspect,
}: {
    objEquipment: EquipmentRecord;
    onInspect: (objEquipment: EquipmentRecord) => void;
})
{
    return (
        <button
            aria-label={`Open ${objEquipment.name} inspection report`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#0f53b7] px-3 text-xs font-bold text-white transition hover:bg-[#0b3f8b]"
            onClick={() => onInspect(objEquipment)}
            title="Open inspection report"
            type="button"
        >
            <ClipboardCheck className="size-3.5" />
            Report
        </button>
    );
}

/** Render inventory page and its available actions. */
export function InventoryPage()
{
    const [strActiveProgram, setStrActiveProgram] = useState<Program | null>(null);
    const [objOptions, setObjOptions] = useState<EquipmentRegistrationOptions>({
        categories: [],
        programs: [],
        projects: [],
    });
    const [objEquipmentByProgram, setObjEquipmentByProgram] = useState<
        Record<Program, EquipmentRecord[]>
    >({ SETUP: [], GIA: [] });
    const [objStatisticsByProgram, setObjStatisticsByProgram] = useState<
        Record<Program, EquipmentStatistics>
    >({ SETUP: EMPTY_STATISTICS, GIA: EMPTY_STATISTICS });
    const [objFilters, setObjFilters] = useState<ProgramFilters>({
        SETUP: { categoryId: 'all', condition: 'all' },
        GIA: { categoryId: 'all', condition: 'all' },
    });
    const [blnIsLoadingOptions, setBlnIsLoadingOptions] = useState(true);
    const [blnIsLoading, setBlnIsLoading] = useState(false);
    const [strLoadError, setStrLoadError] = useState<string | null>(null);
    const [blnRegistrationOpen, setBlnRegistrationOpen] = useState(false);
    const [blnScannerOpen, setBlnScannerOpen] = useState(false);
    const [blnPrintOpen, setBlnPrintOpen] = useState(false);
    const [objInspectionAsset, setObjInspectionAsset] = useState<EquipmentRecord | null>(null);

    useEffect(
        () =>
        {
            let blnCancelled = false;
            setBlnIsLoadingOptions(true);
            fetchEquipmentRegistrationOptions()
                .then((objResult) =>
                {
                    if (blnCancelled)
                    {
                        return;
                    }
                    setObjOptions(objResult);
                    setStrActiveProgram(
                        objResult.programs.includes('SETUP')
                            ? 'SETUP'
                            : (objResult.programs[0] ?? null),
                    );
                })
                .catch((errError) =>
                {
                    if (!blnCancelled)
                    {
                        setStrLoadError(equipmentErrorMessage(errError));
                    }
                })
                .finally(() =>
                {
                    if (!blnCancelled)
                    {
                        setBlnIsLoadingOptions(false);
                    }
                });
            return () =>
            {
                blnCancelled = true;
            };
        } /* end InventoryPage */,
        [],
    );

    const _loadEquipment = useCallback(
        async (strProgram: Program) =>
        {
            const objCurrentFilters = objFilters[strProgram];
            setBlnIsLoading(true);
            setStrLoadError(null);
            try
            {
                const objResult = await fetchEquipment({
                    categoryId:
                        objCurrentFilters.categoryId === 'all'
                            ? undefined
                            : Number(objCurrentFilters.categoryId),
                    condition:
                        objCurrentFilters.condition === 'all'
                            ? undefined
                            : objCurrentFilters.condition,
                    program: strProgram,
                });
                setObjEquipmentByProgram((objCurrent) => ({
                    ...objCurrent,
                    [strProgram]: objResult.equipment,
                }));
                setObjStatisticsByProgram((objCurrent) => ({
                    ...objCurrent,
                    [strProgram]: objResult.statistics,
                }));
                if (objResult.categories.length)
                {
                    setObjOptions((objCurrent) => ({
                        ...objCurrent,
                        categories: objResult.categories,
                    }));
                }
            } catch (errError)
            {
                reportError(errError, 'InventoryPage: load equipment failed.');

                setStrLoadError(equipmentErrorMessage(errError));
            } finally
            {
                setBlnIsLoading(false);
            }
        } /* end _loadEquipment */,
        [objFilters],
    );

    useEffect(() =>
    {
        if (strActiveProgram)
        {
            void _loadEquipment(strActiveProgram);
        }
    }, [strActiveProgram, _loadEquipment]);

    const arrEquipment = strActiveProgram ? objEquipmentByProgram[strActiveProgram] : [];
    const objStatistics = strActiveProgram
        ? objStatisticsByProgram[strActiveProgram]
        : EMPTY_STATISTICS;
    const objActiveFilters = strActiveProgram
        ? objFilters[strActiveProgram]
        : { categoryId: 'all', condition: 'all' };

    /** Update filter. */
    function _updateFilter(strKey: 'categoryId' | 'condition', strValue: string)
    {
        if (!strActiveProgram)
        {
            return;
        }
        setObjFilters((objCurrent) => ({
            ...objCurrent,
            [strActiveProgram]: { ...objCurrent[strActiveProgram], [strKey]: strValue },
        }));
    }

    /** Replace equipment. */
    function _replaceEquipment(objUpdated: EquipmentRecord)
    {
        const strProgram = objUpdated.program;
        if (!strProgram)
        {
            return;
        }
        setObjEquipmentByProgram((objCurrent) =>
        {
            const blnExists = objCurrent[strProgram].some(
                (objItem) => objItem.backendId === objUpdated.backendId,
            );
            return {
                ...objCurrent,
                [strProgram]: blnExists
                    ? objCurrent[strProgram].map((objItem) =>
                        objItem.backendId === objUpdated.backendId ? objUpdated : objItem,
                    )
                    : [objUpdated, ...objCurrent[strProgram]],
            };
        });
    }

    /** Open inspection. */
    async function _openInspection(objAsset: EquipmentRecord)
    {
        if (!objAsset.backendId)
        {
            setObjInspectionAsset(objAsset);
            return;
        }
        try
        {
            setObjInspectionAsset(await fetchEquipmentDetails(objAsset.backendId));
        } catch (errError)
        {
            reportError(errError, 'InventoryPage: open inspection failed.');

            void Swal.fire({
                icon: 'error',
                text: equipmentErrorMessage(errError),
                title: 'Could not open inspection report',
            });
        }
    }

    /** Handle registration saved. */
    function _handleRegistrationSaved(objSaved: EquipmentRecord, blnKeepOpen = false)
    {
        _replaceEquipment(objSaved);
        if (!blnKeepOpen)
        {
            setBlnRegistrationOpen(false);
        }
        if (strActiveProgram)
        {
            void _loadEquipment(strActiveProgram);
        }
        void Swal.fire({
            icon: 'success',
            position: 'top-end',
            showConfirmButton: false,
            text: blnKeepOpen
                ? `${objSaved.name} was saved. You can enter the next item under the same project.`
                : `${objSaved.name} was registered and its QR code is ready to print.`,
            timer: 2800,
            timerProgressBar: true,
            title: 'Equipment registered',
            toast: true,
        });
    }

    /** Handle inspection saved. */
    function _handleInspectionSaved(objUpdated: EquipmentRecord)
    {
        _replaceEquipment(objUpdated);
        setObjInspectionAsset(null);
        if (strActiveProgram)
        {
            void _loadEquipment(strActiveProgram);
        }
        void Swal.fire({
            icon: 'success',
            position: 'top-end',
            showConfirmButton: false,
            text: `${objUpdated.name} is now recorded as ${objUpdated.condition}.`,
            timer: 2600,
            timerProgressBar: true,
            title: 'Inspection recorded',
            toast: true,
        });
    }

    const arrColumns: DataColumn<EquipmentRecord>[] = useMemo(
        () => [
            {
                id: 'equipment',
                header: 'Equipment',
                className: 'w-[24%]',
                sortValue: (objItem) => objItem.name,
                render: (objItem) => (
                    <div>
                        <p className="font-bold text-slate-900">{objItem.name}</p>
                        <p className="mt-1 font-mono text-[11px] text-[#0f53b7]">
                            {objItem.propertyNumber || objItem.id}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                            SN: {objItem.serialNumber || 'Not recorded'}
                        </p>
                    </div>
                ),
            },
            {
                id: 'project',
                header: 'Project / Cooperator',
                className: 'w-[23%]',
                sortValue: (objItem) => objItem.assignedTo,
                render: (objItem) => (
                    <div>
                        <p className="font-semibold text-slate-800">{objItem.assignedTo}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                            {objItem.projectTitle}
                        </p>
                        <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                            {objItem.projectId}
                        </p>
                    </div>
                ),
            },
            {
                id: 'location',
                header: 'Category / Location',
                className: 'w-[20%]',
                sortValue: (objItem) => objItem.category || '',
                render: (objItem) => (
                    <div>
                        <p className="font-semibold text-slate-700">
                            {objItem.category || 'Uncategorized'}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                            {objItem.location}
                        </p>
                    </div>
                ),
            },
            {
                id: 'condition',
                header: 'Condition',
                className: 'w-[11%]',
                sortValue: (objItem) => objItem.condition,
                render: (objItem) => (
                    <span className={cn('text-sm font-black', _conditionClass(objItem.condition))}>
                        {objItem.condition}
                    </span>
                ),
            },
            {
                id: 'inspection',
                header: 'Last inspected',
                className: 'w-[12%]',
                sortValue: (objItem) => objItem.lastCheckedAt || '',
                render: (objItem) => (
                    <span className="text-xs leading-5 text-slate-500">{objItem.lastScanned}</span>
                ),
            },
            {
                id: 'actions',
                header: 'Actions',
                className: 'w-[10%] text-right',
                render: (objItem) => (
                    <InventoryActions
                        objEquipment={objItem}
                        onInspect={(objSelected) => void _openInspection(objSelected)}
                    />
                ),
            },
        ],
        [],
    );

    if (blnIsLoadingOptions && !strActiveProgram)
    {
        return (
            <div className="grid min-h-[60vh] place-items-center">
                <div className="text-center">
                    <LoaderCircle className="mx-auto size-8 animate-spin text-[#0f53b7]" />
                    <p className="mt-3 text-sm font-bold text-slate-600">
                        Preparing equipment inventory…
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <AdminPageHeader
                objAction={
                    strActiveProgram ? (
                        <div className="flex flex-wrap gap-2">
                            <button
                                className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#0f53b7] bg-white px-4 text-sm font-bold text-[#0f53b7] shadow-sm transition hover:bg-blue-50"
                                onClick={() => setBlnPrintOpen(true)}
                                type="button"
                            >
                                <Printer className="size-4" />
                                Print QR Sheet
                            </button>
                            <button
                                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0f53b7] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#0b3f8b]"
                                onClick={() => setBlnScannerOpen(true)}
                                type="button"
                            >
                                <Camera className="size-4" />
                                Scan Asset QR
                            </button>
                            <button
                                className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#0f53b7] bg-white px-4 text-sm font-bold text-[#0f53b7] shadow-sm transition hover:bg-blue-50"
                                onClick={() => setBlnRegistrationOpen(true)}
                                type="button"
                            >
                                <Plus className="size-4" />
                                Register Equipment
                            </button>
                        </div>
                    ) : null
                }
                txtDescription="Register QR-tagged assets, record DOST inspections, and print physical equipment labels."
                strEyebrow="Asset Accountability"
                title="Equipment Inventory"
            />

            {objOptions.programs.length > 1 ? (
                <nav
                    aria-label="Equipment program"
                    className="inline-flex rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm"
                >
                    {objOptions.programs.map((strProgram) =>
                    {
                        const blnSelected = strActiveProgram === strProgram;
                        return (
                            <button
                                aria-current={blnSelected ? 'page' : undefined}
                                className={cn(
                                    'min-w-32 rounded-xl px-5 py-2.5 text-sm font-black transition',
                                    blnSelected
                                        ? 'bg-[#0f53b7] text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-[#0f53b7]',
                                )}
                                key={strProgram}
                                onClick={() => setStrActiveProgram(strProgram)}
                                type="button"
                            >
                                {strProgram}
                                <span
                                    className={cn(
                                        'ml-2 rounded-full px-2 py-0.5 text-[10px]',
                                        blnSelected ? 'bg-white/20' : 'bg-slate-100',
                                    )}
                                >
                                    {objStatisticsByProgram[strProgram].total_equipment}
                                </span>
                            </button>
                        );
                    })}
                </nav>
            ) : null}

            {strActiveProgram ? (
                <>
                    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <MetricCard
                            strDetail={`Registered ${strActiveProgram} QR-tagged assets`}
                            icon={Boxes}
                            strLabel="Total Equipment"
                            value={String(objStatistics.total_equipment)}
                        />
                        <MetricCard
                            strDetail="Assigned or issued to cooperators"
                            icon={PackageCheck}
                            strLabel="Currently Issued"
                            strTone="sky"
                            value={String(objStatistics.currently_issued)}
                        />
                        <MetricCard
                            strDetail="Latest inspection verified as good"
                            icon={CircleCheck}
                            strLabel="Good Condition"
                            strTone="green"
                            value={String(objStatistics.good_condition)}
                        />
                        <MetricCard
                            strDetail="Fair, poor, or non-functional"
                            icon={Wrench}
                            strLabel="Condition Alerts"
                            strTone="red"
                            value={String(objStatistics.condition_alerts)}
                        />
                    </section>

                    <AdminPanel
                        txtDescription={`${arrEquipment.length} filtered ${strActiveProgram} equipment records shown.`}
                        title={`${strActiveProgram} equipment registry`}
                    >
                        {strLoadError ? (
                            <div
                                className="flex flex-col gap-3 border-b border-rose-100 bg-rose-50 px-5 py-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between"
                                role="alert"
                            >
                                <p className="font-semibold">{strLoadError}</p>
                                <button
                                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-white px-3 text-xs font-bold text-rose-700 shadow-sm"
                                    onClick={() => void _loadEquipment(strActiveProgram)}
                                    type="button"
                                >
                                    <RefreshCw className="size-3.5" />
                                    Retry
                                </button>
                            </div>
                        ) : null}
                        <DataTable
                            arrColumns={arrColumns}
                            arrData={arrEquipment}
                            txtEmptyDescription={`No ${strActiveProgram} equipment matches the selected category and condition.`}
                            strEmptyTitle={`No ${strActiveProgram} equipment found`}
                            blnFitColumns
                            getRowKey={(objItem) => objItem.id}
                            intInitialRowsPerPage={6}
                            blnIsLoading={blnIsLoading}
                            key={strActiveProgram}
                            strSearchPlaceholder={`Search ${strActiveProgram} equipment, asset ID, project, cooperator, or location…`}
                            searchText={(objItem) =>
                                `${objItem.id} ${objItem.propertyNumber} ${objItem.name} ${objItem.serialNumber} ${objItem.projectId} ${objItem.projectTitle} ${objItem.assignedTo} ${objItem.location} ${objItem.category} ${objItem.condition}`
                            }
                            objToolbar={
                                <>
                                    <AdminSelect
                                        strLabel="Filter by category"
                                        onChange={(strValue) =>
                                            _updateFilter('categoryId', strValue)
                                        }
                                        arrOptions={[
                                            { label: 'All categories', value: 'all' },
                                            ...objOptions.categories.map((objCategory) => ({
                                                label: objCategory.category_name,
                                                value: String(objCategory.id),
                                            })),
                                        ]}
                                        value={objActiveFilters.categoryId}
                                    />
                                    <AdminSelect
                                        strLabel="Filter by condition"
                                        onChange={(strValue) =>
                                            _updateFilter('condition', strValue)
                                        }
                                        arrOptions={[
                                            { label: 'All conditions', value: 'all' },
                                            { label: 'Good', value: 'GOOD' },
                                            { label: 'Fair', value: 'FAIR' },
                                            { label: 'Poor', value: 'POOR' },
                                            { label: 'Non-functional', value: 'NON_FUNCTIONAL' },
                                        ]}
                                        value={objActiveFilters.condition}
                                    />
                                </>
                            }
                            strVariant="clean"
                        />
                    </AdminPanel>
                </>
            ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
                    <p className="font-bold text-amber-900">
                        Your account has no assigned equipment program.
                    </p>
                    <p className="mt-1 text-sm text-amber-700">
                        Ask an administrator to assign SETUP or GIA access.
                    </p>
                </div>
            )}

            {strActiveProgram && blnRegistrationOpen ? (
                <EquipmentRegistrationModal
                    onClose={() => setBlnRegistrationOpen(false)}
                    onSaved={_handleRegistrationSaved}
                    objOptions={objOptions}
                    strProgram={strActiveProgram}
                />
            ) : null}
            {strActiveProgram && blnPrintOpen ? (
                <QrStickerSheetModal
                    arrEquipment={objEquipmentByProgram[strActiveProgram]}
                    onClose={() => setBlnPrintOpen(false)}
                    strProgram={strActiveProgram}
                />
            ) : null}
            {blnScannerOpen ? (
                <Suspense
                    fallback={
                        <ModalShell
                            txtDescription="Preparing secure camera access…"
                            onClose={() => setBlnScannerOpen(false)}
                            title="Scan Asset QR Code"
                            strWidth="md"
                        >
                            <div className="grid min-h-72 place-items-center text-center">
                                <div>
                                    <LoaderCircle className="mx-auto size-8 animate-spin text-[#0f53b7]" />
                                    <p className="mt-3 text-sm font-bold text-slate-700">
                                        Loading scanner…
                                    </p>
                                </div>
                            </div>
                        </ModalShell>
                    }
                >
                    <QrScannerModal
                        onAssetResolved={(objAsset) =>
                        {
                            setBlnScannerOpen(false);
                            setObjInspectionAsset(objAsset);
                        }}
                        onClose={() => setBlnScannerOpen(false)}
                    />
                </Suspense>
            ) : null}
            {objInspectionAsset ? (
                <InspectionLogModal
                    objAsset={objInspectionAsset}
                    onClose={() => setObjInspectionAsset(null)}
                    onSaved={_handleInspectionSaved}
                />
            ) : null}
        </div>
    ); // end return
} /* end InventoryPage */
