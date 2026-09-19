/**
 * System: DPRMS
 * Purpose: Render assets tab for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { Building2, Coins, Copy, Cpu, Plus, Trash2 } from 'lucide-react';
import
{
    calculateBuildingBookValue,
    calculateBuildingDepreciation,
    calculateEquipmentBookValue,
    calculateEquipmentDepreciation,
} from '../../../services/setup_monitoring_store';
import type {
    BuildingAsset,
    EquipmentAsset,
    SetupMonitoringQuarterRecord,
    WorkingCapitalItem,
} from '../../../types/setup_monitoring';

interface Props
{
    objRecord: SetupMonitoringQuarterRecord;
    onChange: (objRecord: SetupMonitoringQuarterRecord) => void;
    blnReadOnly?: boolean;
}

/** Render assets tab and its available actions. */
export function AssetsTab({ objRecord, onChange, blnReadOnly = false }: Props)
{
    // Buildings
    /** Handle update building. */
    const _handleUpdateBuilding = (strId: string, strField: keyof BuildingAsset, objValue: any) =>
    {
        const arrUpdated = objRecord.buildingAssets.map((objItem) =>
        {
            if (objItem.id !== strId)
            {
                return objItem;
            }
            const objCopy = { ...objItem, [strField]: objValue };
            if (
                strField === 'cost' ||
                strField === 'usefulLifeYears' ||
                strField === 'yearAcquired'
            )
            {
                const intItem = strField === 'cost' ? Number(objValue) || 0 : objItem.cost;
                const intLife =
                    strField === 'usefulLifeYears'
                        ? Number(objValue) || 0
                        : objItem.usefulLifeYears;
                const intYr =
                    strField === 'yearAcquired' ? Number(objValue) || 0 : objItem.yearAcquired;
                objCopy.depreciation = calculateBuildingDepreciation(intItem, intLife);
                objCopy.bookValue = calculateBuildingBookValue(intItem, intLife, intYr);
            }
            return objCopy;
        });
        onChange({ ...objRecord, buildingAssets: arrUpdated });
    };

    /** Handle add building. */
    const _handleAddBuilding = () =>
    {
        const objNewItem: BuildingAsset = {
            id: 'bld_' + Date.now(),
            buildingName: 'NEW BUILDING ASSET',
            buildingType: 'Processing Facility',
            usefulLifeYears: 20,
            yearAcquired: 2024,
            cost: 0,
            depreciation: 0,
            bookValue: 0,
        };
        onChange({ ...objRecord, buildingAssets: [...objRecord.buildingAssets, objNewItem] });
    };

    /** Handle duplicate building. */
    const _handleDuplicateBuilding = (strId: string) =>
    {
        const objTarget = objRecord.buildingAssets.find((objItem) => objItem.id === strId);
        if (!objTarget)
        {
            return;
        }
        const objDup: BuildingAsset = {
            ...objTarget,
            id: 'bld_' + Date.now(),
            buildingName: `${objTarget.buildingName} (Copy)`,
        };
        const intIndex = objRecord.buildingAssets.findIndex((objItem) => objItem.id === strId);
        const arrNewItems = [...objRecord.buildingAssets];
        arrNewItems.splice(intIndex + 1, 0, objDup);
        onChange({ ...objRecord, buildingAssets: arrNewItems });
    };

    /** Handle remove building. */
    const _handleRemoveBuilding = (strId: string) =>
    {
        onChange({
            ...objRecord,
            buildingAssets: objRecord.buildingAssets.filter((objItem) => objItem.id !== strId),
        });
    };

    // Equipment
    /** Handle update equipment. */
    const _handleUpdateEquipment = (
        strId: string,
        strField: keyof EquipmentAsset,
        objValue: any,
    ) =>
    {
        const arrUpdated = objRecord.equipmentAssets.map((objItem) =>
        {
            if (objItem.id !== strId)
            {
                return objItem;
            }
            const objCopy = { ...objItem, [strField]: objValue };
            if (
                strField === 'cost' ||
                strField === 'usefulLifeYears' ||
                strField === 'yearAcquired'
            )
            {
                const intItem = strField === 'cost' ? Number(objValue) || 0 : objItem.cost;
                const intLife =
                    strField === 'usefulLifeYears'
                        ? Number(objValue) || 0
                        : objItem.usefulLifeYears;
                const intYr =
                    strField === 'yearAcquired' ? Number(objValue) || 0 : objItem.yearAcquired;
                objCopy.depreciation = calculateEquipmentDepreciation(intItem, intLife);
                objCopy.bookValue = calculateEquipmentBookValue(intItem, intLife, intYr);
            }
            return objCopy;
        });
        onChange({ ...objRecord, equipmentAssets: arrUpdated });
    };

    /** Handle add equipment. */
    const _handleAddEquipment = () =>
    {
        const objNewItem: EquipmentAsset = {
            id: 'eq_' + Date.now(),
            equipmentName: 'NEW EQUIPMENT ASSET',
            equipmentType: 'Production Machine',
            usefulLifeYears: 10,
            yearAcquired: 2024,
            cost: 0,
            depreciation: 0,
            bookValue: 0,
        };
        onChange({ ...objRecord, equipmentAssets: [...objRecord.equipmentAssets, objNewItem] });
    };

    /** Handle duplicate equipment. */
    const _handleDuplicateEquipment = (strId: string) =>
    {
        const objTarget = objRecord.equipmentAssets.find((objItem) => objItem.id === strId);
        if (!objTarget)
        {
            return;
        }
        const objDup: EquipmentAsset = {
            ...objTarget,
            id: 'eq_' + Date.now(),
            equipmentName: `${objTarget.equipmentName} (Copy)`,
        };
        const intIndex = objRecord.equipmentAssets.findIndex((objItem) => objItem.id === strId);
        const arrNewItems = [...objRecord.equipmentAssets];
        arrNewItems.splice(intIndex + 1, 0, objDup);
        onChange({ ...objRecord, equipmentAssets: arrNewItems });
    };

    /** Handle remove equipment. */
    const _handleRemoveEquipment = (strId: string) =>
    {
        onChange({
            ...objRecord,
            equipmentAssets: objRecord.equipmentAssets.filter((objItem) => objItem.id !== strId),
        });
    };

    // Working Capital
    const _handleUpdateWorkingCap = (
        strId: string,
        strField: keyof WorkingCapitalItem,
        objValue: any,
    ) =>
    {
        const arrUpdated = objRecord.workingCapital.map((objItem) =>
        {
            if (objItem.id !== strId)
            {
                return objItem;
            }
            return { ...objItem, [strField]: objValue };
        });
        onChange({ ...objRecord, workingCapital: arrUpdated });
    };

    /** Handle add working cap. */
    const _handleAddWorkingCap = () =>
    {
        const objNewItem: WorkingCapitalItem = {
            id: 'wc_' + Date.now(),
            particulars: 'NEW CAPITAL ITEM',
            amount: 50000,
        };
        onChange({ ...objRecord, workingCapital: [...objRecord.workingCapital, objNewItem] });
    };

    /** Handle duplicate working cap. */
    const _handleDuplicateWorkingCap = (strId: string) =>
    {
        const objTarget = objRecord.workingCapital.find((objItem) => objItem.id === strId);
        if (!objTarget)
        {
            return;
        }
        const objDup: WorkingCapitalItem = {
            ...objTarget,
            id: 'wc_' + Date.now(),
            particulars: `${objTarget.particulars} (Copy)`,
        };
        const intIndex = objRecord.workingCapital.findIndex((objItem) => objItem.id === strId);
        const arrNewItems = [...objRecord.workingCapital];
        arrNewItems.splice(intIndex + 1, 0, objDup);
        onChange({ ...objRecord, workingCapital: arrNewItems });
    };

    /** Handle remove working cap. */
    const _handleRemoveWorkingCap = (strId: string) =>
    {
        onChange({
            ...objRecord,
            workingCapital: objRecord.workingCapital.filter((objItem) => objItem.id !== strId),
        });
    };

    const curTotalBuildingCost = objRecord.buildingAssets.reduce(
        (intAccumulator, objRight) => intAccumulator + (objRight.cost || 0),
        0,
    );
    const intTotalBuildingBookValue = objRecord.buildingAssets.reduce(
        (intAccumulator, objRight) => intAccumulator + (objRight.bookValue || 0),
        0,
    );

    const curTotalEquipmentCost = objRecord.equipmentAssets.reduce(
        (intAccumulator, objEq) => intAccumulator + (objEq.cost || 0),
        0,
    );
    const intTotalEquipmentBookValue = objRecord.equipmentAssets.reduce(
        (intAccumulator, objEq) => intAccumulator + (objEq.bookValue || 0),
        0,
    );

    const intTotalWorkingCap = objRecord.workingCapital.reduce(
        (intAccumulator, objItem) => intAccumulator + (objItem.amount || 0),
        0,
    );

    return (
        <div className="space-y-8 font-sans">
            {/* 1. CURRENT ASSETS — BUILDING (EXCEL PAGE 4) */}
            <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between bg-[#285497] px-6 py-4 text-white">
                    <div className="flex items-center gap-2.5">
                        <Building2 className="size-5 text-white" />
                        <div>
                            <h3 className="text-base font-bold tracking-wide text-white">
                                CURRENT ASSETS — BUILDING
                            </h3>
                            <p className="text-xs text-blue-100 font-normal">
                                *Please refer to the attached document from COA. Formula:
                                Depreciation D = [C/A] · Book Value = C - ((YEAR NOW - B) * D)
                            </p>
                        </div>
                    </div>
                    {!blnReadOnly && (
                        <button
                            type="button"
                            onClick={_handleAddBuilding}
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
                                <th className="py-3 px-3 w-1/4">Building</th>
                                <th className="py-3 px-2 w-36">Type of Building*</th>
                                <th className="py-3 px-2 text-right w-24">Est. Useful Life (A)</th>
                                <th className="py-3 px-2 text-right w-24">Year Acquired (B)</th>
                                <th className="py-3 px-3 text-right w-32">Cost [C]</th>
                                <th className="py-3 px-3 text-right w-32">
                                    Depreciation D = [C/A]
                                </th>
                                <th className="py-3 px-3 text-right w-36">Book Value</th>
                                {!blnReadOnly && <th className="py-3 px-2 w-14"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#B5BFCD]/30 text-slate-800">
                            {objRecord.buildingAssets.map((objRight) => (
                                <tr
                                    key={objRight.id}
                                    className="hover:bg-[#E6EEF4]/30 transition group"
                                >
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            value={objRight.buildingName}
                                            onChange={(objEvent) =>
                                                _handleUpdateBuilding(
                                                    objRight.id,
                                                    'buildingName',
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
                                            value={objRight.buildingType}
                                            onChange={(objEvent) =>
                                                _handleUpdateBuilding(
                                                    objRight.id,
                                                    'buildingType',
                                                    objEvent.target.value,
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-1 text-right">
                                        <input
                                            type="number"
                                            value={objRight.usefulLifeYears}
                                            onChange={(objEvent) =>
                                                _handleUpdateBuilding(
                                                    objRight.id,
                                                    'usefulLifeYears',
                                                    Number(objEvent.target.value),
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-20 ml-auto rounded-lg border border-[#B5BFCD] bg-white px-2 text-right text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-1 text-right">
                                        <input
                                            type="number"
                                            value={objRight.yearAcquired}
                                            onChange={(objEvent) =>
                                                _handleUpdateBuilding(
                                                    objRight.id,
                                                    'yearAcquired',
                                                    Number(objEvent.target.value),
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-20 ml-auto rounded-lg border border-[#B5BFCD] bg-white px-2 text-right text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-1 text-right">
                                        <input
                                            type="number"
                                            value={objRight.cost}
                                            onChange={(objEvent) =>
                                                _handleUpdateBuilding(
                                                    objRight.id,
                                                    'cost',
                                                    Number(objEvent.target.value),
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-right text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-2 text-right text-xs font-normal text-slate-600">
                                        ₱
                                        {(objRight.depreciation || 0).toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                        })}
                                    </td>
                                    <td className="p-2 text-right font-black text-[#285497] text-xs">
                                        ₱
                                        {(objRight.bookValue || 0).toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                        })}
                                    </td>
                                    {!blnReadOnly && (
                                        <td className="p-1 text-right w-14">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        _handleDuplicateBuilding(objRight.id)
                                                    }
                                                    title="Duplicate row"
                                                    className="rounded-md p-1 text-slate-500 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
                                                >
                                                    <Copy className="size-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        _handleRemoveBuilding(objRight.id)
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
                            <tr className="bg-white border-t-2 border-[#B5BFCD]">
                                <td
                                    className="py-3 px-3 font-black text-[#285497] uppercase tracking-wider text-xs"
                                    colSpan={4}
                                >
                                    TOTAL (Building)
                                </td>
                                <td className="py-3 px-3 text-right font-black text-[#285497] text-xs">
                                    ₱
                                    {curTotalBuildingCost.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                    })}
                                </td>
                                <td className="py-3 px-3 text-right text-xs font-bold text-slate-400">
                                    -
                                </td>
                                <td className="py-3 px-3 text-right font-black text-[#285497] text-xs">
                                    ₱
                                    {intTotalBuildingBookValue.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                    })}
                                </td>
                                {!blnReadOnly && <td className="py-3 px-2 w-14"></td>}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* 2. CURRENT ASSETS — EQUIPMENT (EXCEL PAGE 4) */}
            <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between bg-[#285497] px-6 py-4 text-white">
                    <div className="flex items-center gap-2.5">
                        <Cpu className="size-5 text-white" />
                        <div>
                            <h3 className="text-base font-bold tracking-wide text-white">
                                CURRENT ASSETS — EQUIPMENT
                            </h3>
                            <p className="text-xs text-blue-100 font-normal">
                                *Please refer to the attached document from COA. Formula:
                                Depreciation D = [C/A] · Book Value = C - ((YEAR NOW - B) * D)
                            </p>
                        </div>
                    </div>
                    {!blnReadOnly && (
                        <button
                            type="button"
                            onClick={_handleAddEquipment}
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
                                <th className="py-3 px-3 w-1/4">Equipment</th>
                                <th className="py-3 px-2 w-36">Type of Equipment*</th>
                                <th className="py-3 px-2 text-right w-24">Est. Useful Life (A)</th>
                                <th className="py-3 px-2 text-right w-24">Year Acquired (B)</th>
                                <th className="py-3 px-3 text-right w-32">Cost [C]</th>
                                <th className="py-3 px-3 text-right w-32">
                                    Depreciation D = [C/A]
                                </th>
                                <th className="py-3 px-3 text-right w-36">Book Value</th>
                                {!blnReadOnly && <th className="py-3 px-2 w-14"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#B5BFCD]/30 text-slate-800">
                            {objRecord.equipmentAssets.map((objEq) => (
                                <tr
                                    key={objEq.id}
                                    className="hover:bg-[#E6EEF4]/30 transition group"
                                >
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            value={objEq.equipmentName}
                                            onChange={(objEvent) =>
                                                _handleUpdateEquipment(
                                                    objEq.id,
                                                    'equipmentName',
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
                                            value={objEq.equipmentType}
                                            onChange={(objEvent) =>
                                                _handleUpdateEquipment(
                                                    objEq.id,
                                                    'equipmentType',
                                                    objEvent.target.value,
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-1 text-right">
                                        <input
                                            type="number"
                                            value={objEq.usefulLifeYears}
                                            onChange={(objEvent) =>
                                                _handleUpdateEquipment(
                                                    objEq.id,
                                                    'usefulLifeYears',
                                                    Number(objEvent.target.value),
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-20 ml-auto rounded-lg border border-[#B5BFCD] bg-white px-2 text-right text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-1 text-right">
                                        <input
                                            type="number"
                                            value={objEq.yearAcquired}
                                            onChange={(objEvent) =>
                                                _handleUpdateEquipment(
                                                    objEq.id,
                                                    'yearAcquired',
                                                    Number(objEvent.target.value),
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-20 ml-auto rounded-lg border border-[#B5BFCD] bg-white px-2 text-right text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-1 text-right">
                                        <input
                                            type="number"
                                            value={objEq.cost}
                                            onChange={(objEvent) =>
                                                _handleUpdateEquipment(
                                                    objEq.id,
                                                    'cost',
                                                    Number(objEvent.target.value),
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-right text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-2 text-right text-xs font-normal text-slate-600">
                                        ₱
                                        {(objEq.depreciation || 0).toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                        })}
                                    </td>
                                    <td className="p-2 text-right font-black text-[#285497] text-xs">
                                        ₱
                                        {(objEq.bookValue || 0).toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                        })}
                                    </td>
                                    {!blnReadOnly && (
                                        <td className="p-1 text-right w-14">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        _handleDuplicateEquipment(objEq.id)
                                                    }
                                                    title="Duplicate row"
                                                    className="rounded-md p-1 text-slate-500 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
                                                >
                                                    <Copy className="size-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => _handleRemoveEquipment(objEq.id)}
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
                            <tr className="bg-white border-t-2 border-[#B5BFCD]">
                                <td
                                    className="py-3 px-3 font-black text-[#285497] uppercase tracking-wider text-xs"
                                    colSpan={4}
                                >
                                    TOTAL (Equipment)
                                </td>
                                <td className="py-3 px-3 text-right font-black text-[#285497] text-xs">
                                    ₱
                                    {curTotalEquipmentCost.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                    })}
                                </td>
                                <td className="py-3 px-3 text-right text-xs font-bold text-slate-400">
                                    -
                                </td>
                                <td className="py-3 px-3 text-right font-black text-[#285497] text-xs">
                                    ₱
                                    {intTotalEquipmentBookValue.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                    })}
                                </td>
                                {!blnReadOnly && <td className="py-3 px-2 w-14"></td>}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* 3. WORKING CAPITAL (EXCEL PAGE 5) */}
            <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between bg-[#285497] px-6 py-4 text-white">
                    <div className="flex items-center gap-2.5">
                        <Coins className="size-5 text-white" />
                        <div>
                            <h3 className="text-base font-bold tracking-wide text-white">
                                CURRENT ASSETS — WORKING CAPITAL
                            </h3>
                            <p className="text-xs text-blue-100 font-normal">
                                Cash on Hand, Receivables, Inventory, and Available Working Balances
                            </p>
                        </div>
                    </div>
                    {!blnReadOnly && (
                        <button
                            type="button"
                            onClick={_handleAddWorkingCap}
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
                                <th className="py-3 px-3 w-2/3">Particulars</th>
                                <th className="py-3 px-3 text-right">Amount</th>
                                {!blnReadOnly && <th className="py-3 px-2 w-14"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#B5BFCD]/30 text-slate-800">
                            {objRecord.workingCapital.map((objItem) => (
                                <tr
                                    key={objItem.id}
                                    className="hover:bg-[#E6EEF4]/30 transition group"
                                >
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            value={objItem.particulars}
                                            onChange={(objEvent) =>
                                                _handleUpdateWorkingCap(
                                                    objItem.id,
                                                    'particulars',
                                                    objEvent.target.value,
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-1">
                                        <input
                                            type="number"
                                            value={objItem.amount}
                                            onChange={(objEvent) =>
                                                _handleUpdateWorkingCap(
                                                    objItem.id,
                                                    'amount',
                                                    Number(objEvent.target.value),
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-right text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    {!blnReadOnly && (
                                        <td className="p-1 text-right w-14">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        _handleDuplicateWorkingCap(objItem.id)
                                                    }
                                                    title="Duplicate row"
                                                    className="rounded-md p-1 text-slate-500 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
                                                >
                                                    <Copy className="size-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        _handleRemoveWorkingCap(objItem.id)
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
                            <tr className="bg-white border-t-2 border-[#B5BFCD]">
                                <td className="py-3 px-3 font-black text-[#285497] uppercase tracking-wider text-xs">
                                    TOTAL (Working Capital)
                                </td>
                                <td className="py-3 px-3 text-right font-black text-[#285497] text-xs">
                                    ₱
                                    {intTotalWorkingCap.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                    })}
                                </td>
                                {!blnReadOnly && <td className="py-3 px-2 w-14"></td>}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    ); // end return
} /* end AssetsTab */
