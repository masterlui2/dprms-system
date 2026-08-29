import {
  Building2,
  Coins,
  Copy,
  Cpu,
  Plus,
  Trash2,
} from 'lucide-react'
import type {
  BuildingAsset,
  EquipmentAsset,
  SetupMonitoringQuarterRecord,
  WorkingCapitalItem,
} from '../../../types/setupMonitoring'
import {
  calculateBuildingDepreciation,
  calculateBuildingBookValue,
  calculateEquipmentDepreciation,
  calculateEquipmentBookValue,
} from '../../../services/setupMonitoringStore'

interface Props {
  record: SetupMonitoringQuarterRecord
  onChange: (record: SetupMonitoringQuarterRecord) => void
  readOnly?: boolean
}

export function AssetsTab({ record, onChange, readOnly = false }: Props) {
  // Buildings
  const handleUpdateBuilding = (id: string, field: keyof BuildingAsset, val: any) => {
    const updated = record.buildingAssets.map((item) => {
      if (item.id !== id) return item
      const copy = { ...item, [field]: val }
      if (field === 'cost' || field === 'usefulLifeYears' || field === 'yearAcquired') {
        const c = field === 'cost' ? Number(val) || 0 : item.cost
        const life = field === 'usefulLifeYears' ? Number(val) || 0 : item.usefulLifeYears
        const yr = field === 'yearAcquired' ? Number(val) || 0 : item.yearAcquired
        copy.depreciation = calculateBuildingDepreciation(c, life)
        copy.bookValue = calculateBuildingBookValue(c, life, yr)
      }
      return copy
    })
    onChange({ ...record, buildingAssets: updated })
  }

  const handleAddBuilding = () => {
    const newItem: BuildingAsset = {
      id: 'bld_' + Date.now(),
      buildingName: 'NEW BUILDING ASSET',
      buildingType: 'Processing Facility',
      usefulLifeYears: 20,
      yearAcquired: 2024,
      cost: 0,
      depreciation: 0,
      bookValue: 0,
    }
    onChange({ ...record, buildingAssets: [...record.buildingAssets, newItem] })
  }

  const handleDuplicateBuilding = (id: string) => {
    const target = record.buildingAssets.find((item) => item.id === id)
    if (!target) return
    const dup: BuildingAsset = {
      ...target,
      id: 'bld_' + Date.now(),
      buildingName: `${target.buildingName} (Copy)`,
    }
    const idx = record.buildingAssets.findIndex((item) => item.id === id)
    const newItems = [...record.buildingAssets]
    newItems.splice(idx + 1, 0, dup)
    onChange({ ...record, buildingAssets: newItems })
  }

  const handleRemoveBuilding = (id: string) => {
    onChange({
      ...record,
      buildingAssets: record.buildingAssets.filter((item) => item.id !== id),
    })
  }

  // Equipment
  const handleUpdateEquipment = (id: string, field: keyof EquipmentAsset, val: any) => {
    const updated = record.equipmentAssets.map((item) => {
      if (item.id !== id) return item
      const copy = { ...item, [field]: val }
      if (field === 'cost' || field === 'usefulLifeYears' || field === 'yearAcquired') {
        const c = field === 'cost' ? Number(val) || 0 : item.cost
        const life = field === 'usefulLifeYears' ? Number(val) || 0 : item.usefulLifeYears
        const yr = field === 'yearAcquired' ? Number(val) || 0 : item.yearAcquired
        copy.depreciation = calculateEquipmentDepreciation(c, life)
        copy.bookValue = calculateEquipmentBookValue(c, life, yr)
      }
      return copy
    })
    onChange({ ...record, equipmentAssets: updated })
  }

  const handleAddEquipment = () => {
    const newItem: EquipmentAsset = {
      id: 'eq_' + Date.now(),
      equipmentName: 'NEW EQUIPMENT ASSET',
      equipmentType: 'Production Machine',
      usefulLifeYears: 10,
      yearAcquired: 2024,
      cost: 0,
      depreciation: 0,
      bookValue: 0,
    }
    onChange({ ...record, equipmentAssets: [...record.equipmentAssets, newItem] })
  }

  const handleDuplicateEquipment = (id: string) => {
    const target = record.equipmentAssets.find((item) => item.id === id)
    if (!target) return
    const dup: EquipmentAsset = {
      ...target,
      id: 'eq_' + Date.now(),
      equipmentName: `${target.equipmentName} (Copy)`,
    }
    const idx = record.equipmentAssets.findIndex((item) => item.id === id)
    const newItems = [...record.equipmentAssets]
    newItems.splice(idx + 1, 0, dup)
    onChange({ ...record, equipmentAssets: newItems })
  }

  const handleRemoveEquipment = (id: string) => {
    onChange({
      ...record,
      equipmentAssets: record.equipmentAssets.filter((item) => item.id !== id),
    })
  }

  // Working Capital
  const handleUpdateWorkingCap = (id: string, field: keyof WorkingCapitalItem, val: any) => {
    const updated = record.workingCapital.map((item) => {
      if (item.id !== id) return item
      return { ...item, [field]: val }
    })
    onChange({ ...record, workingCapital: updated })
  }

  const handleAddWorkingCap = () => {
    const newItem: WorkingCapitalItem = {
      id: 'wc_' + Date.now(),
      particulars: 'NEW CAPITAL ITEM',
      amount: 50000,
    }
    onChange({ ...record, workingCapital: [...record.workingCapital, newItem] })
  }

  const handleDuplicateWorkingCap = (id: string) => {
    const target = record.workingCapital.find((item) => item.id === id)
    if (!target) return
    const dup: WorkingCapitalItem = {
      ...target,
      id: 'wc_' + Date.now(),
      particulars: `${target.particulars} (Copy)`,
    }
    const idx = record.workingCapital.findIndex((item) => item.id === id)
    const newItems = [...record.workingCapital]
    newItems.splice(idx + 1, 0, dup)
    onChange({ ...record, workingCapital: newItems })
  }

  const handleRemoveWorkingCap = (id: string) => {
    onChange({
      ...record,
      workingCapital: record.workingCapital.filter((item) => item.id !== id),
    })
  }

  const totalBuildingCost = record.buildingAssets.reduce((acc, b) => acc + (b.cost || 0), 0)
  const totalBuildingBookValue = record.buildingAssets.reduce((acc, b) => acc + (b.bookValue || 0), 0)

  const totalEquipmentCost = record.equipmentAssets.reduce((acc, eq) => acc + (eq.cost || 0), 0)
  const totalEquipmentBookValue = record.equipmentAssets.reduce((acc, eq) => acc + (eq.bookValue || 0), 0)

  const totalWorkingCap = record.workingCapital.reduce((acc, w) => acc + (w.amount || 0), 0)

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
                *Please refer to the attached document from COA. Formula: Depreciation D = [C/A] · Book Value = C - ((YEAR NOW - B) * D)
              </p>
            </div>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={handleAddBuilding}
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
                <th className="py-3 px-2 text-center w-24">Est. Useful Life (A)</th>
                <th className="py-3 px-2 text-center w-24">Year Acquired (B)</th>
                <th className="py-3 px-3 text-right w-32">Cost [C]</th>
                <th className="py-3 px-3 text-right w-32">Depreciation D = [C/A]</th>
                <th className="py-3 px-3 text-right w-36">Book Value</th>
                {!readOnly && <th className="py-3 px-2 w-14"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B5BFCD]/30 text-slate-800">
              {record.buildingAssets.map((b) => (
                <tr key={b.id} className="hover:bg-[#E6EEF4]/30 transition group">
                  <td className="p-2">
                    <input
                      type="text"
                      value={b.buildingName}
                      onChange={(e) => handleUpdateBuilding(b.id, 'buildingName', e.target.value)}
                      readOnly={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={b.buildingType}
                      onChange={(e) => handleUpdateBuilding(b.id, 'buildingType', e.target.value)}
                      readOnly={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1 text-center">
                    <input
                      type="number"
                      value={b.usefulLifeYears}
                      onChange={(e) => handleUpdateBuilding(b.id, 'usefulLifeYears', Number(e.target.value))}
                      readOnly={readOnly}
                      className="h-8 w-20 mx-auto rounded-lg border border-[#B5BFCD] bg-white px-1 text-center text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1 text-center">
                    <input
                      type="number"
                      value={b.yearAcquired}
                      onChange={(e) => handleUpdateBuilding(b.id, 'yearAcquired', Number(e.target.value))}
                      readOnly={readOnly}
                      className="h-8 w-20 mx-auto rounded-lg border border-[#B5BFCD] bg-white px-1 text-center text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="number"
                      value={b.cost}
                      onChange={(e) => handleUpdateBuilding(b.id, 'cost', Number(e.target.value))}
                      readOnly={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-right text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-2 text-right text-xs font-normal text-slate-600">
                    ₱{(b.depreciation || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-2 text-right font-black text-[#285497] text-xs">
                    ₱{(b.bookValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  {!readOnly && (
                    <td className="p-1 text-right w-14">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicateBuilding(b.id)}
                          title="Duplicate row"
                          className="rounded-md p-1 text-slate-500 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
                        >
                          <Copy className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveBuilding(b.id)}
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
                <td className="py-3 px-3 font-black text-[#285497] uppercase tracking-wider text-xs" colSpan={4}>
                  TOTAL (Building)
                </td>
                <td className="py-3 px-3 text-right font-black text-[#285497] text-xs">
                  ₱{totalBuildingCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-3 text-right text-xs font-bold text-slate-400">-</td>
                <td className="py-3 px-3 text-right font-black text-[#285497] text-xs">
                  ₱{totalBuildingBookValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                {!readOnly && <td className="py-3 px-2 w-14"></td>}
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
                *Please refer to the attached document from COA. Formula: Depreciation D = [C/A] · Book Value = C - ((YEAR NOW - B) * D)
              </p>
            </div>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={handleAddEquipment}
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
                <th className="py-3 px-2 text-center w-24">Est. Useful Life (A)</th>
                <th className="py-3 px-2 text-center w-24">Year Acquired (B)</th>
                <th className="py-3 px-3 text-right w-32">Cost [C]</th>
                <th className="py-3 px-3 text-right w-32">Depreciation D = [C/A]</th>
                <th className="py-3 px-3 text-right w-36">Book Value</th>
                {!readOnly && <th className="py-3 px-2 w-14"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B5BFCD]/30 text-slate-800">
              {record.equipmentAssets.map((eq) => (
                <tr key={eq.id} className="hover:bg-[#E6EEF4]/30 transition group">
                  <td className="p-2">
                    <input
                      type="text"
                      value={eq.equipmentName}
                      onChange={(e) => handleUpdateEquipment(eq.id, 'equipmentName', e.target.value)}
                      readOnly={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={eq.equipmentType}
                      onChange={(e) => handleUpdateEquipment(eq.id, 'equipmentType', e.target.value)}
                      readOnly={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1 text-center">
                    <input
                      type="number"
                      value={eq.usefulLifeYears}
                      onChange={(e) => handleUpdateEquipment(eq.id, 'usefulLifeYears', Number(e.target.value))}
                      readOnly={readOnly}
                      className="h-8 w-20 mx-auto rounded-lg border border-[#B5BFCD] bg-white px-1 text-center text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1 text-center">
                    <input
                      type="number"
                      value={eq.yearAcquired}
                      onChange={(e) => handleUpdateEquipment(eq.id, 'yearAcquired', Number(e.target.value))}
                      readOnly={readOnly}
                      className="h-8 w-20 mx-auto rounded-lg border border-[#B5BFCD] bg-white px-1 text-center text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="number"
                      value={eq.cost}
                      onChange={(e) => handleUpdateEquipment(eq.id, 'cost', Number(e.target.value))}
                      readOnly={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-right text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-2 text-right text-xs font-normal text-slate-600">
                    ₱{(eq.depreciation || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-2 text-right font-black text-[#285497] text-xs">
                    ₱{(eq.bookValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  {!readOnly && (
                    <td className="p-1 text-right w-14">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicateEquipment(eq.id)}
                          title="Duplicate row"
                          className="rounded-md p-1 text-slate-500 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
                        >
                          <Copy className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveEquipment(eq.id)}
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
                <td className="py-3 px-3 font-black text-[#285497] uppercase tracking-wider text-xs" colSpan={4}>
                  TOTAL (Equipment)
                </td>
                <td className="py-3 px-3 text-right font-black text-[#285497] text-xs">
                  ₱{totalEquipmentCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-3 text-right text-xs font-bold text-slate-400">-</td>
                <td className="py-3 px-3 text-right font-black text-[#285497] text-xs">
                  ₱{totalEquipmentBookValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                {!readOnly && <td className="py-3 px-2 w-14"></td>}
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
          {!readOnly && (
            <button
              type="button"
              onClick={handleAddWorkingCap}
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
                {!readOnly && <th className="py-3 px-2 w-14"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B5BFCD]/30 text-slate-800">
              {record.workingCapital.map((item) => (
                <tr key={item.id} className="hover:bg-[#E6EEF4]/30 transition group">
                  <td className="p-2">
                    <input
                      type="text"
                      value={item.particulars}
                      onChange={(e) => handleUpdateWorkingCap(item.id, 'particulars', e.target.value)}
                      readOnly={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(e) => handleUpdateWorkingCap(item.id, 'amount', Number(e.target.value))}
                      readOnly={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-right text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  {!readOnly && (
                    <td className="p-1 text-right w-14">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicateWorkingCap(item.id)}
                          title="Duplicate row"
                          className="rounded-md p-1 text-slate-500 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
                        >
                          <Copy className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveWorkingCap(item.id)}
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
                  ₱{totalWorkingCap.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
