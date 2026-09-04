import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import {
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
} from 'lucide-react'
import Swal from 'sweetalert2'

import { AdminSelect } from '../../components/admin/AdminFilters'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { AdminPanel } from '../../components/admin/AdminPanel'
import { DataTable, type DataColumn } from '../../components/admin/DataTable'
import { EquipmentRegistrationModal } from '../../components/admin/equipment/EquipmentRegistrationModal'
import { InspectionLogModal } from '../../components/admin/equipment/InspectionLogModal'
import { QrStickerSheetModal } from '../../components/admin/equipment/QrStickerSheetModal'
import { MetricCard } from '../../components/admin/MetricCard'
import { ModalShell } from '../../components/admin/ModalShell'
import type { EquipmentRecord, Program } from '../../data/admin'
import {
  equipmentErrorMessage,
  fetchEquipment,
  fetchEquipmentDetails,
  fetchEquipmentRegistrationOptions,
  type EquipmentRegistrationOptions,
  type EquipmentStatistics,
} from '../../services/equipmentStore'
import { cn } from '../../utils/cn'

const QrScannerModal = lazy(() => import('../../components/admin/equipment/QrScannerModal').then((module) => ({ default: module.QrScannerModal })))

type ProgramFilters = Record<Program, { categoryId: string; condition: string }>

const emptyStatistics: EquipmentStatistics = {
  condition_alerts: 0,
  currently_issued: 0,
  good_condition: 0,
  total_equipment: 0,
}

function conditionClass(condition: EquipmentRecord['condition']): string {
  if (condition === 'Good') return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
  if (condition === 'Fair') return 'bg-sky-50 text-sky-700 ring-sky-200'
  if (condition === 'Poor') return 'bg-amber-50 text-amber-800 ring-amber-200'
  return 'bg-rose-50 text-rose-700 ring-rose-200'
}

function InventoryActions({ equipment, onInspect }: { equipment: EquipmentRecord; onInspect: (equipment: EquipmentRecord) => void }) {
  return (
    <button aria-label={`Open ${equipment.name} inspection report`} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#0f53b7] px-3 text-xs font-bold text-white transition hover:bg-[#0b3f8b]" onClick={() => onInspect(equipment)} title="Open inspection report" type="button"><ClipboardCheck className="size-3.5" />Report</button>
  )
}

