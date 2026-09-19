/**
 * System: DPRMS
 * Purpose: Render production sales tab for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { Coins, Copy, Package, Plus, Trash2, Users2, Zap } from 'lucide-react';
import
{
    computeProductionCostTotals,
    computeSalesTotals,
} from '../../../services/setup_monitoring_store';
import type {
    MonthlyExpenseItem,
    ProductSalesItem,
    RawMaterialItem,
    SetupMonitoringQuarterRecord,
} from '../../../types/setup_monitoring';

interface Props
{
    objRecord: SetupMonitoringQuarterRecord;
    onChange: (objRecord: SetupMonitoringQuarterRecord) => void;
    blnReadOnly?: boolean;
}

/** Render production sales tab and its available actions. */
export function ProductionSalesTab({ objRecord, onChange, blnReadOnly = false }: Props)
{
    const objSalesTotals = computeSalesTotals(objRecord);
    const objCostTotals = computeProductionCostTotals(objRecord);

    // 1. Sales & Production Volume
    const _handleUpdateProduct = (
        strId: string,
        strField: keyof ProductSalesItem,
        objValue: any,
    ) =>
    {
        const arrUpdated = objRecord.sales.map((objItem) =>
        {
            if (objItem.id !== strId)
            {
                return objItem;
            }
            const objCopy = { ...objItem, [strField]: objValue };
            if (strField === 'quantity' || strField === 'sellingPrice')
            {
                const intValue = strField === 'quantity' ? Number(objValue) || 0 : objCopy.quantity;
                const intPr =
                    strField === 'sellingPrice' ? Number(objValue) || 0 : objCopy.sellingPrice;
                objCopy.totalSales = intValue * intPr;
            }
            return objCopy;
        });
        onChange({ ...objRecord, sales: arrUpdated });
    };

    /** Handle add product. */
    const _handleAddProduct = () =>
    {
        const objNewProd: ProductSalesItem = {
            id: 'prod_' + Date.now(),
            productName: 'NEW PRODUCT',
            specifications: 'Standard',
            unit: 'pcs',
            sellingPrice: 100,
            quantity: 100,
            totalSales: 10000,
        };
        onChange({ ...objRecord, sales: [...objRecord.sales, objNewProd] });
    };

    /** Handle duplicate product. */
    const _handleDuplicateProduct = (strId: string) =>
    {
        const objTarget = objRecord.sales.find((objItem) => objItem.id === strId);
        if (!objTarget)
        {
            return;
        }
        const objDup: ProductSalesItem = {
            ...objTarget,
            id: 'prod_' + Date.now(),
            productName: objTarget.productName
                ? `${objTarget.productName} (Copy)`
                : 'NEW PRODUCT (Copy)',
        };
        const intIndex = objRecord.sales.findIndex((objItem) => objItem.id === strId);
        const arrNewSales = [...objRecord.sales];
        arrNewSales.splice(intIndex + 1, 0, objDup);
        onChange({ ...objRecord, sales: arrNewSales });
    };

    /** Handle remove product. */
    const _handleRemoveProduct = (strId: string) =>
    {
        onChange({
            ...objRecord,
            sales: objRecord.sales.filter((objItem) => objItem.id !== strId),
        });
    };

    // 2. Overhead / Operating Expenses
    const _handleUpdateOperating = (
        strId: string,
        strField: keyof MonthlyExpenseItem,
        objValue: any,
    ) =>
    {
        const arrUpdated = objRecord.operatingExpenses.map((objItem) =>
        {
            if (objItem.id !== strId)
            {
                return objItem;
            }
            const objCopy = { ...objItem, [strField]: objValue };
            if (strField === 'month1' || strField === 'month2' || strField === 'month3')
            {
                const intMOne = strField === 'month1' ? Number(objValue) || 0 : objItem.month1;
                const intMTwo = strField === 'month2' ? Number(objValue) || 0 : objItem.month2;
                const intMThree = strField === 'month3' ? Number(objValue) || 0 : objItem.month3;
                objCopy.total = intMOne + intMTwo + intMThree;
            }
            return objCopy;
        });
        onChange({ ...objRecord, operatingExpenses: arrUpdated });
    };

    /** Handle add operating. */
    const _handleAddOperating = () =>
    {
        const objNewItem: MonthlyExpenseItem = {
            id: 'op_' + Date.now(),
            particulars: 'New Overhead Particular',
            month1: 0,
            month2: 0,
            month3: 0,
            total: 0,
        };
        onChange({ ...objRecord, operatingExpenses: [...objRecord.operatingExpenses, objNewItem] });
    };

    /** Handle duplicate operating. */
    const _handleDuplicateOperating = (strId: string) =>
    {
        const objTarget = objRecord.operatingExpenses.find((objItem) => objItem.id === strId);
        if (!objTarget)
        {
            return;
        }
        const objDup: MonthlyExpenseItem = {
            ...objTarget,
            id: 'op_' + Date.now(),
            particulars: `${objTarget.particulars} (Copy)`,
        };
        const intIndex = objRecord.operatingExpenses.findIndex((objItem) => objItem.id === strId);
        const arrNewItems = [...objRecord.operatingExpenses];
        arrNewItems.splice(intIndex + 1, 0, objDup);
        onChange({ ...objRecord, operatingExpenses: arrNewItems });
    };

    /** Handle remove operating. */
    const _handleRemoveOperating = (strId: string) =>
    {
        onChange({
            ...objRecord,
            operatingExpenses: objRecord.operatingExpenses.filter(
                (objIndex) => objIndex.id !== strId,
            ),
        });
    };

    // 3. Direct Labor
    const _handleUpdateLabor = (
        strId: string,
        strField: keyof MonthlyExpenseItem,
        objValue: any,
    ) =>
    {
        const arrUpdated = objRecord.laborExpenses.map((objItem) =>
        {
            if (objItem.id !== strId)
            {
                return objItem;
            }
            const objCopy = { ...objItem, [strField]: objValue };
            if (strField === 'month1' || strField === 'month2' || strField === 'month3')
            {
                const intMOne = strField === 'month1' ? Number(objValue) || 0 : objItem.month1;
                const intMTwo = strField === 'month2' ? Number(objValue) || 0 : objItem.month2;
                const intMThree = strField === 'month3' ? Number(objValue) || 0 : objItem.month3;
                objCopy.total = intMOne + intMTwo + intMThree;
            }
            return objCopy;
        });
        onChange({ ...objRecord, laborExpenses: arrUpdated });
    };

    /** Handle add labor. */
    const _handleAddLabor = () =>
    {
        const objNewItem: MonthlyExpenseItem = {
            id: 'lab_' + Date.now(),
            particulars: 'Contractual Labor Wages',
            month1: 0,
            month2: 0,
            month3: 0,
            total: 0,
        };
        onChange({ ...objRecord, laborExpenses: [...objRecord.laborExpenses, objNewItem] });
    };

    /** Handle duplicate labor. */
    const _handleDuplicateLabor = (strId: string) =>
    {
        const objTarget = objRecord.laborExpenses.find((objItem) => objItem.id === strId);
        if (!objTarget)
        {
            return;
        }
        const objDup: MonthlyExpenseItem = {
            ...objTarget,
            id: 'lab_' + Date.now(),
            particulars: `${objTarget.particulars} (Copy)`,
        };
        const intIndex = objRecord.laborExpenses.findIndex((objItem) => objItem.id === strId);
        const arrNewItems = [...objRecord.laborExpenses];
        arrNewItems.splice(intIndex + 1, 0, objDup);
        onChange({ ...objRecord, laborExpenses: arrNewItems });
    };

    /** Handle remove labor. */
    const _handleRemoveLabor = (strId: string) =>
    {
        onChange({
            ...objRecord,
            laborExpenses: objRecord.laborExpenses.filter((objIndex) => objIndex.id !== strId),
        });
    };

    // 4. Raw Materials
    const _handleUpdateRawMaterial = (
        strId: string,
        strField: keyof RawMaterialItem,
        objValue: any,
    ) =>
    {
        const arrUpdated = objRecord.rawMaterials.map((objItem) =>
        {
            if (objItem.id !== strId)
            {
                return objItem;
            }
            const objCopy = { ...objItem, [strField]: objValue };
            if (strField === 'costPerUnit' || strField === 'quantity')
            {
                const intU =
                    strField === 'costPerUnit' ? Number(objValue) || 0 : objItem.costPerUnit;
                const intQuarter =
                    strField === 'quantity' ? Number(objValue) || 0 : objItem.quantity;
                objCopy.totalCost = intU * intQuarter;
            }
            return objCopy;
        });
        onChange({ ...objRecord, rawMaterials: arrUpdated });
    };

    /** Handle add raw material. */
    const _handleAddRawMaterial = () =>
    {
        const objNewItem: RawMaterialItem = {
            id: 'rm_' + Date.now(),
            rawMaterialName: 'New Raw Material',
            unit: 'kg',
            costPerUnit: 0,
            quantity: 0,
            totalCost: 0,
        };
        onChange({ ...objRecord, rawMaterials: [...objRecord.rawMaterials, objNewItem] });
    };

    /** Handle duplicate raw material. */
    const _handleDuplicateRawMaterial = (strId: string) =>
    {
        const objTarget = objRecord.rawMaterials.find((objItem) => objItem.id === strId);
        if (!objTarget)
        {
            return;
        }
        const objDup: RawMaterialItem = {
            ...objTarget,
            id: 'rm_' + Date.now(),
            rawMaterialName: `${objTarget.rawMaterialName} (Copy)`,
        };
        const intIndex = objRecord.rawMaterials.findIndex((objItem) => objItem.id === strId);
        const arrNewItems = [...objRecord.rawMaterials];
        arrNewItems.splice(intIndex + 1, 0, objDup);
        onChange({ ...objRecord, rawMaterials: arrNewItems });
    };

    /** Handle remove raw material. */
    const _handleRemoveRawMaterial = (strId: string) =>
    {
        onChange({
            ...objRecord,
            rawMaterials: objRecord.rawMaterials.filter((objIndex) => objIndex.id !== strId),
        });
    };

    // 5. Miscellaneous Expenses
    const _handleUpdateMisc = (
        strId: string,
        strField: keyof MonthlyExpenseItem,
        objValue: any,
    ) =>
    {
        const arrUpdated = objRecord.miscellaneousExpenses.map((objItem) =>
        {
            if (objItem.id !== strId)
            {
                return objItem;
            }
            const objCopy = { ...objItem, [strField]: objValue };
            if (strField === 'month1' || strField === 'month2' || strField === 'month3')
            {
                const intMOne = strField === 'month1' ? Number(objValue) || 0 : objItem.month1;
                const intMTwo = strField === 'month2' ? Number(objValue) || 0 : objItem.month2;
                const intMThree = strField === 'month3' ? Number(objValue) || 0 : objItem.month3;
                objCopy.total = intMOne + intMTwo + intMThree;
            }
            return objCopy;
        });
        onChange({ ...objRecord, miscellaneousExpenses: arrUpdated });
    };

    /** Handle add misc. */
    const _handleAddMisc = () =>
    {
        const objNewItem: MonthlyExpenseItem = {
            id: 'misc_' + Date.now(),
            particulars: 'New Miscellaneous Expense',
            month1: 0,
            month2: 0,
            month3: 0,
            total: 0,
        };
        onChange({
            ...objRecord,
            miscellaneousExpenses: [...objRecord.miscellaneousExpenses, objNewItem],
        });
    };

    /** Handle duplicate misc. */
    const _handleDuplicateMisc = (strId: string) =>
    {
        const objTarget = objRecord.miscellaneousExpenses.find((objItem) => objItem.id === strId);
        if (!objTarget)
        {
            return;
        }
        const objDup: MonthlyExpenseItem = {
            ...objTarget,
            id: 'misc_' + Date.now(),
            particulars: `${objTarget.particulars} (Copy)`,
        };
        const intIndex = objRecord.miscellaneousExpenses.findIndex(
            (objItem) => objItem.id === strId,
        );
        const arrNewItems = [...objRecord.miscellaneousExpenses];
        arrNewItems.splice(intIndex + 1, 0, objDup);
        onChange({ ...objRecord, miscellaneousExpenses: arrNewItems });
    };

    /** Handle remove misc. */
    const _handleRemoveMisc = (strId: string) =>
    {
        onChange({
            ...objRecord,
            miscellaneousExpenses: objRecord.miscellaneousExpenses.filter(
                (objIndex) => objIndex.id !== strId,
            ),
        });
    };

    return (
        <div className="space-y-8 font-sans">
            {/* 1. PRODUCTION AND SALES VOLUME (EXCEL PAGE 5) */}
            <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between bg-[#285497] px-6 py-4 text-white">
                    <div className="flex items-center gap-2.5">
                        <Package className="size-5 text-white" />
                        <div>
                            <h3 className="text-base font-bold tracking-wide text-white">
                                PRODUCTION AND SALES VOLUME
                            </h3>
                            <p className="text-xs text-blue-100 font-normal">
                                IF ROWS ARE NOT ENOUGH, PLEASE ADD ANOTHER SHEET FOR YOUR ENTRIES.
                            </p>
                        </div>
                    </div>
                    {!blnReadOnly && (
                        <button
                            type="button"
                            onClick={_handleAddProduct}
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
                                <th className="py-3 px-3 w-1/4">Product Name</th>
                                <th className="py-3 px-2 w-36">Specifications</th>
                                <th className="py-3 px-2 w-28">Unit</th>
                                <th className="py-3 px-2 text-right w-36">Selling Price / Unit</th>
                                <th className="py-3 px-2 text-right w-28">Quantity</th>
                                <th className="py-3 px-3 text-right w-36">Total Sales</th>
                                {!blnReadOnly && <th className="py-3 px-2 w-14"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#B5BFCD]/30 text-slate-800">
                            {objRecord.sales.map((objItem) => (
                                <tr
                                    key={objItem.id}
                                    className="hover:bg-[#E6EEF4]/30 transition group"
                                >
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            value={objItem.productName}
                                            onChange={(objEvent) =>
                                                _handleUpdateProduct(
                                                    objItem.id,
                                                    'productName',
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
                                            value={objItem.specifications || ''}
                                            onChange={(objEvent) =>
                                                _handleUpdateProduct(
                                                    objItem.id,
                                                    'specifications',
                                                    objEvent.target.value,
                                                )
                                            }
                                            placeholder="e.g. SC / SH / SW"
                                            readOnly={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-700 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-1">
                                        <input
                                            type="text"
                                            value={objItem.unit || ''}
                                            onChange={(objEvent) =>
                                                _handleUpdateProduct(
                                                    objItem.id,
                                                    'unit',
                                                    objEvent.target.value,
                                                )
                                            }
                                            placeholder="bottles"
                                            readOnly={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-700 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-1 text-right">
                                        <input
                                            type="number"
                                            value={objItem.sellingPrice}
                                            onChange={(objEvent) =>
                                                _handleUpdateProduct(
                                                    objItem.id,
                                                    'sellingPrice',
                                                    Number(objEvent.target.value),
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-right text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-1 text-right">
                                        <input
                                            type="number"
                                            value={objItem.quantity}
                                            onChange={(objEvent) =>
                                                _handleUpdateProduct(
                                                    objItem.id,
                                                    'quantity',
                                                    Number(objEvent.target.value),
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-right text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-2 text-right font-black text-[#285497] text-xs">
                                        ₱
                                        {(objItem.totalSales || 0).toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                        })}
                                    </td>
                                    {!blnReadOnly && (
                                        <td className="p-1 text-right w-14">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        _handleDuplicateProduct(objItem.id)
                                                    }
                                                    title="Duplicate row"
                                                    className="rounded-md p-1 text-slate-500 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
                                                >
                                                    <Copy className="size-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => _handleRemoveProduct(objItem.id)}
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
                                    colSpan={5}
                                >
                                    GRAND TOTAL (Sales)
                                </td>
                                <td className="py-3 px-3 text-right font-black text-[#285497] text-xs">
                                    ₱
                                    {objSalesTotals.grandTotalSales.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                    })}
                                </td>
                                {!blnReadOnly && <td className="py-3 px-2 w-14"></td>}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* 2. OVERHEAD AND OPERATING EXPENSES (EXCEL PAGE 8) */}
            <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between bg-[#285497] px-6 py-4 text-white">
                    <div className="flex items-center gap-2.5">
                        <Zap className="size-5 text-white" />
                        <div>
                            <h3 className="text-base font-bold tracking-wide text-white">
                                PRODUCTION COST — Overhead and Operating Expenses
                            </h3>
                            <p className="text-xs text-blue-100 font-normal">
                                Power, Water, Rent, Fuel, Internet, Maintenance, Communications,
                                Discounts, PHIC, SSS, Commission
                            </p>
                        </div>
                    </div>
                    {!blnReadOnly && (
                        <button
                            type="button"
                            onClick={_handleAddOperating}
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
                                <th className="py-3 px-3 w-1/3">Particulars</th>
                                <th className="py-3 px-2 text-right w-28">Month 1</th>
                                <th className="py-3 px-2 text-right w-28">Month 2</th>
                                <th className="py-3 px-2 text-right w-28">Month 3</th>
                                <th className="py-3 px-3 text-right w-36">TOTAL</th>
                                {!blnReadOnly && <th className="py-3 px-2 w-14"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#B5BFCD]/30 text-slate-800">
                            {objRecord.operatingExpenses.map((objItem) => (
                                <tr
                                    key={objItem.id}
                                    className="hover:bg-[#E6EEF4]/30 transition group"
                                >
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            value={objItem.particulars}
                                            onChange={(objEvent) =>
                                                _handleUpdateOperating(
                                                    objItem.id,
                                                    'particulars',
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
                                            value={objItem.month1}
                                            onChange={(objEvent) =>
                                                _handleUpdateOperating(
                                                    objItem.id,
                                                    'month1',
                                                    Number(objEvent.target.value),
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-24 ml-auto rounded-lg border border-[#B5BFCD] bg-white px-2 text-right text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-1 text-right">
                                        <input
                                            type="number"
                                            value={objItem.month2}
                                            onChange={(objEvent) =>
                                                _handleUpdateOperating(
                                                    objItem.id,
                                                    'month2',
                                                    Number(objEvent.target.value),
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-24 ml-auto rounded-lg border border-[#B5BFCD] bg-white px-2 text-right text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-1 text-right">
                                        <input
                                            type="number"
                                            value={objItem.month3}
                                            onChange={(objEvent) =>
                                                _handleUpdateOperating(
                                                    objItem.id,
                                                    'month3',
                                                    Number(objEvent.target.value),
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-24 ml-auto rounded-lg border border-[#B5BFCD] bg-white px-2 text-right text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-2 text-right font-black text-[#285497] text-xs">
                                        ₱{(objItem.total || 0).toLocaleString()}
                                    </td>
                                    {!blnReadOnly && (
                                        <td className="p-1 text-right w-14">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        _handleDuplicateOperating(objItem.id)
                                                    }
                                                    title="Duplicate row"
                                                    className="rounded-md p-1 text-slate-500 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
                                                >
                                                    <Copy className="size-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        _handleRemoveOperating(objItem.id)
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
                                    Sub-Total (Overhead and Operating Expense)
                                </td>
                                <td className="py-3 px-3 text-right font-black text-[#285497] text-xs">
                                    ₱{objCostTotals.operatingTotal.toLocaleString()}
                                </td>
                                {!blnReadOnly && <td className="py-3 px-2 w-14"></td>}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* 3. DIRECT LABOR EXPENSES (EXCEL PAGE 8) */}
            <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between bg-[#285497] px-6 py-4 text-white">
                    <div className="flex items-center gap-2.5">
                        <Users2 className="size-5 text-white" />
                        <div>
                            <h3 className="text-base font-bold tracking-wide text-white">
                                PRODUCTION COST — Direct Labor
                            </h3>
                            <p className="text-xs text-blue-100 font-normal">
                                Direct plant workers, production crew, assembly, and processing
                                staff
                            </p>
                        </div>
                    </div>
                    {!blnReadOnly && (
                        <button
                            type="button"
                            onClick={_handleAddLabor}
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
                                <th className="py-3 px-3 w-1/3">Particulars</th>
                                <th className="py-3 px-2 text-right w-28">Month 1</th>
                                <th className="py-3 px-2 text-right w-28">Month 2</th>
                                <th className="py-3 px-2 text-right w-28">Month 3</th>
                                <th className="py-3 px-3 text-right w-36">TOTAL</th>
                                {!blnReadOnly && <th className="py-3 px-2 w-14"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#B5BFCD]/30 text-slate-800">
                            {objRecord.laborExpenses.map((objItem) => (
                                <tr
                                    key={objItem.id}
                                    className="hover:bg-[#E6EEF4]/30 transition group"
                                >
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            value={objItem.particulars}
                                            onChange={(objEvent) =>
                                                _handleUpdateLabor(
                                                    objItem.id,
                                                    'particulars',
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
                                            value={objItem.month1}
                                            onChange={(objEvent) =>
                                                _handleUpdateLabor(
                                                    objItem.id,
                                                    'month1',
                                                    Number(objEvent.target.value),
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-24 ml-auto rounded-lg border border-[#B5BFCD] bg-white px-2 text-right text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-1 text-right">
                                        <input
                                            type="number"
                                            value={objItem.month2}
                                            onChange={(objEvent) =>
                                                _handleUpdateLabor(
                                                    objItem.id,
                                                    'month2',
                                                    Number(objEvent.target.value),
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-24 ml-auto rounded-lg border border-[#B5BFCD] bg-white px-2 text-right text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-1 text-right">
                                        <input
                                            type="number"
                                            value={objItem.month3}
                                            onChange={(objEvent) =>
                                                _handleUpdateLabor(
                                                    objItem.id,
                                                    'month3',
                                                    Number(objEvent.target.value),
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-24 ml-auto rounded-lg border border-[#B5BFCD] bg-white px-2 text-right text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-2 text-right font-black text-[#285497] text-xs">
                                        ₱{(objItem.total || 0).toLocaleString()}
                                    </td>
                                    {!blnReadOnly && (
                                        <td className="p-1 text-right w-14">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        _handleDuplicateLabor(objItem.id)
                                                    }
                                                    title="Duplicate row"
                                                    className="rounded-md p-1 text-slate-500 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
                                                >
                                                    <Copy className="size-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => _handleRemoveLabor(objItem.id)}
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
                                    Sub-Total (Direct Labor)
                                </td>
                                <td className="py-3 px-3 text-right font-black text-[#285497] text-xs">
                                    ₱{objCostTotals.laborTotal.toLocaleString()}
                                </td>
                                {!blnReadOnly && <td className="py-3 px-2 w-14"></td>}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* 4. RAW MATERIALS (EXCEL PAGE 8) */}
            <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between bg-[#285497] px-6 py-4 text-white">
                    <div className="flex items-center gap-2.5">
                        <Package className="size-5 text-white" />
                        <div>
                            <h3 className="text-base font-bold tracking-wide text-white">
                                PRODUCTION COST — Raw Materials
                            </h3>
                            <p className="text-xs text-blue-100 font-normal">
                                Direct raw ingredients, processing materials, primary supplies,
                                inputs
                            </p>
                        </div>
                    </div>
                    {!blnReadOnly && (
                        <button
                            type="button"
                            onClick={_handleAddRawMaterial}
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
                                <th className="py-3 px-3 w-1/3">Raw Materials**</th>
                                <th className="py-3 px-2 w-28">Unit</th>
                                <th className="py-3 px-2 text-right w-28">Quantity</th>
                                <th className="py-3 px-2 text-right w-36">Cost per Unit</th>
                                <th className="py-3 px-3 text-right w-36">Total Cost</th>
                                {!blnReadOnly && <th className="py-3 px-2 w-14"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#B5BFCD]/30 text-slate-800">
                            {objRecord.rawMaterials.map((objItem) => (
                                <tr
                                    key={objItem.id}
                                    className="hover:bg-[#E6EEF4]/30 transition group"
                                >
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            value={objItem.rawMaterialName}
                                            onChange={(objEvent) =>
                                                _handleUpdateRawMaterial(
                                                    objItem.id,
                                                    'rawMaterialName',
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
                                            value={objItem.unit}
                                            onChange={(objEvent) =>
                                                _handleUpdateRawMaterial(
                                                    objItem.id,
                                                    'unit',
                                                    objEvent.target.value,
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-700 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-1 text-right">
                                        <input
                                            type="number"
                                            value={objItem.quantity}
                                            onChange={(objEvent) =>
                                                _handleUpdateRawMaterial(
                                                    objItem.id,
                                                    'quantity',
                                                    Number(objEvent.target.value),
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-right text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-1 text-right">
                                        <input
                                            type="number"
                                            value={objItem.costPerUnit}
                                            onChange={(objEvent) =>
                                                _handleUpdateRawMaterial(
                                                    objItem.id,
                                                    'costPerUnit',
                                                    Number(objEvent.target.value),
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-right text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-2 text-right font-black text-[#285497] text-xs">
                                        ₱
                                        {(objItem.totalCost || 0).toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                        })}
                                    </td>
                                    {!blnReadOnly && (
                                        <td className="p-1 text-right w-14">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        _handleDuplicateRawMaterial(objItem.id)
                                                    }
                                                    title="Duplicate row"
                                                    className="rounded-md p-1 text-slate-500 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
                                                >
                                                    <Copy className="size-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        _handleRemoveRawMaterial(objItem.id)
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
                                    Sub-Total (Raw Materials)
                                </td>
                                <td className="py-3 px-3 text-right font-black text-[#285497] text-xs">
                                    ₱
                                    {objCostTotals.rawMaterialsTotal.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                    })}
                                </td>
                                {!blnReadOnly && <td className="py-3 px-2 w-14"></td>}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* 5. MISCELLANEOUS EXPENSES (EXCEL PAGE 8) */}
            <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between bg-[#285497] px-6 py-4 text-white">
                    <div className="flex items-center gap-2.5">
                        <Coins className="size-5 text-white" />
                        <div>
                            <h3 className="text-base font-bold tracking-wide text-white">
                                PRODUCTION COST — Miscellaneous Expenses
                            </h3>
                            <p className="text-xs text-blue-100 font-normal">
                                Contingency outlays, representation, freight, incidental consumables
                            </p>
                        </div>
                    </div>
                    {!blnReadOnly && (
                        <button
                            type="button"
                            onClick={_handleAddMisc}
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
                                <th className="py-3 px-3 w-1/3">Particulars</th>
                                <th className="py-3 px-2 text-right w-28">Month 1</th>
                                <th className="py-3 px-2 text-right w-28">Month 2</th>
                                <th className="py-3 px-2 text-right w-28">Month 3</th>
                                <th className="py-3 px-3 text-right w-36">TOTAL</th>
                                {!blnReadOnly && <th className="py-3 px-2 w-14"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#B5BFCD]/30 text-slate-800">
                            {objRecord.miscellaneousExpenses.map((objItem) => (
                                <tr
                                    key={objItem.id}
                                    className="hover:bg-[#E6EEF4]/30 transition group"
                                >
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            value={objItem.particulars}
                                            onChange={(objEvent) =>
                                                _handleUpdateMisc(
                                                    objItem.id,
                                                    'particulars',
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
                                            value={objItem.month1}
                                            onChange={(objEvent) =>
                                                _handleUpdateMisc(
                                                    objItem.id,
                                                    'month1',
                                                    Number(objEvent.target.value),
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-24 ml-auto rounded-lg border border-[#B5BFCD] bg-white px-2 text-right text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-1 text-right">
                                        <input
                                            type="number"
                                            value={objItem.month2}
                                            onChange={(objEvent) =>
                                                _handleUpdateMisc(
                                                    objItem.id,
                                                    'month2',
                                                    Number(objEvent.target.value),
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-24 ml-auto rounded-lg border border-[#B5BFCD] bg-white px-2 text-right text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-1 text-right">
                                        <input
                                            type="number"
                                            value={objItem.month3}
                                            onChange={(objEvent) =>
                                                _handleUpdateMisc(
                                                    objItem.id,
                                                    'month3',
                                                    Number(objEvent.target.value),
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-24 ml-auto rounded-lg border border-[#B5BFCD] bg-white px-2 text-right text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-2 text-right font-black text-[#285497] text-xs">
                                        ₱{(objItem.total || 0).toLocaleString()}
                                    </td>
                                    {!blnReadOnly && (
                                        <td className="p-1 text-right w-14">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => _handleDuplicateMisc(objItem.id)}
                                                    title="Duplicate row"
                                                    className="rounded-md p-1 text-slate-500 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
                                                >
                                                    <Copy className="size-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => _handleRemoveMisc(objItem.id)}
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
                                    Sub-Total (Miscellaneous Expense)
                                </td>
                                <td className="py-3 px-3 text-right font-black text-[#285497] text-xs">
                                    ₱{objCostTotals.miscTotal.toLocaleString()}
                                </td>
                                {!blnReadOnly && <td className="py-3 px-2 w-14"></td>}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    ); // end return
} /* end ProductionSalesTab */
