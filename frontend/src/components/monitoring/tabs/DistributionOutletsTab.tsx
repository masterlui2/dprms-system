/**
 * System: DPRMS
 * Purpose: Render distribution outlets tab for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { Copy, Globe2, Plus, ShoppingBag, Trash2, Truck, Users } from 'lucide-react';
import type {
    MarketOutletItem,
    SetupMonitoringQuarterRecord,
    WorkerCount,
} from '../../../types/setup_monitoring';
import { quarterStartIsoDate } from '../../../utils/monitoring_date';

interface Props
{
    objRecord: SetupMonitoringQuarterRecord;
    onChange: (objRecord: SetupMonitoringQuarterRecord) => void;
    blnReadOnly?: boolean;
}

/** Render distribution outlets tab and its available actions. */
export function DistributionOutletsTab({ objRecord, onChange, blnReadOnly = false }: Props)
{
    // 1. International
    const _handleUpdateIntl = (strId: string, strField: keyof MarketOutletItem, objValue: any) =>
    {
        const arrUpdated = objRecord.internationalMarkets.map((objItem) =>
        {
            if (objItem.id !== strId)
            {
                return objItem;
            }
            return { ...objItem, [strField]: objValue };
        });
        onChange({ ...objRecord, internationalMarkets: arrUpdated });
    };

    /** Handle add international. */
    const _handleAddInternational = () =>
    {
        const objNewItem: MarketOutletItem = {
            id: 'intl_' + Date.now(),
            marketType: 'INTERNATIONAL',
            marketName: 'NEW INTERNATIONAL CLIENT',
            address: 'Country/Port',
            condition: 'NEW',
            effectivityDate: quarterStartIsoDate(objRecord.year, objRecord.quarter),
            contactPerson: 'Trade Agent',
            productServiceSold: 'Processed Goods',
            volumeDelivered: '500 kg',
        };
        onChange({
            ...objRecord,
            internationalMarkets: [...objRecord.internationalMarkets, objNewItem],
        });
    };

    /** Handle duplicate intl. */
    const _handleDuplicateIntl = (strId: string) =>
    {
        const objTarget = objRecord.internationalMarkets.find((objItem) => objItem.id === strId);
        if (!objTarget)
        {
            return;
        }
        const objDup: MarketOutletItem = {
            ...objTarget,
            id: 'intl_' + Date.now(),
            marketName: `${objTarget.marketName} (Copy)`,
        };
        const intIndex = objRecord.internationalMarkets.findIndex(
            (objItem) => objItem.id === strId,
        );
        const arrNewItems = [...objRecord.internationalMarkets];
        arrNewItems.splice(intIndex + 1, 0, objDup);
        onChange({ ...objRecord, internationalMarkets: arrNewItems });
    };

    /** Handle remove intl. */
    const _handleRemoveIntl = (strId: string) =>
    {
        onChange({
            ...objRecord,
            internationalMarkets: objRecord.internationalMarkets.filter(
                (objItem) => objItem.id !== strId,
            ),
        });
    };

    // 2. Local
    /** Handle update local. */
    const _handleUpdateLocal = (strId: string, strField: keyof MarketOutletItem, objValue: any) =>
    {
        const arrUpdated = objRecord.localMarkets.map((objItem) =>
        {
            if (objItem.id !== strId)
            {
                return objItem;
            }
            return { ...objItem, [strField]: objValue };
        });
        onChange({ ...objRecord, localMarkets: arrUpdated });
    };

    /** Handle add local. */
    const _handleAddLocal = () =>
    {
        const objNewItem: MarketOutletItem = {
            id: 'loc_' + Date.now(),
            marketType: 'LOCAL',
            marketName: 'NEW LOCAL OUTLET',
            address: 'City/Municipality',
            condition: 'NEW',
            effectivityDate: quarterStartIsoDate(objRecord.year, objRecord.quarter),
            contactPerson: 'Store Manager',
            productServiceSold: 'Goods',
            volumeDelivered: '200 units',
        };
        onChange({ ...objRecord, localMarkets: [...objRecord.localMarkets, objNewItem] });
    };

    /** Handle duplicate local. */
    const _handleDuplicateLocal = (strId: string) =>
    {
        const objTarget = objRecord.localMarkets.find((objItem) => objItem.id === strId);
        if (!objTarget)
        {
            return;
        }
        const objDup: MarketOutletItem = {
            ...objTarget,
            id: 'loc_' + Date.now(),
            marketName: `${objTarget.marketName} (Copy)`,
        };
        const intIndex = objRecord.localMarkets.findIndex((objItem) => objItem.id === strId);
        const arrNewItems = [...objRecord.localMarkets];
        arrNewItems.splice(intIndex + 1, 0, objDup);
        onChange({ ...objRecord, localMarkets: arrNewItems });
    };

    /** Handle remove local. */
    const _handleRemoveLocal = (strId: string) =>
    {
        onChange({
            ...objRecord,
            localMarkets: objRecord.localMarkets.filter((objItem) => objItem.id !== strId),
        });
    };

    // 3. Distributors
    const _handleUpdateDistributor = (
        strId: string,
        strField: keyof WorkerCount,
        objValue: any,
    ) =>
    {
        const arrUpdated = objRecord.forwardDistributors.map((objItem) =>
        {
            if (objItem.id !== strId)
            {
                return objItem;
            }
            const objCopy = { ...objItem, [strField]: objValue };
            if (strField === 'male' || strField === 'female')
            {
                const intItem = strField === 'male' ? Number(objValue) || 0 : objItem.male;
                const intF = strField === 'female' ? Number(objValue) || 0 : objItem.female;
                objCopy.total = intItem + intF;
            }
            return objCopy;
        });
        onChange({ ...objRecord, forwardDistributors: arrUpdated });
    };

    /** Handle add distributor. */
    const _handleAddDistributor = () =>
    {
        const objNewItem: WorkerCount = {
            id: 'dist_' + Date.now(),
            name: 'NEW DISTRIBUTOR ENTITY',
            male: 2,
            female: 1,
            total: 3,
        };
        onChange({
            ...objRecord,
            forwardDistributors: [...objRecord.forwardDistributors, objNewItem],
        });
    };

    /** Handle duplicate distributor. */
    const _handleDuplicateDistributor = (strId: string) =>
    {
        const objTarget = objRecord.forwardDistributors.find((objItem) => objItem.id === strId);
        if (!objTarget)
        {
            return;
        }
        const objDup: WorkerCount = {
            ...objTarget,
            id: 'dist_' + Date.now(),
            name: `${objTarget.name} (Copy)`,
        };
        const intIndex = objRecord.forwardDistributors.findIndex((objItem) => objItem.id === strId);
        const arrNewItems = [...objRecord.forwardDistributors];
        arrNewItems.splice(intIndex + 1, 0, objDup);
        onChange({ ...objRecord, forwardDistributors: arrNewItems });
    };

    /** Handle remove distributor. */
    const _handleRemoveDistributor = (strId: string) =>
    {
        onChange({
            ...objRecord,
            forwardDistributors: objRecord.forwardDistributors.filter(
                (objItem) => objItem.id !== strId,
            ),
        });
    };

    // 4. Suppliers
    const _handleUpdateSupplier = (strId: string, strField: keyof WorkerCount, objValue: any) =>
    {
        const arrUpdated = objRecord.forwardSuppliers.map((objItem) =>
        {
            if (objItem.id !== strId)
            {
                return objItem;
            }
            const objCopy = { ...objItem, [strField]: objValue };
            if (strField === 'male' || strField === 'female')
            {
                const intItem = strField === 'male' ? Number(objValue) || 0 : objItem.male;
                const intF = strField === 'female' ? Number(objValue) || 0 : objItem.female;
                objCopy.total = intItem + intF;
            }
            return objCopy;
        });
        onChange({ ...objRecord, forwardSuppliers: arrUpdated });
    };

    /** Handle add supplier. */
    const _handleAddSupplier = () =>
    {
        const objNewItem: WorkerCount = {
            id: 'sup_' + Date.now(),
            name: 'NEW RAW MATERIAL SUPPLIER',
            male: 3,
            female: 2,
            total: 5,
        };
        onChange({ ...objRecord, forwardSuppliers: [...objRecord.forwardSuppliers, objNewItem] });
    };

    /** Handle duplicate supplier. */
    const _handleDuplicateSupplier = (strId: string) =>
    {
        const objTarget = objRecord.forwardSuppliers.find((objItem) => objItem.id === strId);
        if (!objTarget)
        {
            return;
        }
        const objDup: WorkerCount = {
            ...objTarget,
            id: 'sup_' + Date.now(),
            name: `${objTarget.name} (Copy)`,
        };
        const intIndex = objRecord.forwardSuppliers.findIndex((objItem) => objItem.id === strId);
        const arrNewItems = [...objRecord.forwardSuppliers];
        arrNewItems.splice(intIndex + 1, 0, objDup);
        onChange({ ...objRecord, forwardSuppliers: arrNewItems });
    };

    /** Handle remove supplier. */
    const _handleRemoveSupplier = (strId: string) =>
    {
        onChange({
            ...objRecord,
            forwardSuppliers: objRecord.forwardSuppliers.filter((objItem) => objItem.id !== strId),
        });
    };

    const intTotalDistributorStaff = objRecord.forwardDistributors.reduce(
        (intAccumulator, objItem) => intAccumulator + (objItem.total || 0),
        0,
    );
    const intTotalSupplierStaff = objRecord.forwardSuppliers.reduce(
        (intAccumulator, objItem) => intAccumulator + (objItem.total || 0),
        0,
    );

    return (
        <div className="space-y-8 font-sans">
            {/* 1. INTERNATIONAL MARKET (EXCEL PAGE 5) */}
            <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between bg-[#285497] px-6 py-4 text-white">
                    <div className="flex items-center gap-2.5">
                        <Globe2 className="size-5 text-white" />
                        <div>
                            <h3 className="text-base font-bold tracking-wide text-white">
                                MARKET OUTLETS — INTERNATIONAL MARKET
                            </h3>
                            <p className="text-xs text-blue-100 font-normal">
                                Overseas retail buyers, institutional export accounts, and
                                cross-border distribution channels
                            </p>
                        </div>
                    </div>
                    {!blnReadOnly && (
                        <button
                            type="button"
                            onClick={_handleAddInternational}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-xs font-bold text-[#285497] shadow-sm transition hover:bg-[#E6EEF4] active:scale-95"
                        >
                            <Plus className="size-3.5 text-[#285497]" />
                            <span>Add Row</span>
                        </button>
                    )}
                </div>{' '}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-white border-b border-[#B5BFCD] text-[11px] font-bold uppercase tracking-wider text-[#285497]">
                            <tr>
                                <th className="py-3 px-3 w-1/4">
                                    International Market (Write in full)
                                </th>
                                <th className="py-3 px-2 w-1/5">Address</th>
                                <th className="py-3 px-2 text-center w-28">Condition (Old/New)</th>
                                <th className="py-3 px-2 w-32">Effectivity Date</th>
                                <th className="py-3 px-2">Contact Person</th>
                                <th className="py-3 px-2">Product/Service</th>
                                <th className="py-3 px-2">Volume Delivered</th>
                                {!blnReadOnly && <th className="py-3 px-2 w-14"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#B5BFCD]/30 text-slate-800">
                            {objRecord.internationalMarkets.map((objItem) => (
                                <tr
                                    key={objItem.id}
                                    className="hover:bg-[#E6EEF4]/30 transition group"
                                >
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            value={objItem.marketName}
                                            onChange={(objEvent) =>
                                                _handleUpdateIntl(
                                                    objItem.id,
                                                    'marketName',
                                                    objEvent.target.value,
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-1">
                                        <input
                                            type="text"
                                            value={objItem.address}
                                            onChange={(objEvent) =>
                                                _handleUpdateIntl(
                                                    objItem.id,
                                                    'address',
                                                    objEvent.target.value,
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-700 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-1 text-center">
                                        <select
                                            value={objItem.condition}
                                            onChange={(objEvent) =>
                                                _handleUpdateIntl(
                                                    objItem.id,
                                                    'condition',
                                                    objEvent.target.value as any,
                                                )
                                            }
                                            disabled={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-1.5 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        >
                                            <option value="OLD">Old (&gt;3 mos)</option>
                                            <option value="NEW">New</option>
                                        </select>
                                    </td>
                                    <td className="p-1">
                                        <input
                                            type="date"
                                            value={objItem.effectivityDate || ''}
                                            onChange={(objEvent) =>
                                                _handleUpdateIntl(
                                                    objItem.id,
                                                    'effectivityDate',
                                                    objEvent.target.value,
                                                )
                                            }
                                            required
                                            readOnly={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-700 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-1">
                                        <input
                                            type="text"
                                            value={objItem.contactPerson}
                                            onChange={(objEvent) =>
                                                _handleUpdateIntl(
                                                    objItem.id,
                                                    'contactPerson',
                                                    objEvent.target.value,
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-1">
                                        <input
                                            type="text"
                                            value={objItem.productServiceSold}
                                            onChange={(objEvent) =>
                                                _handleUpdateIntl(
                                                    objItem.id,
                                                    'productServiceSold',
                                                    objEvent.target.value,
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-1">
                                        <input
                                            type="text"
                                            value={objItem.volumeDelivered}
                                            onChange={(objEvent) =>
                                                _handleUpdateIntl(
                                                    objItem.id,
                                                    'volumeDelivered',
                                                    objEvent.target.value,
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    {!blnReadOnly && (
                                        <td className="p-1 text-right w-14">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => _handleDuplicateIntl(objItem.id)}
                                                    title="Duplicate row"
                                                    className="rounded-md p-1 text-slate-500 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
                                                >
                                                    <Copy className="size-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => _handleRemoveIntl(objItem.id)}
                                                    title="Delete row"
                                                    className="rounded-md p-1 text-red-500 hover:bg-red-50 hover:text-red-700 transition"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 2. LOCAL MARKET (EXCEL PAGE 5) */}
            <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between bg-[#285497] px-6 py-4 text-white">
                    <div className="flex items-center gap-2.5">
                        <ShoppingBag className="size-5 text-white" />
                        <div>
                            <h3 className="text-base font-bold tracking-wide text-white">
                                MARKET OUTLETS — LOCAL MARKET
                            </h3>
                            <p className="text-xs text-blue-100 font-normal">
                                Local supermarket chains, pasalubong centers, provincial hubs, and
                                direct display centers
                            </p>
                        </div>
                    </div>
                    {!blnReadOnly && (
                        <button
                            type="button"
                            onClick={_handleAddLocal}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-xs font-bold text-[#285497] shadow-sm transition hover:bg-[#E6EEF4] active:scale-95"
                        >
                            <Plus className="size-3.5 text-[#285497]" />
                            <span>Add Row</span>
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-white border-b border-[#B5BFCD] text-[11px] font-bold uppercase tracking-wider text-[#285497]">
                            <tr>
                                <th className="py-3 px-3 w-1/4">Local Market (Write in full)</th>
                                <th className="py-3 px-2 w-1/5">Address</th>
                                <th className="py-3 px-2 text-center w-28">Condition (Old/New)</th>
                                <th className="py-3 px-2 w-32">Effectivity Date</th>
                                <th className="py-3 px-2">Contact Person</th>
                                <th className="py-3 px-2">Product/Service</th>
                                <th className="py-3 px-2">Volume Delivered</th>
                                {!blnReadOnly && <th className="py-3 px-2 w-14"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#B5BFCD]/30 text-slate-800">
                            {objRecord.localMarkets.map((objItem) => (
                                <tr
                                    key={objItem.id}
                                    className="hover:bg-[#E6EEF4]/30 transition group"
                                >
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            value={objItem.marketName}
                                            onChange={(objEvent) =>
                                                _handleUpdateLocal(
                                                    objItem.id,
                                                    'marketName',
                                                    objEvent.target.value,
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-1">
                                        <input
                                            type="text"
                                            value={objItem.address}
                                            onChange={(objEvent) =>
                                                _handleUpdateLocal(
                                                    objItem.id,
                                                    'address',
                                                    objEvent.target.value,
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-700 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-1 text-center">
                                        <select
                                            value={objItem.condition}
                                            onChange={(objEvent) =>
                                                _handleUpdateLocal(
                                                    objItem.id,
                                                    'condition',
                                                    objEvent.target.value as any,
                                                )
                                            }
                                            disabled={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-1.5 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        >
                                            <option value="OLD">Old (&gt;3 mos)</option>
                                            <option value="NEW">New</option>
                                        </select>
                                    </td>
                                    <td className="p-1">
                                        <input
                                            type="date"
                                            value={objItem.effectivityDate || ''}
                                            onChange={(objEvent) =>
                                                _handleUpdateLocal(
                                                    objItem.id,
                                                    'effectivityDate',
                                                    objEvent.target.value,
                                                )
                                            }
                                            required
                                            readOnly={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-700 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-1">
                                        <input
                                            type="text"
                                            value={objItem.contactPerson}
                                            onChange={(objEvent) =>
                                                _handleUpdateLocal(
                                                    objItem.id,
                                                    'contactPerson',
                                                    objEvent.target.value,
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-1">
                                        <input
                                            type="text"
                                            value={objItem.productServiceSold}
                                            onChange={(objEvent) =>
                                                _handleUpdateLocal(
                                                    objItem.id,
                                                    'productServiceSold',
                                                    objEvent.target.value,
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-1">
                                        <input
                                            type="text"
                                            value={objItem.volumeDelivered}
                                            onChange={(objEvent) =>
                                                _handleUpdateLocal(
                                                    objItem.id,
                                                    'volumeDelivered',
                                                    objEvent.target.value,
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    {!blnReadOnly && (
                                        <td className="p-1 text-right w-14">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        _handleDuplicateLocal(objItem.id)
                                                    }
                                                    title="Duplicate row"
                                                    className="rounded-md p-1 text-slate-500 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
                                                >
                                                    <Copy className="size-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => _handleRemoveLocal(objItem.id)}
                                                    title="Delete row"
                                                    className="rounded-md p-1 text-red-500 hover:bg-red-50 hover:text-red-700 transition"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 3. FORWARD LINKAGES (DISTRIBUTORS & SUPPLIERS - EXCEL PAGE 7) */}
            <div className="grid gap-6 lg:grid-cols-2 items-start">
                {/* Forward Distributors */}
                <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white shadow-sm overflow-hidden">
                    <div>
                        <div className="flex items-center justify-between bg-[#285497] px-5 py-3.5 text-white">
                            <div className="flex items-center gap-2">
                                <Truck className="size-4.5 text-white" />
                                <h4 className="text-sm font-bold tracking-wide text-white">
                                    FORWARD LINKAGE — DISTRIBUTORS
                                </h4>
                            </div>
                            {!blnReadOnly && (
                                <button
                                    type="button"
                                    onClick={_handleAddDistributor}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-xs font-bold text-[#285497] shadow-sm transition hover:bg-[#E6EEF4] active:scale-95"
                                >
                                    <Plus className="size-3.5 text-[#285497]" />
                                    <span>Add Row</span>
                                </button>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-white border-b border-[#B5BFCD] text-[11px] font-bold uppercase tracking-wider text-[#285497]">
                                    <tr>
                                        <th className="py-3 px-3">Name of Distributor</th>
                                        <th className="py-3 px-2 text-right w-20">Male</th>
                                        <th className="py-3 px-2 text-right w-20">Female</th>
                                        <th className="py-3 px-3 text-right w-24">Total</th>
                                        {!blnReadOnly && <th className="py-3 px-2 w-14"></th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#B5BFCD]/30">
                                    {objRecord.forwardDistributors.map((objItem) => (
                                        <tr
                                            key={objItem.id}
                                            className="hover:bg-[#E6EEF4]/30 transition group"
                                        >
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    value={objItem.name}
                                                    onChange={(objEvent) =>
                                                        _handleUpdateDistributor(
                                                            objItem.id,
                                                            'name',
                                                            objEvent.target.value,
                                                        )
                                                    }
                                                    readOnly={blnReadOnly}
                                                    className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 font-normal text-slate-800 text-xs focus:border-[#285497] focus:outline-none"
                                                />
                                            </td>
                                            <td className="p-1 text-right">
                                                <input
                                                    type="number"
                                                    value={objItem.male}
                                                    onChange={(objEvent) =>
                                                        _handleUpdateDistributor(
                                                            objItem.id,
                                                            'male',
                                                            Number(objEvent.target.value),
                                                        )
                                                    }
                                                    readOnly={blnReadOnly}
                                                    className="h-8 w-16 ml-auto rounded-lg border border-[#B5BFCD] bg-white px-1 text-right font-normal text-slate-800 text-xs focus:border-[#285497] focus:outline-none"
                                                />
                                            </td>
                                            <td className="p-1 text-right">
                                                <input
                                                    type="number"
                                                    value={objItem.female}
                                                    onChange={(objEvent) =>
                                                        _handleUpdateDistributor(
                                                            objItem.id,
                                                            'female',
                                                            Number(objEvent.target.value),
                                                        )
                                                    }
                                                    readOnly={blnReadOnly}
                                                    className="h-8 w-16 ml-auto rounded-lg border border-[#B5BFCD] bg-white px-1 text-right font-normal text-slate-800 text-xs focus:border-[#285497] focus:outline-none"
                                                />
                                            </td>
                                            <td className="p-2 text-right font-black text-[#285497] text-xs">
                                                {objItem.total}
                                            </td>
                                            {!blnReadOnly && (
                                                <td className="p-1 text-right w-14">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                _handleDuplicateDistributor(
                                                                    objItem.id,
                                                                )
                                                            }
                                                            title="Duplicate row"
                                                            className="rounded-md p-1 text-slate-500 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
                                                        >
                                                            <Copy className="size-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                _handleRemoveDistributor(objItem.id)
                                                            }
                                                            title="Delete row"
                                                            className="rounded-md p-1 text-red-500 hover:bg-red-50 hover:text-red-700 transition"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-white border-t-2 border-[#B5BFCD] font-bold">
                                        <td
                                            className="py-3 px-3 text-xs uppercase text-[#285497] font-black"
                                            colSpan={3}
                                        >
                                            TOTAL (Distributor Workforce)
                                        </td>
                                        <td className="py-3 px-3 text-right font-black text-[#285497] text-xs">
                                            {intTotalDistributorStaff}
                                        </td>
                                        {!blnReadOnly && <td className="py-3 px-2 w-14"></td>}
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Raw Material Suppliers */}
                <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white shadow-sm overflow-hidden">
                    <div>
                        <div className="flex items-center justify-between bg-[#285497] px-5 py-3.5 text-white">
                            <div className="flex items-center gap-2">
                                <Users className="size-4.5 text-white" />
                                <h4 className="text-sm font-bold tracking-wide text-white">
                                    BACKWARD LINKAGE — RAW MATERIAL SUPPLIERS
                                </h4>
                            </div>
                            {!blnReadOnly && (
                                <button
                                    type="button"
                                    onClick={_handleAddSupplier}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-xs font-bold text-[#285497] shadow-sm transition hover:bg-[#E6EEF4] active:scale-95"
                                >
                                    <Plus className="size-3.5 text-[#285497]" />
                                    <span>Add Row</span>
                                </button>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-white border-b border-[#B5BFCD] text-[11px] font-bold uppercase tracking-wider text-[#285497]">
                                    <tr>
                                        <th className="py-3 px-3">Name of Supplier</th>
                                        <th className="py-3 px-2 text-right w-20">Male</th>
                                        <th className="py-3 px-2 text-right w-20">Female</th>
                                        <th className="py-3 px-3 text-right w-24">Total</th>
                                        {!blnReadOnly && <th className="py-3 px-2 w-14"></th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#B5BFCD]/30">
                                    {objRecord.forwardSuppliers.map((objItem) => (
                                        <tr
                                            key={objItem.id}
                                            className="hover:bg-[#E6EEF4]/30 transition group"
                                        >
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    value={objItem.name}
                                                    onChange={(objEvent) =>
                                                        _handleUpdateSupplier(
                                                            objItem.id,
                                                            'name',
                                                            objEvent.target.value,
                                                        )
                                                    }
                                                    readOnly={blnReadOnly}
                                                    className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 font-normal text-slate-800 text-xs focus:border-[#285497] focus:outline-none"
                                                />
                                            </td>
                                            <td className="p-1 text-right">
                                                <input
                                                    type="number"
                                                    value={objItem.male}
                                                    onChange={(objEvent) =>
                                                        _handleUpdateSupplier(
                                                            objItem.id,
                                                            'male',
                                                            Number(objEvent.target.value),
                                                        )
                                                    }
                                                    readOnly={blnReadOnly}
                                                    className="h-8 w-16 ml-auto rounded-lg border border-[#B5BFCD] bg-white px-1 text-right font-normal text-slate-800 text-xs focus:border-[#285497] focus:outline-none"
                                                />
                                            </td>
                                            <td className="p-1 text-right">
                                                <input
                                                    type="number"
                                                    value={objItem.female}
                                                    onChange={(objEvent) =>
                                                        _handleUpdateSupplier(
                                                            objItem.id,
                                                            'female',
                                                            Number(objEvent.target.value),
                                                        )
                                                    }
                                                    readOnly={blnReadOnly}
                                                    className="h-8 w-16 ml-auto rounded-lg border border-[#B5BFCD] bg-white px-1 text-right font-normal text-slate-800 text-xs focus:border-[#285497] focus:outline-none"
                                                />
                                            </td>
                                            <td className="p-2 text-right font-black text-[#285497] text-xs">
                                                {objItem.total}
                                            </td>
                                            {!blnReadOnly && (
                                                <td className="p-1 text-right w-14">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                _handleDuplicateSupplier(objItem.id)
                                                            }
                                                            title="Duplicate row"
                                                            className="rounded-md p-1 text-slate-500 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
                                                        >
                                                            <Copy className="size-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                _handleRemoveSupplier(objItem.id)
                                                            }
                                                            title="Delete row"
                                                            className="rounded-md p-1 text-red-500 hover:bg-red-50 hover:text-red-700 transition"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-white border-t-2 border-[#B5BFCD] font-bold">
                                        <td
                                            className="py-3 px-3 text-xs uppercase text-[#285497] font-black"
                                            colSpan={3}
                                        >
                                            TOTAL (Supplier Workforce)
                                        </td>
                                        <td className="py-3 px-3 text-right font-black text-[#285497] text-xs">
                                            {intTotalSupplierStaff}
                                        </td>
                                        {!blnReadOnly && <td className="py-3 px-2 w-14"></td>}
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    ); // end return
} /* end DistributionOutletsTab */
