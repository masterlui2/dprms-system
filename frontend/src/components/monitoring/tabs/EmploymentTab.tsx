import {
  Copy,
  Plus,
  Trash2,
  Users2,
} from 'lucide-react'
import type {
  EmployeeItem,
  SetupMonitoringQuarterRecord,
} from '../../../types/setupMonitoring'

interface Props {
  record: SetupMonitoringQuarterRecord
  onChange: (record: SetupMonitoringQuarterRecord) => void
  readOnly?: boolean
}

export function EmploymentTab({ record, onChange, readOnly = false }: Props) {
  // Direct Employees
  const handleUpdateDirect = (id: string, field: keyof EmployeeItem, val: any) => {
    const updated = record.directEmployees.map((e) => {
      if (e.id !== id) return e
      const copy = { ...e, [field]: val }
      if (field === 'salaryRate' || field === 'workdaysQuarter' || field === 'salaryType') {
        const rate = field === 'salaryRate' ? Number(val) || 0 : copy.salaryRate
        const days = field === 'workdaysQuarter' ? Number(val) || 0 : copy.workdaysQuarter
        const type = field === 'salaryType' ? val : copy.salaryType
        copy.totalSalaryQuarter = type === 'Daily' ? rate * days : rate * 3
      }
      return copy
    })
    onChange({ ...record, directEmployees: updated })
  }

  const handleAddDirect = () => {
    const newEmp: EmployeeItem = {
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
    }
    onChange({ ...record, directEmployees: [...record.directEmployees, newEmp] })
  }

  const handleDuplicateDirect = (id: string) => {
    const target = record.directEmployees.find((e) => e.id === id)
    if (!target) return
    const dup: EmployeeItem = {
      ...target,
      id: 'emp_dir_' + Date.now(),
      name: `${target.name} (Copy)`,
    }
    const idx = record.directEmployees.findIndex((e) => e.id === id)
    const newDirect = [...record.directEmployees]
    newDirect.splice(idx + 1, 0, dup)
    onChange({ ...record, directEmployees: newDirect })
  }

  const handleRemoveDirect = (id: string) => {
    onChange({
      ...record,
      directEmployees: record.directEmployees.filter((e) => e.id !== id),
    })
  }

  // Indirect Employees
  const handleUpdateIndirect = (id: string, field: keyof EmployeeItem, val: any) => {
    const updated = record.indirectEmployees.map((e) => {
      if (e.id !== id) return e
      const copy = { ...e, [field]: val }
      if (field === 'salaryRate' || field === 'workdaysQuarter' || field === 'salaryType') {
        const rate = field === 'salaryRate' ? Number(val) || 0 : copy.salaryRate
        const days = field === 'workdaysQuarter' ? Number(val) || 0 : copy.workdaysQuarter
        const type = field === 'salaryType' ? val : copy.salaryType
        copy.totalSalaryQuarter = type === 'Daily' ? rate * days : rate * 3
      }
      return copy
    })
    onChange({ ...record, indirectEmployees: updated })
  }

  const handleAddIndirect = () => {
    const newEmp: EmployeeItem = {
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
    }
    onChange({ ...record, indirectEmployees: [...record.indirectEmployees, newEmp] })
  }

  const handleDuplicateIndirect = (id: string) => {
    const target = record.indirectEmployees.find((e) => e.id === id)
    if (!target) return
    const dup: EmployeeItem = {
      ...target,
      id: 'emp_ind_' + Date.now(),
      name: `${target.name} (Copy)`,
    }
    const idx = record.indirectEmployees.findIndex((e) => e.id === id)
    const newIndirect = [...record.indirectEmployees]
    newIndirect.splice(idx + 1, 0, dup)
    onChange({ ...record, indirectEmployees: newIndirect })
  }

  const handleRemoveIndirect = (id: string) => {
    onChange({
      ...record,
      indirectEmployees: record.indirectEmployees.filter((e) => e.id !== id),
    })
  }

  const totalDirectSalary = record.directEmployees.reduce((sum, e) => sum + (e.totalSalaryQuarter || 0), 0)
  const totalIndirectSalary = record.indirectEmployees.reduce((sum, e) => sum + (e.totalSalaryQuarter || 0), 0)

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
          {!readOnly && (
            <button
              type="button"
              onClick={handleAddDirect}
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
                <th className="py-3 px-3 w-1/5">Name of Employee (Please write name in full)</th>
                <th className="py-3 px-1 text-center w-14">Age</th>
                <th className="py-3 px-2 w-32">Employment Status</th>
                <th className="py-3 px-2 text-center w-24">Sex (Male/Female)</th>
                <th className="py-3 px-2 text-center w-28">Sectoral Group (SC/Youth/PWD)</th>
                <th className="py-3 px-2 text-center w-24">No. of Workdays</th>
                <th className="py-3 px-2 text-center w-28">Salary Rate (D/M)</th>
                <th className="py-3 px-3 text-right w-36">Total Salary for Quarter</th>
                {!readOnly && <th className="py-3 px-2 w-14"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B5BFCD]/30 text-slate-800">
              {record.directEmployees.map((e) => (
                <tr key={e.id} className="hover:bg-[#E6EEF4]/30 transition group">
                  <td className="p-2">
                    <input
                      type="text"
                      value={e.name}
                      onChange={(ev) => handleUpdateDirect(e.id, 'name', ev.target.value)}
                      readOnly={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1 text-center">
                    <input
                      type="number"
                      value={e.age}
                      onChange={(ev) => handleUpdateDirect(e.id, 'age', Number(ev.target.value))}
                      readOnly={readOnly}
                      className="h-8 w-12 mx-auto rounded-lg border border-[#B5BFCD] bg-white text-center text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1">
                    <select
                      value={e.employmentStatus}
                      onChange={(ev) => handleUpdateDirect(e.id, 'employmentStatus', ev.target.value as any)}
                      disabled={readOnly}
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
                      value={e.sex}
                      onChange={(ev) => handleUpdateDirect(e.id, 'sex', ev.target.value as any)}
                      disabled={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-1.5 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </td>
                  <td className="p-1 text-center">
                    <select
                      value={e.sectoralGroup}
                      onChange={(ev) => handleUpdateDirect(e.id, 'sectoralGroup', ev.target.value as any)}
                      disabled={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-1 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    >
                      <option value="None">None</option>
                      <option value="Youth">Youth &lt; 20 yo</option>
                      <option value="SC">SC (Senior)</option>
                      <option value="PWD">PWD</option>
                    </select>
                  </td>
                  <td className="p-1 text-center">
                    <input
                      type="number"
                      value={e.workdaysQuarter}
                      onChange={(ev) => handleUpdateDirect(e.id, 'workdaysQuarter', Number(ev.target.value))}
                      readOnly={readOnly}
                      className="h-8 w-16 mx-auto rounded-lg border border-[#B5BFCD] bg-white text-center text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1 text-center">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={e.salaryRate}
                        onChange={(ev) => handleUpdateDirect(e.id, 'salaryRate', Number(ev.target.value))}
                        readOnly={readOnly}
                        className="h-8 w-16 rounded-lg border border-[#B5BFCD] bg-white px-1 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                      />
                      <select
                        value={e.salaryType}
                        onChange={(ev) => handleUpdateDirect(e.id, 'salaryType', ev.target.value as any)}
                        disabled={readOnly}
                        className="h-8 w-12 rounded-lg border border-[#B5BFCD] bg-white text-xs font-normal text-slate-700"
                      >
                        <option value="Daily">D</option>
                        <option value="Monthly">M</option>
                      </select>
                    </div>
                  </td>
                  <td className="p-2 text-right font-black text-[#285497] text-xs">
                    ₱{(e.totalSalaryQuarter || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  {!readOnly && (
                    <td className="p-1 text-right w-14">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicateDirect(e.id)}
                          title="Duplicate row"
                          className="rounded-md p-1 text-slate-500 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
                        >
                          <Copy className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveDirect(e.id)}
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
                <td className="py-3 px-3 font-black text-[#285497] uppercase tracking-wider text-xs" colSpan={7}>
                  TOTAL (Direct Employment Wages)
                </td>
                <td className="py-3 px-3 text-right font-black text-[#285497] text-xs">
                  ₱{totalDirectSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                {!readOnly && <td className="py-3 px-2 w-14"></td>}
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
          {!readOnly && (
            <button
              type="button"
              onClick={handleAddIndirect}
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
                <th className="py-3 px-3 w-1/5">Name of Employee (Please write name in full)</th>
                <th className="py-3 px-1 text-center w-14">Age</th>
                <th className="py-3 px-2 w-32">Employment Status</th>
                <th className="py-3 px-2 text-center w-24">Sex (Male/Female)</th>
                <th className="py-3 px-2 text-center w-28">Sectoral Group (SC/Youth/PWD)</th>
                <th className="py-3 px-2 text-center w-24">No. of Workdays</th>
                <th className="py-3 px-2 text-center w-28">Salary Rate (D/M)</th>
                <th className="py-3 px-3 text-right w-36">Total Salary for Quarter</th>
                {!readOnly && <th className="py-3 px-2 w-14"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B5BFCD]/30 text-slate-800">
              {record.indirectEmployees.map((e) => (
                <tr key={e.id} className="hover:bg-[#E6EEF4]/30 transition group">
                  <td className="p-2">
                    <input
                      type="text"
                      value={e.name}
                      onChange={(ev) => handleUpdateIndirect(e.id, 'name', ev.target.value)}
                      readOnly={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1 text-center">
                    <input
                      type="number"
                      value={e.age}
                      onChange={(ev) => handleUpdateIndirect(e.id, 'age', Number(ev.target.value))}
                      readOnly={readOnly}
                      className="h-8 w-12 mx-auto rounded-lg border border-[#B5BFCD] bg-white text-center text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1">
                    <select
                      value={e.employmentStatus}
                      onChange={(ev) => handleUpdateIndirect(e.id, 'employmentStatus', ev.target.value as any)}
                      disabled={readOnly}
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
                      value={e.sex}
                      onChange={(ev) => handleUpdateIndirect(e.id, 'sex', ev.target.value as any)}
                      disabled={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-1.5 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </td>
                  <td className="p-1 text-center">
                    <select
                      value={e.sectoralGroup}
                      onChange={(ev) => handleUpdateIndirect(e.id, 'sectoralGroup', ev.target.value as any)}
                      disabled={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-1 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    >
                      <option value="None">None</option>
                      <option value="Youth">Youth &lt; 20 yo</option>
                      <option value="SC">SC (Senior)</option>
                      <option value="PWD">PWD</option>
                    </select>
                  </td>
                  <td className="p-1 text-center">
                    <input
                      type="number"
                      value={e.workdaysQuarter}
                      onChange={(ev) => handleUpdateIndirect(e.id, 'workdaysQuarter', Number(ev.target.value))}
                      readOnly={readOnly}
                      className="h-8 w-16 mx-auto rounded-lg border border-[#B5BFCD] bg-white text-center text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1 text-center">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={e.salaryRate}
                        onChange={(ev) => handleUpdateIndirect(e.id, 'salaryRate', Number(ev.target.value))}
                        readOnly={readOnly}
                        className="h-8 w-16 rounded-lg border border-[#B5BFCD] bg-white px-1 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                      />
                      <select
                        value={e.salaryType}
                        onChange={(ev) => handleUpdateIndirect(e.id, 'salaryType', ev.target.value as any)}
                        disabled={readOnly}
                        className="h-8 w-12 rounded-lg border border-[#B5BFCD] bg-white text-xs font-normal text-slate-700"
                      >
                        <option value="Daily">D</option>
                        <option value="Monthly">M</option>
                      </select>
                    </div>
                  </td>
                  <td className="p-2 text-right font-black text-[#285497] text-xs">
                    ₱{(e.totalSalaryQuarter || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  {!readOnly && (
                    <td className="p-1 text-right w-14">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicateIndirect(e.id)}
                          title="Duplicate row"
                          className="rounded-md p-1 text-slate-500 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
                        >
                          <Copy className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveIndirect(e.id)}
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
                <td className="py-3 px-3 font-black text-[#285497] uppercase tracking-wider text-xs" colSpan={7}>
                  TOTAL (Indirect Employment Wages)
                </td>
                <td className="py-3 px-3 text-right font-black text-[#285497] text-xs">
                  ₱{totalIndirectSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                {!readOnly && <td className="py-3 px-2 w-14"></td>}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