export function InventoryPage() {
  const [activeProgram, setActiveProgram] = useState<Program | null>(null)
  const [options, setOptions] = useState<EquipmentRegistrationOptions>({ categories: [], programs: [], projects: [] })
  const [equipmentByProgram, setEquipmentByProgram] = useState<Record<Program, EquipmentRecord[]>>({ SETUP: [], GIA: [] })
  const [statisticsByProgram, setStatisticsByProgram] = useState<Record<Program, EquipmentStatistics>>({ SETUP: emptyStatistics, GIA: emptyStatistics })
  const [filters, setFilters] = useState<ProgramFilters>({ SETUP: { categoryId: 'all', condition: 'all' }, GIA: { categoryId: 'all', condition: 'all' } })
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [registrationOpen, setRegistrationOpen] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [printOpen, setPrintOpen] = useState(false)
  const [inspectionAsset, setInspectionAsset] = useState<EquipmentRecord | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoadingOptions(true)
    fetchEquipmentRegistrationOptions()
      .then((result) => {
        if (cancelled) return
        setOptions(result)
        setActiveProgram(result.programs.includes('SETUP') ? 'SETUP' : result.programs[0] ?? null)
      })
      .catch((error) => { if (!cancelled) setLoadError(equipmentErrorMessage(error)) })
      .finally(() => { if (!cancelled) setIsLoadingOptions(false) })
    return () => { cancelled = true }
  }, [])

  const loadEquipment = useCallback(async (program: Program) => {
    const currentFilters = filters[program]
    setIsLoading(true)
    setLoadError(null)
    try {
      const result = await fetchEquipment({
        categoryId: currentFilters.categoryId === 'all' ? undefined : Number(currentFilters.categoryId),
        condition: currentFilters.condition === 'all' ? undefined : currentFilters.condition,
        program,
      })
      setEquipmentByProgram((current) => ({ ...current, [program]: result.equipment }))
      setStatisticsByProgram((current) => ({ ...current, [program]: result.statistics }))
      if (result.categories.length) setOptions((current) => ({ ...current, categories: result.categories }))
    } catch (error) {
      setLoadError(equipmentErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    if (activeProgram) void loadEquipment(activeProgram)
  }, [activeProgram, loadEquipment])

  const equipment = activeProgram ? equipmentByProgram[activeProgram] : []
  const statistics = activeProgram ? statisticsByProgram[activeProgram] : emptyStatistics
  const activeFilters = activeProgram ? filters[activeProgram] : { categoryId: 'all', condition: 'all' }

  function updateFilter(key: 'categoryId' | 'condition', value: string) {
    if (!activeProgram) return
    setFilters((current) => ({ ...current, [activeProgram]: { ...current[activeProgram], [key]: value } }))
  }

  function replaceEquipment(updated: EquipmentRecord) {
    const program = updated.program
    if (!program) return
    setEquipmentByProgram((current) => {
      const exists = current[program].some((item) => item.backendId === updated.backendId)
      return { ...current, [program]: exists ? current[program].map((item) => item.backendId === updated.backendId ? updated : item) : [updated, ...current[program]] }
    })
  }

  async function openInspection(asset: EquipmentRecord) {
    if (!asset.backendId) {
      setInspectionAsset(asset)
      return
    }
    try {
      setInspectionAsset(await fetchEquipmentDetails(asset.backendId))
    } catch (error) {
      void Swal.fire({ icon: 'error', text: equipmentErrorMessage(error), title: 'Could not open inspection report' })
    }
  }

  function handleRegistrationSaved(saved: EquipmentRecord, keepOpen = false) {
    replaceEquipment(saved)
    if (!keepOpen) setRegistrationOpen(false)
    if (activeProgram) void loadEquipment(activeProgram)
    void Swal.fire({ icon: 'success', position: 'top-end', showConfirmButton: false, text: keepOpen ? `${saved.name} was saved. You can enter the next item under the same project.` : `${saved.name} was registered and its QR code is ready to print.`, timer: 2800, timerProgressBar: true, title: 'Equipment registered', toast: true })
  }

  function handleInspectionSaved(updated: EquipmentRecord) {
    replaceEquipment(updated)
    setInspectionAsset(null)
    if (activeProgram) void loadEquipment(activeProgram)
    void Swal.fire({ icon: 'success', position: 'top-end', showConfirmButton: false, text: `${updated.name} is now recorded as ${updated.condition}.`, timer: 2600, timerProgressBar: true, title: 'Inspection recorded', toast: true })
  }

  const columns: DataColumn<EquipmentRecord>[] = useMemo(() => [
    { id: 'equipment', header: 'Equipment', className: 'w-[24%]', sortValue: (item) => item.name, render: (item) => <div><p className="font-bold text-slate-900">{item.name}</p><p className="mt-1 font-mono text-[11px] text-[#0f53b7]">{item.propertyNumber || item.id}</p><p className="mt-0.5 text-xs text-slate-500">SN: {item.serialNumber || 'Not recorded'}</p></div> },
    { id: 'project', header: 'Project / Cooperator', className: 'w-[23%]', sortValue: (item) => item.assignedTo, render: (item) => <div><p className="font-semibold text-slate-800">{item.assignedTo}</p><p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.projectTitle}</p><p className="mt-0.5 font-mono text-[10px] text-slate-400">{item.projectId}</p></div> },
    { id: 'location', header: 'Category / Location', className: 'w-[20%]', sortValue: (item) => item.category || '', render: (item) => <div><p className="font-semibold text-slate-700">{item.category || 'Uncategorized'}</p><p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.location}</p></div> },
    { id: 'condition', header: 'Condition', className: 'w-[11%]', sortValue: (item) => item.condition, render: (item) => <span className={cn('inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ring-inset', conditionClass(item.condition))}>{item.condition}</span> },
    { id: 'inspection', header: 'Last inspected', className: 'w-[12%]', sortValue: (item) => item.lastCheckedAt || '', render: (item) => <span className="text-xs leading-5 text-slate-500">{item.lastScanned}</span> },
    { id: 'actions', header: 'Actions', className: 'w-[10%] text-right', render: (item) => <InventoryActions equipment={item} onInspect={(selected) => void openInspection(selected)} /> },
  ], [])

  if (isLoadingOptions && !activeProgram) {
    return <div className="grid min-h-[60vh] place-items-center"><div className="text-center"><LoaderCircle className="mx-auto size-8 animate-spin text-[#0f53b7]" /><p className="mt-3 text-sm font-bold text-slate-600">Preparing equipment inventory…</p></div></div>
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        action={activeProgram ? <div className="flex flex-wrap gap-2"><button className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#0f53b7] bg-white px-4 text-sm font-bold text-[#0f53b7] shadow-sm transition hover:bg-blue-50" onClick={() => setPrintOpen(true)} type="button"><Printer className="size-4" />Print QR Sheet</button><button className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0f53b7] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#0b3f8b]" onClick={() => setScannerOpen(true)} type="button"><Camera className="size-4" />Scan Asset QR</button><button className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#0f53b7] bg-white px-4 text-sm font-bold text-[#0f53b7] shadow-sm transition hover:bg-blue-50" onClick={() => setRegistrationOpen(true)} type="button"><Plus className="size-4" />Register Equipment</button></div> : null}
        description="Register QR-tagged assets, record DOST inspections, and print physical equipment labels."
        eyebrow="Asset Accountability"
        title="Equipment Inventory"
      />

      {options.programs.length > 1 ? (
        <nav aria-label="Equipment program" className="inline-flex rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
          {options.programs.map((program) => { const selected = activeProgram === program; return <button aria-current={selected ? 'page' : undefined} className={cn('min-w-32 rounded-xl px-5 py-2.5 text-sm font-black transition', selected ? 'bg-[#0f53b7] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-[#0f53b7]')} key={program} onClick={() => setActiveProgram(program)} type="button">{program}<span className={cn('ml-2 rounded-full px-2 py-0.5 text-[10px]', selected ? 'bg-white/20' : 'bg-slate-100')}>{statisticsByProgram[program].total_equipment}</span></button> })}
        </nav>
      ) : null}

      {activeProgram ? <>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard detail={`Registered ${activeProgram} QR-tagged assets`} icon={Boxes} label="Total Equipment" value={String(statistics.total_equipment)} />
          <MetricCard detail="Assigned or issued to cooperators" icon={PackageCheck} label="Currently Issued" tone="sky" value={String(statistics.currently_issued)} />
          <MetricCard detail="Latest inspection verified as good" icon={CircleCheck} label="Good Condition" tone="green" value={String(statistics.good_condition)} />
          <MetricCard detail="Fair, poor, or non-functional" icon={Wrench} label="Condition Alerts" tone="red" value={String(statistics.condition_alerts)} />
        </section>

        <AdminPanel description={`${equipment.length} filtered ${activeProgram} equipment records shown.`} title={`${activeProgram} equipment registry`}>
          {loadError ? <div className="flex flex-col gap-3 border-b border-rose-100 bg-rose-50 px-5 py-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between" role="alert"><p className="font-semibold">{loadError}</p><button className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-white px-3 text-xs font-bold text-rose-700 shadow-sm" onClick={() => void loadEquipment(activeProgram)} type="button"><RefreshCw className="size-3.5" />Retry</button></div> : null}
          <DataTable
            columns={columns}
            data={equipment}
            emptyDescription={`No ${activeProgram} equipment matches the selected category and condition.`}
            emptyTitle={`No ${activeProgram} equipment found`}
            fitColumns
            getRowKey={(item) => item.id}
            initialRowsPerPage={6}
            isLoading={isLoading}
            key={activeProgram}
            searchPlaceholder={`Search ${activeProgram} equipment, asset ID, project, cooperator, or location…`}
            searchText={(item) => `${item.id} ${item.propertyNumber} ${item.name} ${item.serialNumber} ${item.projectId} ${item.projectTitle} ${item.assignedTo} ${item.location} ${item.category} ${item.condition}`}
            toolbar={<><AdminSelect label="Filter by category" onChange={(value) => updateFilter('categoryId', value)} options={[{ label: 'All categories', value: 'all' }, ...options.categories.map((category) => ({ label: category.category_name, value: String(category.id) }))]} value={activeFilters.categoryId} /><AdminSelect label="Filter by condition" onChange={(value) => updateFilter('condition', value)} options={[{ label: 'All conditions', value: 'all' }, { label: 'Good', value: 'GOOD' }, { label: 'Fair', value: 'FAIR' }, { label: 'Poor', value: 'POOR' }, { label: 'Non-functional', value: 'NON_FUNCTIONAL' }]} value={activeFilters.condition} /></>}
            variant="clean"
          />
        </AdminPanel>
      </> : <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center"><p className="font-bold text-amber-900">Your account has no assigned equipment program.</p><p className="mt-1 text-sm text-amber-700">Ask an administrator to assign SETUP or GIA access.</p></div>}

      {activeProgram && registrationOpen ? <EquipmentRegistrationModal onClose={() => setRegistrationOpen(false)} onSaved={handleRegistrationSaved} options={options} program={activeProgram} /> : null}
      {activeProgram && printOpen ? <QrStickerSheetModal equipment={equipmentByProgram[activeProgram]} onClose={() => setPrintOpen(false)} program={activeProgram} /> : null}
      {scannerOpen ? <Suspense fallback={<ModalShell description="Preparing secure camera access…" onClose={() => setScannerOpen(false)} title="Scan Asset QR Code" width="md"><div className="grid min-h-72 place-items-center text-center"><div><LoaderCircle className="mx-auto size-8 animate-spin text-[#0f53b7]" /><p className="mt-3 text-sm font-bold text-slate-700">Loading scanner…</p></div></div></ModalShell>}><QrScannerModal onAssetResolved={(asset) => { setScannerOpen(false); setInspectionAsset(asset) }} onClose={() => setScannerOpen(false)} /></Suspense> : null}
      {inspectionAsset ? <InspectionLogModal asset={inspectionAsset} onClose={() => setInspectionAsset(null)} onSaved={handleInspectionSaved} /> : null}
    </div>
  )
}
