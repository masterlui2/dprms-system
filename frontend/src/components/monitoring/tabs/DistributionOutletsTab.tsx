import {
  Copy,
  Globe2,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
  Users,
} from 'lucide-react'
import type {
  MarketOutletItem,
  SetupMonitoringQuarterRecord,
  WorkerCount,
} from '../../../types/setupMonitoring'

interface Props {
  record: SetupMonitoringQuarterRecord
  onChange: (record: SetupMonitoringQuarterRecord) => void
  readOnly?: boolean
}

export function DistributionOutletsTab({
  record,
  onChange,
  readOnly = false,
}: Props) {
  // 1. International
  const handleUpdateIntl = (id: string, field: keyof MarketOutletItem, val: any) => {
    const updated = record.internationalMarkets.map((m) => {
      if (m.id !== id) return m
      return { ...m, [field]: val }
    })
    onChange({ ...record, internationalMarkets: updated })
  }

  const handleAddInternational = () => {
    const newItem: MarketOutletItem = {
      id: 'intl_' + Date.now(),
      marketType: 'INTERNATIONAL',
      marketName: 'NEW INTERNATIONAL CLIENT',
      address: 'Country/Port',
      condition: 'NEW',
      effectivityDate: 'Q3 2024',
      contactPerson: 'Trade Agent',
      productServiceSold: 'Processed Goods',
      volumeDelivered: '500 kg',
    }
    onChange({ ...record, internationalMarkets: [...record.internationalMarkets, newItem] })
  }

  const handleDuplicateIntl = (id: string) => {
    const target = record.internationalMarkets.find((m) => m.id === id)
    if (!target) return
    const dup: MarketOutletItem = {
      ...target,
      id: 'intl_' + Date.now(),
      marketName: `${target.marketName} (Copy)`,
    }
    const idx = record.internationalMarkets.findIndex((m) => m.id === id)
    const newItems = [...record.internationalMarkets]
    newItems.splice(idx + 1, 0, dup)
    onChange({ ...record, internationalMarkets: newItems })
  }

  const handleRemoveIntl = (id: string) => {
    onChange({
      ...record,
      internationalMarkets: record.internationalMarkets.filter((m) => m.id !== id),
    })
  }

  // 2. Local
  const handleUpdateLocal = (id: string, field: keyof MarketOutletItem, val: any) => {
    const updated = record.localMarkets.map((m) => {
      if (m.id !== id) return m
      return { ...m, [field]: val }
    })
    onChange({ ...record, localMarkets: updated })
  }

  const handleAddLocal = () => {
    const newItem: MarketOutletItem = {
      id: 'loc_' + Date.now(),
      marketType: 'LOCAL',
      marketName: 'NEW LOCAL OUTLET',
      address: 'City/Municipality',
      condition: 'NEW',
      effectivityDate: 'Q3 2024',
      contactPerson: 'Store Manager',
      productServiceSold: 'Goods',
      volumeDelivered: '200 units',
    }
    onChange({ ...record, localMarkets: [...record.localMarkets, newItem] })
  }

  const handleDuplicateLocal = (id: string) => {
    const target = record.localMarkets.find((m) => m.id === id)
    if (!target) return
    const dup: MarketOutletItem = {
      ...target,
      id: 'loc_' + Date.now(),
      marketName: `${target.marketName} (Copy)`,
    }
    const idx = record.localMarkets.findIndex((m) => m.id === id)
    const newItems = [...record.localMarkets]
    newItems.splice(idx + 1, 0, dup)
    onChange({ ...record, localMarkets: newItems })
  }

  const handleRemoveLocal = (id: string) => {
    onChange({
      ...record,
      localMarkets: record.localMarkets.filter((m) => m.id !== id),
    })
  }

  // 3. Distributors
  const handleUpdateDistributor = (id: string, field: keyof WorkerCount, val: any) => {
    const updated = record.forwardDistributors.map((d) => {
      if (d.id !== id) return d
      const copy = { ...d, [field]: val }
      if (field === 'male' || field === 'female') {
        const m = field === 'male' ? Number(val) || 0 : d.male
        const f = field === 'female' ? Number(val) || 0 : d.female
        copy.total = m + f
      }
      return copy
    })
    onChange({ ...record, forwardDistributors: updated })
  }

  const handleAddDistributor = () => {
    const newItem: WorkerCount = {
      id: 'dist_' + Date.now(),
      name: 'NEW DISTRIBUTOR ENTITY',
      male: 2,
      female: 1,
      total: 3,
    }
    onChange({ ...record, forwardDistributors: [...record.forwardDistributors, newItem] })
  }

  const handleDuplicateDistributor = (id: string) => {
    const target = record.forwardDistributors.find((d) => d.id === id)
    if (!target) return
    const dup: WorkerCount = {
      ...target,
      id: 'dist_' + Date.now(),
      name: `${target.name} (Copy)`,
    }
    const idx = record.forwardDistributors.findIndex((d) => d.id === id)
    const newItems = [...record.forwardDistributors]
    newItems.splice(idx + 1, 0, dup)
    onChange({ ...record, forwardDistributors: newItems })
  }

  const handleRemoveDistributor = (id: string) => {
    onChange({
      ...record,
      forwardDistributors: record.forwardDistributors.filter((d) => d.id !== id),
    })
  }

  // 4. Suppliers
  const handleUpdateSupplier = (id: string, field: keyof WorkerCount, val: any) => {
    const updated = record.forwardSuppliers.map((s) => {
      if (s.id !== id) return s
      const copy = { ...s, [field]: val }
      if (field === 'male' || field === 'female') {
        const m = field === 'male' ? Number(val) || 0 : s.male
        const f = field === 'female' ? Number(val) || 0 : s.female
        copy.total = m + f
      }
      return copy
    })
    onChange({ ...record, forwardSuppliers: updated })
  }

  const handleAddSupplier = () => {
    const newItem: WorkerCount = {
      id: 'sup_' + Date.now(),
      name: 'NEW RAW MATERIAL SUPPLIER',
      male: 3,
      female: 2,
      total: 5,
    }
    onChange({ ...record, forwardSuppliers: [...record.forwardSuppliers, newItem] })
  }

  const handleDuplicateSupplier = (id: string) => {
    const target = record.forwardSuppliers.find((s) => s.id === id)
    if (!target) return
    const dup: WorkerCount = {
      ...target,
      id: 'sup_' + Date.now(),
      name: `${target.name} (Copy)`,
    }
    const idx = record.forwardSuppliers.findIndex((s) => s.id === id)
    const newItems = [...record.forwardSuppliers]
    newItems.splice(idx + 1, 0, dup)
    onChange({ ...record, forwardSuppliers: newItems })
  }

  const handleRemoveSupplier = (id: string) => {
    onChange({
      ...record,
      forwardSuppliers: record.forwardSuppliers.filter((s) => s.id !== id),
    })
  }

  const totalDistributorStaff = record.forwardDistributors.reduce((acc, d) => acc + (d.total || 0), 0)
  const totalSupplierStaff = record.forwardSuppliers.reduce((acc, s) => acc + (s.total || 0), 0)

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
                Overseas retail buyers, institutional export accounts, and cross-border distribution channels
              </p>
            </div>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={handleAddInternational}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-xs font-bold text-[#285497] shadow-sm transition hover:bg-[#E6EEF4] active:scale-95"
            >
              <Plus className="size-3.5 text-[#285497]" />
              <span>Add Row</span>
            </button>
          )}
        </div>        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white border-b border-[#B5BFCD] text-[11px] font-bold uppercase tracking-wider text-[#285497]">
              <tr>
                <th className="py-3 px-3 w-1/4">International Market (Write in full)</th>
                <th className="py-3 px-2 w-1/5">Address</th>
                <th className="py-3 px-2 text-center w-28">Condition (Old/New)</th>
                <th className="py-3 px-2 w-32">Effectivity Date</th>
                <th className="py-3 px-2">Contact Person</th>
                <th className="py-3 px-2">Product/Service</th>
                <th className="py-3 px-2">Volume Delivered</th>
                {!readOnly && <th className="py-3 px-2 w-14"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B5BFCD]/30 text-slate-800">
              {record.internationalMarkets.map((m) => (
                <tr key={m.id} className="hover:bg-[#E6EEF4]/30 transition group">
                  <td className="p-2">
                    <input
                      type="text"
                      value={m.marketName}
                      onChange={(e) => handleUpdateIntl(m.id, 'marketName', e.target.value)}
                      readOnly={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={m.address}
                      onChange={(e) => handleUpdateIntl(m.id, 'address', e.target.value)}
                      readOnly={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-700 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1 text-center">
                    <select
                      value={m.condition}
                      onChange={(e) => handleUpdateIntl(m.id, 'condition', e.target.value as any)}
                      disabled={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-1.5 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    >
                      <option value="OLD">Old (&gt;3 mos)</option>
                      <option value="NEW">New</option>
                    </select>
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={m.effectivityDate || ''}
                      onChange={(e) => handleUpdateIntl(m.id, 'effectivityDate', e.target.value)}
                      placeholder="e.g. Q3 2024"
                      readOnly={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-700 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={m.contactPerson}
                      onChange={(e) => handleUpdateIntl(m.id, 'contactPerson', e.target.value)}
                      readOnly={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={m.productServiceSold}
                      onChange={(e) => handleUpdateIntl(m.id, 'productServiceSold', e.target.value)}
                      readOnly={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={m.volumeDelivered}
                      onChange={(e) => handleUpdateIntl(m.id, 'volumeDelivered', e.target.value)}
                      readOnly={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  {!readOnly && (
                    <td className="p-1 text-right w-14">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicateIntl(m.id)}
                          title="Duplicate row"
                          className="rounded-md p-1 text-slate-500 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
                        >
                          <Copy className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveIntl(m.id)}
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
                Local supermarket chains, pasalubong centers, provincial hubs, and direct display centers
              </p>
            </div>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={handleAddLocal}
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
                {!readOnly && <th className="py-3 px-2 w-14"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B5BFCD]/30 text-slate-800">
              {record.localMarkets.map((m) => (
                <tr key={m.id} className="hover:bg-[#E6EEF4]/30 transition group">
                  <td className="p-2">
                    <input
                      type="text"
                      value={m.marketName}
                      onChange={(e) => handleUpdateLocal(m.id, 'marketName', e.target.value)}
                      readOnly={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={m.address}
                      onChange={(e) => handleUpdateLocal(m.id, 'address', e.target.value)}
                      readOnly={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-700 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1 text-center">
                    <select
                      value={m.condition}
                      onChange={(e) => handleUpdateLocal(m.id, 'condition', e.target.value as any)}
                      disabled={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-1.5 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    >
                      <option value="OLD">Old (&gt;3 mos)</option>
                      <option value="NEW">New</option>
                    </select>
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={m.effectivityDate || ''}
                      onChange={(e) => handleUpdateLocal(m.id, 'effectivityDate', e.target.value)}
                      placeholder="e.g. Q3 2024"
                      readOnly={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-700 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={m.contactPerson}
                      onChange={(e) => handleUpdateLocal(m.id, 'contactPerson', e.target.value)}
                      readOnly={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={m.productServiceSold}
                      onChange={(e) => handleUpdateLocal(m.id, 'productServiceSold', e.target.value)}
                      readOnly={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={m.volumeDelivered}
                      onChange={(e) => handleUpdateLocal(m.id, 'volumeDelivered', e.target.value)}
                      readOnly={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  {!readOnly && (
                    <td className="p-1 text-right w-14">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicateLocal(m.id)}
                          title="Duplicate row"
                          className="rounded-md p-1 text-slate-500 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
                        >
                          <Copy className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveLocal(m.id)}
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
              {!readOnly && (
                <button
                  type="button"
                  onClick={handleAddDistributor}
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
                    <th className="py-3 px-2 text-center w-20">Male</th>
                    <th className="py-3 px-2 text-center w-20">Female</th>
                    <th className="py-3 px-3 text-right w-24">Total</th>
                    {!readOnly && <th className="py-3 px-2 w-14"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#B5BFCD]/30">
                  {record.forwardDistributors.map((d) => (
                    <tr key={d.id} className="hover:bg-[#E6EEF4]/30 transition group">
                      <td className="p-2">
                        <input
                          type="text"
                          value={d.name}
                          onChange={(e) => handleUpdateDistributor(d.id, 'name', e.target.value)}
                          readOnly={readOnly}
                          className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 font-normal text-slate-800 text-xs focus:border-[#285497] focus:outline-none"
                        />
                      </td>
                      <td className="p-1 text-center">
                        <input
                          type="number"
                          value={d.male}
                          onChange={(e) => handleUpdateDistributor(d.id, 'male', Number(e.target.value))}
                          readOnly={readOnly}
                          className="h-8 w-16 mx-auto rounded-lg border border-[#B5BFCD] bg-white text-center font-normal text-slate-800 text-xs focus:border-[#285497] focus:outline-none"
                        />
                      </td>
                      <td className="p-1 text-center">
                        <input
                          type="number"
                          value={d.female}
                          onChange={(e) => handleUpdateDistributor(d.id, 'female', Number(e.target.value))}
                          readOnly={readOnly}
                          className="h-8 w-16 mx-auto rounded-lg border border-[#B5BFCD] bg-white text-center font-normal text-slate-800 text-xs focus:border-[#285497] focus:outline-none"
                        />
                      </td>
                      <td className="p-2 text-right font-black text-[#285497] text-xs">
                        {d.total}
                      </td>
                      {!readOnly && (
                        <td className="p-1 text-right w-14">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleDuplicateDistributor(d.id)}
                              title="Duplicate row"
                              className="rounded-md p-1 text-slate-500 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
                            >
                              <Copy className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveDistributor(d.id)}
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
                    <td className="py-3 px-3 text-xs uppercase text-[#285497] font-black" colSpan={3}>TOTAL (Distributor Workforce)</td>
                    <td className="py-3 px-3 text-right font-black text-[#285497] text-xs">
                      {totalDistributorStaff}
                    </td>
                    {!readOnly && <td className="py-3 px-2 w-14"></td>}
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
              {!readOnly && (
                <button
                  type="button"
                  onClick={handleAddSupplier}
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
                    <th className="py-3 px-2 text-center w-20">Male</th>
                    <th className="py-3 px-2 text-center w-20">Female</th>
                    <th className="py-3 px-3 text-right w-24">Total</th>
                    {!readOnly && <th className="py-3 px-2 w-14"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#B5BFCD]/30">
                  {record.forwardSuppliers.map((s) => (
                    <tr key={s.id} className="hover:bg-[#E6EEF4]/30 transition group">
                      <td className="p-2">
                        <input
                          type="text"
                          value={s.name}
                          onChange={(e) => handleUpdateSupplier(s.id, 'name', e.target.value)}
                          readOnly={readOnly}
                          className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 font-normal text-slate-800 text-xs focus:border-[#285497] focus:outline-none"
                        />
                      </td>
                      <td className="p-1 text-center">
                        <input
                          type="number"
                          value={s.male}
                          onChange={(e) => handleUpdateSupplier(s.id, 'male', Number(e.target.value))}
                          readOnly={readOnly}
                          className="h-8 w-16 mx-auto rounded-lg border border-[#B5BFCD] bg-white text-center font-normal text-slate-800 text-xs focus:border-[#285497] focus:outline-none"
                        />
                      </td>
                      <td className="p-1 text-center">
                        <input
                          type="number"
                          value={s.female}
                          onChange={(e) => handleUpdateSupplier(s.id, 'female', Number(e.target.value))}
                          readOnly={readOnly}
                          className="h-8 w-16 mx-auto rounded-lg border border-[#B5BFCD] bg-white text-center font-normal text-slate-800 text-xs focus:border-[#285497] focus:outline-none"
                        />
                      </td>
                      <td className="p-2 text-right font-black text-[#285497] text-xs">
                        {s.total}
                      </td>
                      {!readOnly && (
                        <td className="p-1 text-right w-14">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleDuplicateSupplier(s.id)}
                              title="Duplicate row"
                              className="rounded-md p-1 text-slate-500 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
                            >
                              <Copy className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveSupplier(s.id)}
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
                    <td className="py-3 px-3 text-xs uppercase text-[#285497] font-black" colSpan={3}>TOTAL (Supplier Workforce)</td>
                    <td className="py-3 px-3 text-right font-black text-[#285497] text-xs">
                      {totalSupplierStaff}
                    </td>
                    {!readOnly && <td className="py-3 px-2 w-14"></td>}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
