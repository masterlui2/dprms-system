import {
  Coins,
  Copy,
  Package,
  Plus,
  Trash2,
  Users2,
  Zap,
} from 'lucide-react'
import type {
  MonthlyExpenseItem,
  ProductSalesItem,
  RawMaterialItem,
  SetupMonitoringQuarterRecord,
} from '../../../types/setupMonitoring'
import {
  computeProductionCostTotals,
  computeSalesTotals,
} from '../../../services/setupMonitoringStore'

interface Props {
  record: SetupMonitoringQuarterRecord
  onChange: (record: SetupMonitoringQuarterRecord) => void
  readOnly?: boolean
}

export function ProductionSalesTab({
  record,
  onChange,
  readOnly = false,
}: Props) {
  const salesTotals = computeSalesTotals(record)
  const costTotals = computeProductionCostTotals(record)

  // 1. Sales & Production Volume
  const handleUpdateProduct = (id: string, field: keyof ProductSalesItem, val: any) => {
    const updated = record.sales.map((p) => {
      if (p.id !== id) return p
      const copy = { ...p, [field]: val }
      if (field === 'quantity' || field === 'sellingPrice') {
        const v = field === 'quantity' ? Number(val) || 0 : copy.quantity
        const pr = field === 'sellingPrice' ? Number(val) || 0 : copy.sellingPrice
        copy.totalSales = v * pr
      }
      return copy
    })
    onChange({ ...record, sales: updated })
  }

  const handleAddProduct = () => {
    const newProd: ProductSalesItem = {
      id: 'prod_' + Date.now(),
      productName: 'NEW PRODUCT',
      specifications: 'Standard',
      unit: 'pcs',
      sellingPrice: 100,
      quantity: 100,
      totalSales: 10000,
    }
    onChange({ ...record, sales: [...record.sales, newProd] })
  }

  const handleDuplicateProduct = (id: string) => {
    const target = record.sales.find((p) => p.id === id)
    if (!target) return
    const dup: ProductSalesItem = {
      ...target,
      id: 'prod_' + Date.now(),
      productName: target.productName ? `${target.productName} (Copy)` : 'NEW PRODUCT (Copy)',
    }
    const idx = record.sales.findIndex((p) => p.id === id)
    const newSales = [...record.sales]
    newSales.splice(idx + 1, 0, dup)
    onChange({ ...record, sales: newSales })
  }

  const handleRemoveProduct = (id: string) => {
    onChange({
      ...record,
      sales: record.sales.filter((p) => p.id !== id),
    })
  }

  // 2. Overhead / Operating Expenses
  const handleUpdateOperating = (id: string, field: keyof MonthlyExpenseItem, val: any) => {
    const updated = record.operatingExpenses.map((item) => {
      if (item.id !== id) return item
      const copy = { ...item, [field]: val }
      if (field === 'month1' || field === 'month2' || field === 'month3') {
        const m1 = field === 'month1' ? Number(val) || 0 : item.month1
        const m2 = field === 'month2' ? Number(val) || 0 : item.month2
        const m3 = field === 'month3' ? Number(val) || 0 : item.month3
        copy.total = m1 + m2 + m3
      }
      return copy
    })
    onChange({ ...record, operatingExpenses: updated })
  }

  const handleAddOperating = () => {
    const newItem: MonthlyExpenseItem = {
      id: 'op_' + Date.now(),
      particulars: 'New Overhead Particular',
      month1: 0,
      month2: 0,
      month3: 0,
      total: 0,
    }
    onChange({ ...record, operatingExpenses: [...record.operatingExpenses, newItem] })
  }

  const handleDuplicateOperating = (id: string) => {
    const target = record.operatingExpenses.find((item) => item.id === id)
    if (!target) return
    const dup: MonthlyExpenseItem = {
      ...target,
      id: 'op_' + Date.now(),
      particulars: `${target.particulars} (Copy)`,
    }
    const idx = record.operatingExpenses.findIndex((item) => item.id === id)
    const newItems = [...record.operatingExpenses]
    newItems.splice(idx + 1, 0, dup)
    onChange({ ...record, operatingExpenses: newItems })
  }

  const handleRemoveOperating = (id: string) => {
    onChange({
      ...record,
      operatingExpenses: record.operatingExpenses.filter((i) => i.id !== id),
    })
  }

  // 3. Direct Labor
  const handleUpdateLabor = (id: string, field: keyof MonthlyExpenseItem, val: any) => {
    const updated = record.laborExpenses.map((item) => {
      if (item.id !== id) return item
      const copy = { ...item, [field]: val }
      if (field === 'month1' || field === 'month2' || field === 'month3') {
        const m1 = field === 'month1' ? Number(val) || 0 : item.month1
        const m2 = field === 'month2' ? Number(val) || 0 : item.month2
        const m3 = field === 'month3' ? Number(val) || 0 : item.month3
        copy.total = m1 + m2 + m3
      }
      return copy
    })
    onChange({ ...record, laborExpenses: updated })
  }

  const handleAddLabor = () => {
    const newItem: MonthlyExpenseItem = {
      id: 'lab_' + Date.now(),
      particulars: 'Contractual Labor Wages',
      month1: 0,
      month2: 0,
      month3: 0,
      total: 0,
    }
    onChange({ ...record, laborExpenses: [...record.laborExpenses, newItem] })
  }

  const handleDuplicateLabor = (id: string) => {
    const target = record.laborExpenses.find((item) => item.id === id)
    if (!target) return
    const dup: MonthlyExpenseItem = {
      ...target,
      id: 'lab_' + Date.now(),
      particulars: `${target.particulars} (Copy)`,
    }
    const idx = record.laborExpenses.findIndex((item) => item.id === id)
    const newItems = [...record.laborExpenses]
    newItems.splice(idx + 1, 0, dup)
    onChange({ ...record, laborExpenses: newItems })
  }

  const handleRemoveLabor = (id: string) => {
    onChange({
      ...record,
      laborExpenses: record.laborExpenses.filter((i) => i.id !== id),
    })
  }

  // 4. Raw Materials
  const handleUpdateRawMaterial = (id: string, field: keyof RawMaterialItem, val: any) => {
    const updated = record.rawMaterials.map((item) => {
      if (item.id !== id) return item
      const copy = { ...item, [field]: val }
      if (field === 'costPerUnit' || field === 'quantity') {
        const u = field === 'costPerUnit' ? Number(val) || 0 : item.costPerUnit
        const q = field === 'quantity' ? Number(val) || 0 : item.quantity
        copy.totalCost = u * q
      }
      return copy
    })
    onChange({ ...record, rawMaterials: updated })
  }

  const handleAddRawMaterial = () => {
    const newItem: RawMaterialItem = {
      id: 'rm_' + Date.now(),
      rawMaterialName: 'New Raw Material',
      unit: 'kg',
      costPerUnit: 0,
      quantity: 0,
      totalCost: 0,
    }
    onChange({ ...record, rawMaterials: [...record.rawMaterials, newItem] })
  }

  const handleDuplicateRawMaterial = (id: string) => {
    const target = record.rawMaterials.find((item) => item.id === id)
    if (!target) return
    const dup: RawMaterialItem = {
      ...target,
      id: 'rm_' + Date.now(),
      rawMaterialName: `${target.rawMaterialName} (Copy)`,
    }
    const idx = record.rawMaterials.findIndex((item) => item.id === id)
    const newItems = [...record.rawMaterials]
    newItems.splice(idx + 1, 0, dup)
    onChange({ ...record, rawMaterials: newItems })
  }

  const handleRemoveRawMaterial = (id: string) => {
    onChange({
      ...record,
      rawMaterials: record.rawMaterials.filter((i) => i.id !== id),
    })
  }

  // 5. Miscellaneous Expenses
  const handleUpdateMisc = (id: string, field: keyof MonthlyExpenseItem, val: any) => {
    const updated = record.miscellaneousExpenses.map((item) => {
      if (item.id !== id) return item
      const copy = { ...item, [field]: val }
      if (field === 'month1' || field === 'month2' || field === 'month3') {
        const m1 = field === 'month1' ? Number(val) || 0 : item.month1
        const m2 = field === 'month2' ? Number(val) || 0 : item.month2
        const m3 = field === 'month3' ? Number(val) || 0 : item.month3
        copy.total = m1 + m2 + m3
      }
      return copy
    })
    onChange({ ...record, miscellaneousExpenses: updated })
  }

  const handleAddMisc = () => {
    const newItem: MonthlyExpenseItem = {
      id: 'misc_' + Date.now(),
      particulars: 'New Miscellaneous Expense',
      month1: 0,
      month2: 0,
      month3: 0,
      total: 0,
    }
    onChange({ ...record, miscellaneousExpenses: [...record.miscellaneousExpenses, newItem] })
  }

  const handleDuplicateMisc = (id: string) => {
    const target = record.miscellaneousExpenses.find((item) => item.id === id)
    if (!target) return
    const dup: MonthlyExpenseItem = {
      ...target,
      id: 'misc_' + Date.now(),
      particulars: `${target.particulars} (Copy)`,
    }
    const idx = record.miscellaneousExpenses.findIndex((item) => item.id === id)
    const newItems = [...record.miscellaneousExpenses]
    newItems.splice(idx + 1, 0, dup)
    onChange({ ...record, miscellaneousExpenses: newItems })
  }

  const handleRemoveMisc = (id: string) => {
    onChange({
      ...record,
      miscellaneousExpenses: record.miscellaneousExpenses.filter((i) => i.id !== id),
    })
  }

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
          {!readOnly && (
            <button
              type="button"
              onClick={handleAddProduct}
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
                <th className="py-3 px-2 text-center w-36">Selling Price / Unit</th>
                <th className="py-3 px-2 text-center w-28">Quantity</th>
                <th className="py-3 px-3 text-right w-36">Total Sales</th>
                {!readOnly && <th className="py-3 px-2 w-14"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B5BFCD]/30 text-slate-800">
              {record.sales.map((p) => (
                <tr key={p.id} className="hover:bg-[#E6EEF4]/30 transition group">
                  <td className="p-2">
                    <input
                      type="text"
                      value={p.productName}
                      onChange={(e) => handleUpdateProduct(p.id, 'productName', e.target.value)}
                      readOnly={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={p.specifications || ''}
                      onChange={(e) => handleUpdateProduct(p.id, 'specifications', e.target.value)}
                      placeholder="e.g. SC / SH / SW"
                      readOnly={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-700 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={p.unit || ''}
                      onChange={(e) => handleUpdateProduct(p.id, 'unit', e.target.value)}
                      placeholder="bottles"
                      readOnly={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-700 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1 text-center">
                    <input
                      type="number"
                      value={p.sellingPrice}
                      onChange={(e) => handleUpdateProduct(p.id, 'sellingPrice', Number(e.target.value))}
                      readOnly={readOnly}
                      className="h-8 w-full mx-auto rounded-lg border border-[#B5BFCD] bg-white px-2 text-center text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1 text-center">
                    <input
                      type="number"
                      value={p.quantity}
                      onChange={(e) => handleUpdateProduct(p.id, 'quantity', Number(e.target.value))}
                      readOnly={readOnly}
                      className="h-8 w-full mx-auto rounded-lg border border-[#B5BFCD] bg-white px-2 text-center text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-2 text-right font-black text-[#285497] text-xs">
                    ₱{(p.totalSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  {!readOnly && (
                    <td className="p-1 text-right w-14">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicateProduct(p.id)}
                          title="Duplicate row"
                          className="rounded-md p-1 text-slate-500 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
                        >
                          <Copy className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(p.id)}
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
                <td className="py-3 px-3 font-black text-[#285497] uppercase tracking-wider text-xs" colSpan={5}>
                  GRAND TOTAL (Sales)
                </td>
                <td className="py-3 px-3 text-right font-black text-[#285497] text-xs">
                  ₱{salesTotals.grandTotalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                {!readOnly && <td className="py-3 px-2 w-14"></td>}
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
                Power, Water, Rent, Fuel, Internet, Maintenance, Communications, Discounts, PHIC, SSS, Commission
              </p>
            </div>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={handleAddOperating}
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
                <th className="py-3 px-2 text-center w-28">Month 1</th>
                <th className="py-3 px-2 text-center w-28">Month 2</th>
                <th className="py-3 px-2 text-center w-28">Month 3</th>
                <th className="py-3 px-3 text-right w-36">TOTAL</th>
                {!readOnly && <th className="py-3 px-2 w-14"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B5BFCD]/30 text-slate-800">
              {record.operatingExpenses.map((item) => (
                <tr key={item.id} className="hover:bg-[#E6EEF4]/30 transition group">
                  <td className="p-2">
                    <input
                      type="text"
                      value={item.particulars}
                      onChange={(e) => handleUpdateOperating(item.id, 'particulars', e.target.value)}
                      readOnly={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1 text-center">
                    <input
                      type="number"
                      value={item.month1}
                      onChange={(e) => handleUpdateOperating(item.id, 'month1', Number(e.target.value))}
                      readOnly={readOnly}
                      className="h-8 w-24 mx-auto rounded-lg border border-[#B5BFCD] bg-white px-1 text-center text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1 text-center">
                    <input
                      type="number"
                      value={item.month2}
                      onChange={(e) => handleUpdateOperating(item.id, 'month2', Number(e.target.value))}
                      readOnly={readOnly}
                      className="h-8 w-24 mx-auto rounded-lg border border-[#B5BFCD] bg-white px-1 text-center text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1 text-center">
                    <input
                      type="number"
                      value={item.month3}
                      onChange={(e) => handleUpdateOperating(item.id, 'month3', Number(e.target.value))}
                      readOnly={readOnly}
                      className="h-8 w-24 mx-auto rounded-lg border border-[#B5BFCD] bg-white px-1 text-center text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-2 text-right font-black text-[#285497] text-xs">
                    ₱{(item.total || 0).toLocaleString()}
                  </td>
                  {!readOnly && (
                    <td className="p-1 text-right w-14">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicateOperating(item.id)}
                          title="Duplicate row"
                          className="rounded-md p-1 text-slate-500 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
                        >
                          <Copy className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveOperating(item.id)}
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
                  Sub-Total (Overhead and Operating Expense)
                </td>
                <td className="py-3 px-3 text-right font-black text-[#285497] text-xs">
                  ₱{costTotals.operatingTotal.toLocaleString()}
                </td>
                {!readOnly && <td className="py-3 px-2 w-14"></td>}
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
                Direct plant workers, production crew, assembly, and processing staff
              </p>
            </div>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={handleAddLabor}
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
                <th className="py-3 px-2 text-center w-28">Month 1</th>
                <th className="py-3 px-2 text-center w-28">Month 2</th>
                <th className="py-3 px-2 text-center w-28">Month 3</th>
                <th className="py-3 px-3 text-right w-36">TOTAL</th>
                {!readOnly && <th className="py-3 px-2 w-14"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B5BFCD]/30 text-slate-800">
              {record.laborExpenses.map((item) => (
                <tr key={item.id} className="hover:bg-[#E6EEF4]/30 transition group">
                  <td className="p-2">
                    <input
                      type="text"
                      value={item.particulars}
                      onChange={(e) => handleUpdateLabor(item.id, 'particulars', e.target.value)}
                      readOnly={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1 text-center">
                    <input
                      type="number"
                      value={item.month1}
                      onChange={(e) => handleUpdateLabor(item.id, 'month1', Number(e.target.value))}
                      readOnly={readOnly}
                      className="h-8 w-24 mx-auto rounded-lg border border-[#B5BFCD] bg-white px-1 text-center text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1 text-center">
                    <input
                      type="number"
                      value={item.month2}
                      onChange={(e) => handleUpdateLabor(item.id, 'month2', Number(e.target.value))}
                      readOnly={readOnly}
                      className="h-8 w-24 mx-auto rounded-lg border border-[#B5BFCD] bg-white px-1 text-center text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1 text-center">
                    <input
                      type="number"
                      value={item.month3}
                      onChange={(e) => handleUpdateLabor(item.id, 'month3', Number(e.target.value))}
                      readOnly={readOnly}
                      className="h-8 w-24 mx-auto rounded-lg border border-[#B5BFCD] bg-white px-1 text-center text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-2 text-right font-black text-[#285497] text-xs">
                    ₱{(item.total || 0).toLocaleString()}
                  </td>
                  {!readOnly && (
                    <td className="p-1 text-right w-14">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicateLabor(item.id)}
                          title="Duplicate row"
                          className="rounded-md p-1 text-slate-500 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
                        >
                          <Copy className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveLabor(item.id)}
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
                  Sub-Total (Direct Labor)
                </td>
                <td className="py-3 px-3 text-right font-black text-[#285497] text-xs">
                  ₱{costTotals.laborTotal.toLocaleString()}
                </td>
                {!readOnly && <td className="py-3 px-2 w-14"></td>}
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
                Direct raw ingredients, processing materials, primary supplies, inputs
              </p>
            </div>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={handleAddRawMaterial}
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
                <th className="py-3 px-2 text-center w-28">Quantity</th>
                <th className="py-3 px-2 text-center w-36">Cost per Unit</th>
                <th className="py-3 px-3 text-right w-36">Total Cost</th>
                {!readOnly && <th className="py-3 px-2 w-14"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B5BFCD]/30 text-slate-800">
              {record.rawMaterials.map((item) => (
                <tr key={item.id} className="hover:bg-[#E6EEF4]/30 transition group">
                  <td className="p-2">
                    <input
                      type="text"
                      value={item.rawMaterialName}
                      onChange={(e) => handleUpdateRawMaterial(item.id, 'rawMaterialName', e.target.value)}
                      readOnly={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) => handleUpdateRawMaterial(item.id, 'unit', e.target.value)}
                      readOnly={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-700 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1 text-center">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleUpdateRawMaterial(item.id, 'quantity', Number(e.target.value))}
                      readOnly={readOnly}
                      className="h-8 w-full mx-auto rounded-lg border border-[#B5BFCD] bg-white px-2 text-center text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1 text-center">
                    <input
                      type="number"
                      value={item.costPerUnit}
                      onChange={(e) => handleUpdateRawMaterial(item.id, 'costPerUnit', Number(e.target.value))}
                      readOnly={readOnly}
                      className="h-8 w-full mx-auto rounded-lg border border-[#B5BFCD] bg-white px-2 text-center text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-2 text-right font-black text-[#285497] text-xs">
                    ₱{(item.totalCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  {!readOnly && (
                    <td className="p-1 text-right w-14">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicateRawMaterial(item.id)}
                          title="Duplicate row"
                          className="rounded-md p-1 text-slate-500 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
                        >
                          <Copy className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveRawMaterial(item.id)}
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
                  Sub-Total (Raw Materials)
                </td>
                <td className="py-3 px-3 text-right font-black text-[#285497] text-xs">
                  ₱{costTotals.rawMaterialsTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                {!readOnly && <td className="py-3 px-2 w-14"></td>}
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
          {!readOnly && (
            <button
              type="button"
              onClick={handleAddMisc}
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
                <th className="py-3 px-2 text-center w-28">Month 1</th>
                <th className="py-3 px-2 text-center w-28">Month 2</th>
                <th className="py-3 px-2 text-center w-28">Month 3</th>
                <th className="py-3 px-3 text-right w-36">TOTAL</th>
                {!readOnly && <th className="py-3 px-2 w-14"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B5BFCD]/30 text-slate-800">
              {record.miscellaneousExpenses.map((item) => (
                <tr key={item.id} className="hover:bg-[#E6EEF4]/30 transition group">
                  <td className="p-2">
                    <input
                      type="text"
                      value={item.particulars}
                      onChange={(e) => handleUpdateMisc(item.id, 'particulars', e.target.value)}
                      readOnly={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1 text-center">
                    <input
                      type="number"
                      value={item.month1}
                      onChange={(e) => handleUpdateMisc(item.id, 'month1', Number(e.target.value))}
                      readOnly={readOnly}
                      className="h-8 w-24 mx-auto rounded-lg border border-[#B5BFCD] bg-white px-1 text-center text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1 text-center">
                    <input
                      type="number"
                      value={item.month2}
                      onChange={(e) => handleUpdateMisc(item.id, 'month2', Number(e.target.value))}
                      readOnly={readOnly}
                      className="h-8 w-24 mx-auto rounded-lg border border-[#B5BFCD] bg-white px-1 text-center text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1 text-center">
                    <input
                      type="number"
                      value={item.month3}
                      onChange={(e) => handleUpdateMisc(item.id, 'month3', Number(e.target.value))}
                      readOnly={readOnly}
                      className="h-8 w-24 mx-auto rounded-lg border border-[#B5BFCD] bg-white px-1 text-center text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-2 text-right font-black text-[#285497] text-xs">
                    ₱{(item.total || 0).toLocaleString()}
                  </td>
                  {!readOnly && (
                    <td className="p-1 text-right w-14">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicateMisc(item.id)}
                          title="Duplicate row"
                          className="rounded-md p-1 text-slate-500 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
                        >
                          <Copy className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveMisc(item.id)}
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
                  Sub-Total (Miscellaneous Expense)
                </td>
                <td className="py-3 px-3 text-right font-black text-[#285497] text-xs">
                  ₱{costTotals.miscTotal.toLocaleString()}
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
