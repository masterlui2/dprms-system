/**
 * System: DPRMS
 * Purpose: Render employment tab for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { Copy, Plus, Trash2, Users2 } from 'lucide-react';
import type { EmployeeItem, SetupMonitoringQuarterRecord } from '../../../types/setup_monitoring';

interface Props
{
    objRecord: SetupMonitoringQuarterRecord;
    onChange: (objRecord: SetupMonitoringQuarterRecord) => void;
    blnReadOnly?: boolean;
}

/** Render employment tab and its available actions. */
export function EmploymentTab({ objRecord, onChange, blnReadOnly = false }: Props)
{
    // Direct Employees
    const _handleUpdateDirect = (strId: string, strField: keyof EmployeeItem, objValue: any) =>
    {
        const arrUpdated = objRecord.directEmployees.map((objEvent) =>
        {
            if (objEvent.id !== strId)
            {
                return objEvent;
            }
            const objCopy = { ...objEvent, [strField]: objValue };
            if (
                strField === 'salaryRate' ||
                strField === 'workdaysQuarter' ||
                strField === 'salaryType'
            )
            {
                const dblRate =
                    strField === 'salaryRate' ? Number(objValue) || 0 : objCopy.salaryRate;
                const intDays =
                    strField === 'workdaysQuarter'
                        ? Number(objValue) || 0
                        : objCopy.workdaysQuarter;
                const objType = strField === 'salaryType' ? objValue : objCopy.salaryType;
                objCopy.totalSalaryQuarter = objType === 'Daily' ? dblRate * intDays : dblRate * 3;
            }
            return objCopy;
        });
        onChange({ ...objRecord, directEmployees: arrUpdated });
    };

    /** Handle add direct. */
    const _handleAddDirect = () =>
    {
        const objNewEmp: EmployeeItem = {
            id: 'emp_dir_' + Date.now(),
            type: 'DIRECT',
            name: 'NEW DIRECT EMPLOYEE',
            age: 25,
            employmentStatus: 'Contract-Based',
            sex: 'Male',
            sectoralGroup: 'None',
            workdaysQuarter: 60,
            salaryType: 'Daily',
            salaryRate: 400,
            totalSalaryQuarter: 24000,
        };
        onChange({ ...objRecord, directEmployees: [...objRecord.directEmployees, objNewEmp] });
    };

    /** Handle duplicate direct. */
    const _handleDuplicateDirect = (strId: string) =>
    {
        const objTarget = objRecord.directEmployees.find((objEvent) => objEvent.id === strId);
        if (!objTarget)
        {
            return;
        }
        const objDup: EmployeeItem = {
            ...objTarget,
            id: 'emp_dir_' + Date.now(),
            name: `${objTarget.name} (Copy)`,
        };
        const intIndex = objRecord.directEmployees.findIndex((objEvent) => objEvent.id === strId);
        const arrNewDirect = [...objRecord.directEmployees];
        arrNewDirect.splice(intIndex + 1, 0, objDup);
        onChange({ ...objRecord, directEmployees: arrNewDirect });
    };

    /** Handle remove direct. */
    const _handleRemoveDirect = (strId: string) =>
    {
        onChange({
            ...objRecord,
            directEmployees: objRecord.directEmployees.filter((objEvent) => objEvent.id !== strId),
        });
    };

    // Indirect Employees
    const _handleUpdateIndirect = (strId: string, strField: keyof EmployeeItem, objValue: any) =>
    {
        const arrUpdated = objRecord.indirectEmployees.map((objEvent) =>
        {
            if (objEvent.id !== strId)
            {
                return objEvent;
            }
            const objCopy = { ...objEvent, [strField]: objValue };
            if (
                strField === 'salaryRate' ||
                strField === 'workdaysQuarter' ||
                strField === 'salaryType'
            )
            {
                const dblRate =
                    strField === 'salaryRate' ? Number(objValue) || 0 : objCopy.salaryRate;
                const intDays =
                    strField === 'workdaysQuarter'
                        ? Number(objValue) || 0
                        : objCopy.workdaysQuarter;
                const objType = strField === 'salaryType' ? objValue : objCopy.salaryType;
                objCopy.totalSalaryQuarter = objType === 'Daily' ? dblRate * intDays : dblRate * 3;
            }
            return objCopy;
        });
        onChange({ ...objRecord, indirectEmployees: arrUpdated });
    };

    /** Handle add indirect. */
    const _handleAddIndirect = () =>
    {
        const objNewEmp: EmployeeItem = {
            id: 'emp_ind_' + Date.now(),
            type: 'INDIRECT',
            name: 'NEW INDIRECT EMPLOYEE',
            age: 25,
            employmentStatus: 'Regular',
            sex: 'Female',
            sectoralGroup: 'None',
            workdaysQuarter: 60,
            salaryType: 'Monthly',
            salaryRate: 15000,
            totalSalaryQuarter: 45000,
        };
        onChange({ ...objRecord, indirectEmployees: [...objRecord.indirectEmployees, objNewEmp] });
    };

    /** Handle duplicate indirect. */
    const _handleDuplicateIndirect = (strId: string) =>
    {
        const objTarget = objRecord.indirectEmployees.find((objEvent) => objEvent.id === strId);
        if (!objTarget)
        {
            return;
        }
        const objDup: EmployeeItem = {
            ...objTarget,
            id: 'emp_ind_' + Date.now(),
            name: `${objTarget.name} (Copy)`,
        };
        const intIndex = objRecord.indirectEmployees.findIndex((objEvent) => objEvent.id === strId);
        const arrNewIndirect = [...objRecord.indirectEmployees];
        arrNewIndirect.splice(intIndex + 1, 0, objDup);
        onChange({ ...objRecord, indirectEmployees: arrNewIndirect });
    };

    /** Handle remove indirect. */
    const _handleRemoveIndirect = (strId: string) =>
    {
        onChange({
            ...objRecord,
            indirectEmployees: objRecord.indirectEmployees.filter(
                (objEvent) => objEvent.id !== strId,
            ),
        });
    };

    const curTotalDirectSalary = objRecord.directEmployees.reduce(
        (intSum, objEvent) => intSum + (objEvent.totalSalaryQuarter || 0),
        0,
    );
    const curTotalIndirectSalary = objRecord.indirectEmployees.reduce(
        (intSum, objEvent) => intSum + (objEvent.totalSalaryQuarter || 0),
        0,
    );

    return (
        <div className="space-y-8 font-sans">
            {/* 1. DIRECT (PRODUCTION) (EXCEL PAGE 6) */}
            <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between bg-[#285497] px-6 py-4 text-white">
                    <div className="flex items-center gap-2.5">
                        <Users2 className="size-5 text-white" />
                        <div>
                            <h3 className="text-base font-bold tracking-wide text-white">
                                EMPLOYMENT — DIRECT (PRODUCTION)
                            </h3>
                            <p className="text-xs text-blue-100 font-normal">
                                IF ROWS ARE NOT ENOUGH, PLEASE ADD ANOTHER SHEET FOR YOUR ENTRIES.
                            </p>
                        </div>
                    </div>
                    {!blnReadOnly && (
                        <button
                            type="button"
                            onClick={_handleAddDirect}
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
                                <th className="py-3 px-3 w-1/5">
                                    Name of Employee (Please write name in full)
                                </th>
                                <th className="py-3 px-1 text-right w-14">Age</th>
                                <th className="py-3 px-2 w-32">Employment Status</th>
                                <th className="py-3 px-2 text-center w-24">Sex (Male/Female)</th>
                                <th className="py-3 px-2 text-center w-28">
                                    Sectoral Group (SC/Youth/PWD)
                                </th>
                                <th className="py-3 px-2 text-right w-24">No. of Workdays</th>
                                <th className="py-3 px-2 text-right w-28">Salary Rate (D/M)</th>
                                <th className="py-3 px-3 text-right w-36">
                                    Total Salary for Quarter
                                </th>
                                {!blnReadOnly && <th className="py-3 px-2 w-14"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#B5BFCD]/30 text-slate-800">
                            {objRecord.directEmployees.map((objEvent) => (
                                <tr
                                    key={objEvent.id}
                                    className="hover:bg-[#E6EEF4]/30 transition group"
                                >
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            value={objEvent.name}
                                            onChange={(objEventValue) =>
                                                _handleUpdateDirect(
                                                    objEvent.id,
                                                    'name',
                                                    objEventValue.target.value,
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-1 text-right">
                                        <input
                                            type="number"
                                            value={objEvent.age}
                                            onChange={(objEventValue) =>
                                                _handleUpdateDirect(
                                                    objEvent.id,
                                                    'age',
                                                    Number(objEventValue.target.value),
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-12 ml-auto rounded-lg border border-[#B5BFCD] bg-white px-1 text-right text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-1">
                                        <select
                                            value={objEvent.employmentStatus}
                                            onChange={(objEventValue) =>
                                                _handleUpdateDirect(
                                                    objEvent.id,
                                                    'employmentStatus',
                                                    objEventValue.target.value as any,
                                                )
                                            }
                                            disabled={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-1.5 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        >
                                            <option value="Regular">Regular</option>
                                            <option value="Contract-Based">Contract-Based</option>
                                            <option value="Project-Based">Project-Based</option>
                                            <option value="Part-timer">Part-timer</option>
                                        </select>
                                    </td>
                                    <td className="p-1 text-center">
                                        <select
                                            value={objEvent.sex}
                                            onChange={(objEventValue) =>
                                                _handleUpdateDirect(
                                                    objEvent.id,
                                                    'sex',
                                                    objEventValue.target.value as any,
                                                )
                                            }
                                            disabled={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-1.5 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                    </td>
                                    <td className="p-1 text-center">
                                        <select
                                            value={objEvent.sectoralGroup}
                                            onChange={(objEventValue) =>
                                                _handleUpdateDirect(
                                                    objEvent.id,
                                                    'sectoralGroup',
                                                    objEventValue.target.value as any,
                                                )
                                            }
                                            disabled={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-1 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        >
                                            <option value="None">None</option>
                                            <option value="Youth">Youth &lt; 20 yo</option>
                                            <option value="SC">SC (Senior)</option>
                                            <option value="PWD">PWD</option>
                                        </select>
                                    </td>
                                    <td className="p-1 text-right">
                                        <input
                                            type="number"
                                            value={objEvent.workdaysQuarter}
                                            onChange={(objEventValue) =>
                                                _handleUpdateDirect(
                                                    objEvent.id,
                                                    'workdaysQuarter',
                                                    Number(objEventValue.target.value),
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-16 ml-auto rounded-lg border border-[#B5BFCD] bg-white px-1 text-right text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-1 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <input
                                                type="number"
                                                value={objEvent.salaryRate}
                                                onChange={(objEventValue) =>
                                                    _handleUpdateDirect(
                                                        objEvent.id,
                                                        'salaryRate',
                                                        Number(objEventValue.target.value),
                                                    )
                                                }
                                                readOnly={blnReadOnly}
                                                className="h-8 w-16 rounded-lg border border-[#B5BFCD] bg-white px-1 text-right text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                            />
                                            <select
                                                value={objEvent.salaryType}
                                                onChange={(objEventValue) =>
                                                    _handleUpdateDirect(
                                                        objEvent.id,
                                                        'salaryType',
                                                        objEventValue.target.value as any,
                                                    )
                                                }
                                                disabled={blnReadOnly}
                                                className="h-8 w-12 rounded-lg border border-[#B5BFCD] bg-white text-xs font-normal text-slate-700"
                                            >
                                                <option value="Daily">D</option>
                                                <option value="Monthly">M</option>
                                            </select>
                                        </div>
                                    </td>
                                    <td className="p-2 text-right font-black text-[#285497] text-xs">
                                        ₱
                                        {(objEvent.totalSalaryQuarter || 0).toLocaleString(
                                            undefined,
                                            { minimumFractionDigits: 2 },
                                        )}
                                    </td>
                                    {!blnReadOnly && (
                                        <td className="p-1 text-right w-14">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        _handleDuplicateDirect(objEvent.id)
                                                    }
                                                    title="Duplicate row"
                                                    className="rounded-md p-1 text-slate-500 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
                                                >
                                                    <Copy className="size-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => _handleRemoveDirect(objEvent.id)}
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
                                    colSpan={7}
                                >
                                    TOTAL (Direct Employment Wages)
                                </td>
                                <td className="py-3 px-3 text-right font-black text-[#285497] text-xs">
                                    ₱
                                    {curTotalDirectSalary.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                    })}
                                </td>
                                {!blnReadOnly && <td className="py-3 px-2 w-14"></td>}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* 2. INDIRECT (NON-PRODUCTION) (EXCEL PAGE 7) */}
            <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between bg-[#285497] px-6 py-4 text-white">
                    <div className="flex items-center gap-2.5">
                        <Users2 className="size-5 text-white" />
                        <div>
                            <h3 className="text-base font-bold tracking-wide text-white">
                                EMPLOYMENT — INDIRECT (NON-PRODUCTION)
                            </h3>
                            <p className="text-xs text-blue-100 font-normal">
                                ADMINISTRATIVE, SALES, ACCOUNTING, MANAGEMENT, SECURITY, DRIVERS
                            </p>
                        </div>
                    </div>
                    {!blnReadOnly && (
                        <button
                            type="button"
                            onClick={_handleAddIndirect}
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
                                <th className="py-3 px-3 w-1/5">
                                    Name of Employee (Please write name in full)
                                </th>
                                <th className="py-3 px-1 text-right w-14">Age</th>
                                <th className="py-3 px-2 w-32">Employment Status</th>
                                <th className="py-3 px-2 text-center w-24">Sex (Male/Female)</th>
                                <th className="py-3 px-2 text-center w-28">
                                    Sectoral Group (SC/Youth/PWD)
                                </th>
                                <th className="py-3 px-2 text-right w-24">No. of Workdays</th>
                                <th className="py-3 px-2 text-right w-28">Salary Rate (D/M)</th>
                                <th className="py-3 px-3 text-right w-36">
                                    Total Salary for Quarter
                                </th>
                                {!blnReadOnly && <th className="py-3 px-2 w-14"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#B5BFCD]/30 text-slate-800">
                            {objRecord.indirectEmployees.map((objEvent) => (
                                <tr
                                    key={objEvent.id}
                                    className="hover:bg-[#E6EEF4]/30 transition group"
                                >
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            value={objEvent.name}
                                            onChange={(objEventValue) =>
                                                _handleUpdateIndirect(
                                                    objEvent.id,
                                                    'name',
                                                    objEventValue.target.value,
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-1 text-right">
                                        <input
                                            type="number"
                                            value={objEvent.age}
                                            onChange={(objEventValue) =>
                                                _handleUpdateIndirect(
                                                    objEvent.id,
                                                    'age',
                                                    Number(objEventValue.target.value),
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-12 ml-auto rounded-lg border border-[#B5BFCD] bg-white px-1 text-right text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-1">
                                        <select
                                            value={objEvent.employmentStatus}
                                            onChange={(objEventValue) =>
                                                _handleUpdateIndirect(
                                                    objEvent.id,
                                                    'employmentStatus',
                                                    objEventValue.target.value as any,
                                                )
                                            }
                                            disabled={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-1.5 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        >
                                            <option value="Regular">Regular</option>
                                            <option value="Contract-Based">Contract-Based</option>
                                            <option value="Project-Based">Project-Based</option>
                                            <option value="Part-timer">Part-timer</option>
                                        </select>
                                    </td>
                                    <td className="p-1 text-center">
                                        <select
                                            value={objEvent.sex}
                                            onChange={(objEventValue) =>
                                                _handleUpdateIndirect(
                                                    objEvent.id,
                                                    'sex',
                                                    objEventValue.target.value as any,
                                                )
                                            }
                                            disabled={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-1.5 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                    </td>
                                    <td className="p-1 text-center">
                                        <select
                                            value={objEvent.sectoralGroup}
                                            onChange={(objEventValue) =>
                                                _handleUpdateIndirect(
                                                    objEvent.id,
                                                    'sectoralGroup',
                                                    objEventValue.target.value as any,
                                                )
                                            }
                                            disabled={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-1 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        >
                                            <option value="None">None</option>
                                            <option value="Youth">Youth &lt; 20 yo</option>
                                            <option value="SC">SC (Senior)</option>
                                            <option value="PWD">PWD</option>
                                        </select>
                                    </td>
                                    <td className="p-1 text-right">
                                        <input
                                            type="number"
                                            value={objEvent.workdaysQuarter}
                                            onChange={(objEventValue) =>
                                                _handleUpdateIndirect(
                                                    objEvent.id,
                                                    'workdaysQuarter',
                                                    Number(objEventValue.target.value),
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-16 ml-auto rounded-lg border border-[#B5BFCD] bg-white px-1 text-right text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-1 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <input
                                                type="number"
                                                value={objEvent.salaryRate}
                                                onChange={(objEventValue) =>
                                                    _handleUpdateIndirect(
                                                        objEvent.id,
                                                        'salaryRate',
                                                        Number(objEventValue.target.value),
                                                    )
                                                }
                                                readOnly={blnReadOnly}
                                                className="h-8 w-16 rounded-lg border border-[#B5BFCD] bg-white px-1 text-right text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                            />
                                            <select
                                                value={objEvent.salaryType}
                                                onChange={(objEventValue) =>
                                                    _handleUpdateIndirect(
                                                        objEvent.id,
                                                        'salaryType',
                                                        objEventValue.target.value as any,
                                                    )
                                                }
                                                disabled={blnReadOnly}
                                                className="h-8 w-12 rounded-lg border border-[#B5BFCD] bg-white text-xs font-normal text-slate-700"
                                            >
                                                <option value="Daily">D</option>
                                                <option value="Monthly">M</option>
                                            </select>
                                        </div>
                                    </td>
                                    <td className="p-2 text-right font-black text-[#285497] text-xs">
                                        ₱
                                        {(objEvent.totalSalaryQuarter || 0).toLocaleString(
                                            undefined,
                                            { minimumFractionDigits: 2 },
                                        )}
                                    </td>
                                    {!blnReadOnly && (
                                        <td className="p-1 text-right w-14">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        _handleDuplicateIndirect(objEvent.id)
                                                    }
                                                    title="Duplicate row"
                                                    className="rounded-md p-1 text-slate-500 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
                                                >
                                                    <Copy className="size-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        _handleRemoveIndirect(objEvent.id)
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
                                    colSpan={7}
                                >
                                    TOTAL (Indirect Employment Wages)
                                </td>
                                <td className="py-3 px-3 text-right font-black text-[#285497] text-xs">
                                    ₱
                                    {curTotalIndirectSalary.toLocaleString(undefined, {
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
} /* end EmploymentTab */
