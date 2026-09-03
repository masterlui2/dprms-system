import { lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from 'react'
import {
  Boxes,
  Camera,
  CircleCheck,
  Eye,
  LoaderCircle,
  PackageCheck,
  Pencil,
  Plus,
  QrCode,
  RefreshCw,
  Wrench,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import Swal from 'sweetalert2'

import { AdminSelect } from '../../components/admin/AdminFilters'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { AdminPanel } from '../../components/admin/AdminPanel'
import {
  DataTable,
  type DataColumn,
} from '../../components/admin/DataTable'
import { MetricCard } from '../../components/admin/MetricCard'
import { ModalShell } from '../../components/admin/ModalShell'
import { InspectionLogModal } from '../../components/admin/equipment/InspectionLogModal'
import {
  projectRecords,
  type EquipmentRecord,
} from '../../data/admin'
import {
  equipmentErrorMessage,
  fetchEquipment,
} from '../../services/equipmentStore'
import { cn } from '../../utils/cn'

const QrScannerModal = lazy(() =>
  import('../../components/admin/equipment/QrScannerModal').then((module) => ({
    default: module.QrScannerModal,
  })),
)

type EquipmentModalMode =
  | 'register'
  | 'view'
  | 'edit'
  | 'qr'
  | 'print'
  | 'delete'

interface EquipmentModalState {
  equipment?: EquipmentRecord
  mode: EquipmentModalMode
}

function conditionClass(condition: EquipmentRecord['condition']): string {
  if (condition === 'Good') return 'text-emerald-700'
  if (condition === 'Fair') return 'text-sky-700'
  if (condition === 'Poor') return 'text-amber-700'
  return 'text-red-600'
}

function Field({
  label,
  children,
}: {
  children: ReactNode
  label: string
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm font-bold text-slate-800">{label}</span>
      {children}
    </label>
  )
}

const fieldClass =
  'h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100'

function EquipmentForm({
  equipment,
}: {
  equipment?: EquipmentRecord
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Equipment Name">
        <input
          className={fieldClass}
          defaultValue={equipment?.name}
          placeholder="e.g. Vacuum Packaging Machine"
        />
      </Field>
      <Field label="Equipment Category">
        <select className={fieldClass} defaultValue="Production Equipment">
          <option>Production Equipment</option>
          <option>Processing Equipment</option>
          <option>Testing Equipment</option>
          <option>ICT Equipment</option>
        </select>
      </Field>
      <Field label="Serial Number">
        <input
          className={fieldClass}
          defaultValue={equipment ? `SN-${equipment.id.slice(3)}-2026` : ''}
          placeholder="Enter manufacturer serial number"
        />
      </Field>
      <Field label="Brand">
        <input className={fieldClass} placeholder="Enter equipment brand" />
      </Field>
      <Field label="Model">
        <input className={fieldClass} placeholder="Enter model name or number" />
      </Field>
      <Field label="Assigned Project">
        <select className={fieldClass} defaultValue={equipment?.projectId ?? ''}>
          <option value="">Select project</option>
          {projectRecords.map((project) => (
            <option key={project.id} value={project.id}>
              {project.id} - {project.title}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Assigned Beneficiary">
        <input
          className={fieldClass}
          defaultValue={equipment?.assignedTo}
          placeholder="Enter beneficiary or organization"
        />
      </Field>
      <Field label="Condition">
        <select className={fieldClass} defaultValue={equipment?.condition ?? 'Good'}>
          <option>Good</option>
          <option>Fair</option>
          <option>Poor</option>
          <option>Non-functional</option>
        </select>
      </Field>
      <label className="space-y-1.5 sm:col-span-2">
        <span className="text-sm font-bold text-slate-800">Remarks</span>
        <textarea
          className="min-h-28 w-full resize-y rounded-lg border border-slate-300 p-3 text-sm outline-none transition focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100"
          placeholder="Add equipment condition, assignment, or registration notes."
        />
      </label>
    </div>
  )
}

function EquipmentQrPanel({ equipment }: { equipment: EquipmentRecord }) {
  return (
    <section className="grid gap-6 rounded-xl border border-slate-200 bg-slate-50 p-5 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
      <div className="text-center">
        <div className="mx-auto grid size-48 place-items-center rounded-xl border-4 border-slate-900 bg-white p-2">
          {equipment.qrData ? (
            <QRCodeSVG
              bgColor="#ffffff"
              fgColor="#020617"
              level="H"
              marginSize={1}
              size={168}
              title={`${equipment.name} asset QR code`}
              value={equipment.qrData}
            />
          ) : (
            <div className="px-4 text-center">
              <QrCode className="mx-auto size-16 text-slate-300" />
              <p className="mt-2 text-xs font-bold text-slate-500">No active QR code</p>
            </div>
          )}
        </div>
        <p className="mt-3 font-mono text-sm font-black text-[#073b82]">
          {equipment.id}
        </p>
      </div>

      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        {[
          ['Equipment Name', equipment.name],
          ['Assigned Project', equipment.projectTitle || equipment.projectId],
          ['Beneficiary', equipment.assignedTo],
          ['Current Location', equipment.location],
          ['Condition', equipment.condition],
          ['Asset Status', equipment.status],
          ['Last Inspection', equipment.lastScanned],
          ['Serial Number', equipment.serialNumber || 'Not recorded'],
        ].map(([label, value]) => (
          <div className="border-b border-slate-200 pb-3" key={label}>
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">
              {label}
            </dt>
            <dd className="mt-1 font-bold text-slate-800">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function EquipmentModal({
  onClose,
  onModeChange,
  state,
}: {
  onClose: () => void
  onModeChange: (mode: EquipmentModalMode) => void
  state: EquipmentModalState
}) {
  const equipment = state.equipment
  const isForm = state.mode === 'register' || state.mode === 'edit'
  const title =
    state.mode === 'register'
      ? 'Register Equipment'
      : state.mode === 'edit'
        ? 'Edit Equipment'
        : state.mode === 'delete'
          ? 'Delete Equipment'
          : state.mode === 'view'
            ? 'Equipment Details'
            : state.mode === 'print'
              ? 'Print QR Code'
              : 'Generate QR Code'

  return (
    <ModalShell
      description={
        equipment
          ? `${equipment.id} - ${equipment.name}`
          : 'Create a mock equipment registry record.'
      }
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            className="h-10 rounded-lg px-4 text-sm font-bold text-slate-600 hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          {isForm ? (
            <button
              className="h-10 rounded-lg bg-[#0f53b7] px-4 text-sm font-bold text-white hover:bg-[#0b3f8b]"
              type="button"
            >
              {state.mode === 'register' ? 'Register Equipment' : 'Save Changes'}
            </button>
          ) : null}
          {state.mode === 'delete' ? (
            <button
              className="h-10 rounded-lg bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700"
              type="button"
            >
              Delete Equipment
            </button>
          ) : null}
          {state.mode === 'view' ? (
            <>
              <button
                className="h-10 rounded-lg px-3 text-sm font-bold text-[#0f53b7] hover:bg-blue-50"
                onClick={() => onModeChange('edit')}
                type="button"
              >
                Edit
              </button>
              <button
                className="h-10 rounded-lg px-3 text-sm font-bold text-[#0f53b7] hover:bg-blue-50"
                onClick={() => onModeChange('qr')}
                type="button"
              >
                Generate QR
              </button>
              <button
                className="h-10 rounded-lg px-3 text-sm font-bold text-[#0f53b7] hover:bg-blue-50"
                onClick={() => onModeChange('print')}
                type="button"
              >
                Print QR
              </button>
              <button
                className="h-10 rounded-lg px-3 text-sm font-bold text-red-600 hover:bg-red-50"
                onClick={() => onModeChange('delete')}
                type="button"
              >
                Delete
              </button>
            </>
          ) : null}
          {state.mode === 'print' ? (
            <button
              className="h-10 rounded-lg bg-[#0f53b7] px-4 text-sm font-bold text-white"
              type="button"
            >
              Print QR Code
            </button>
          ) : null}
        </div>
      }
      onClose={onClose}
      title={title}
      width={isForm ? 'lg' : 'md'}
    >
      {isForm ? <EquipmentForm equipment={equipment} /> : null}

      {state.mode === 'view' && equipment ? (
        <EquipmentQrPanel equipment={equipment} />
      ) : null}

      {(state.mode === 'qr' || state.mode === 'print') && equipment ? (
        <EquipmentQrPanel equipment={equipment} />
      ) : null}

      {state.mode === 'delete' && equipment ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="font-bold text-red-800">
            Remove {equipment.name} from the mock registry?
          </p>
          <p className="mt-2 text-sm leading-6 text-red-700">
            This frontend-only action is shown for interface testing and does
            not remove stored data.
          </p>
        </div>
      ) : null}
    </ModalShell>
  )
}

export function InventoryPage() {
  const [condition, setCondition] = useState('all')
  const [modal, setModal] = useState<EquipmentModalState | null>(null)
  const [equipment, setEquipment] = useState<EquipmentRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [inspectionAsset, setInspectionAsset] = useState<EquipmentRecord | null>(null)

  const loadEquipment = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      setEquipment(await fetchEquipment())
    } catch (error) {
      setLoadError(equipmentErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadEquipment()
  }, [loadEquipment])

  const visibleEquipment = equipment.filter(
    (equipment) =>
      condition === 'all' || equipment.condition === condition,
  )

  function openModal(mode: EquipmentModalMode, equipment?: EquipmentRecord) {
    setModal({ mode, equipment })
  }

  function handleInspectionSaved(updated: EquipmentRecord) {
    setEquipment((current) => {
      const exists = current.some((item) => item.backendId === updated.backendId)
      return exists
        ? current.map((item) => item.backendId === updated.backendId ? updated : item)
        : [updated, ...current]
    })
    setInspectionAsset(null)
    void Swal.fire({
      icon: 'success',
      position: 'top-end',
      showConfirmButton: false,
      text: `${updated.name} is now recorded as ${updated.condition}.`,
      timer: 2600,
      timerProgressBar: true,
      title: 'Inspection recorded',
      toast: true,
    })
  }

  const columns: DataColumn<EquipmentRecord>[] = [
    {
      id: 'asset',
      header: 'Equipment',
      sortValue: (equipment) => equipment.name,
      render: (equipment) => (
        <div>
          <p className="font-bold text-slate-900">{equipment.name}</p>
          <p className="mt-1 font-mono text-xs text-slate-500">
            {equipment.id} - {equipment.projectId}
          </p>
        </div>
      ),
    },
    {
      id: 'assignment',
      header: 'Assigned Beneficiary',
      sortValue: (equipment) => equipment.assignedTo,
      render: (equipment) => equipment.assignedTo,
    },
    {
      id: 'location',
      header: 'Location',
      sortValue: (equipment) => equipment.location,
      render: (equipment) => (
        <span className="text-slate-600">{equipment.location}</span>
      ),
    },
    {
      id: 'condition',
      header: 'Condition',
      sortValue: (equipment) => equipment.condition,
      render: (equipment) => (
        <span className={cn('font-bold', conditionClass(equipment.condition))}>
          {equipment.condition}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortValue: (equipment) => equipment.status,
      render: (equipment) => (
        <span className="font-semibold text-slate-700">{equipment.status}</span>
      ),
    },
    {
      id: 'scan',
      header: 'Last Scan',
      sortValue: (equipment) => equipment.lastScanned,
      render: (equipment) => (
        <span className="text-xs text-slate-500">{equipment.lastScanned}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (equipment) => (
        <div className="flex justify-end gap-1">
          <button
            aria-label={`View ${equipment.id}`}
            className="inline-flex size-8 items-center justify-center rounded-lg text-[#0f53b7] transition hover:bg-blue-50"
            onClick={() => openModal('view', equipment)}
            title="View equipment"
            type="button"
          >
            <Eye className="size-4" />
          </button>
          <button
            aria-label={`Edit ${equipment.id}`}
            className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-[#0f53b7]"
            onClick={() => openModal('edit', equipment)}
            title="Edit equipment"
            type="button"
          >
            <Pencil className="size-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-7">
      <AdminPageHeader
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0f53b7] px-4 text-sm font-bold text-white shadow-lg shadow-blue-900/15 transition hover:bg-[#0b3f8b]"
              onClick={() => setScannerOpen(true)}
              type="button"
            >
              <Camera className="size-4" />
              Scan Asset QR
            </button>
            <button
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#0f53b7] bg-white px-4 text-sm font-bold text-[#0f53b7] shadow-sm transition hover:bg-blue-50"
              onClick={() => openModal('register')}
              type="button"
            >
              <Plus className="size-4" />
              Register Equipment
            </button>
          </div>
        }
        description="Track QR-tagged equipment issuance, assignment, condition, location, and return transactions."
        eyebrow="Asset Accountability"
        title="Equipment & QR Codes"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail="Registered QR-tagged assets"
          icon={Boxes}
          label="Total Equipment"
          value={String(equipment.length)}
        />
        <MetricCard
          detail="Assigned to beneficiaries"
          icon={PackageCheck}
          label="Currently Issued"
          tone="sky"
          value={String(
            equipment.filter((item) => item.status === 'Issued').length,
          )}
        />
        <MetricCard
          detail="Verified in good condition"
          icon={CircleCheck}
          label="Good Condition"
          tone="green"
          value={String(
            equipment.filter((item) => item.condition === 'Good').length,
          )}
        />
        <MetricCard
          detail="Inspection or repair required"
          icon={Wrench}
          label="Condition Alerts"
          tone="red"
          value={String(
            equipment.filter((item) => item.condition !== 'Good').length,
          )}
        />
      </section>

      <AdminPanel
        description={`${visibleEquipment.length} equipment records shown.`}
        title="Equipment registry"
      >
        {loadError ? (
          <div className="flex flex-col gap-3 border-b border-rose-100 bg-rose-50 px-5 py-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between" role="alert">
            <p className="font-semibold">{loadError}</p>
            <button
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-white px-3 text-xs font-bold text-rose-700 shadow-sm"
              onClick={() => void loadEquipment()}
              type="button"
            >
              <RefreshCw className="size-3.5" /> Retry
            </button>
          </div>
        ) : null}
        <DataTable
          columns={columns}
          data={visibleEquipment}
          emptyDescription="No equipment matches the selected condition."
          emptyTitle="No equipment found"
          getRowKey={(equipment) => equipment.id}
          isLoading={isLoading}
          searchPlaceholder="Search equipment, ID, project, beneficiary, or location..."
          searchText={(equipment) =>
            `${equipment.id} ${equipment.name} ${equipment.projectId} ${equipment.assignedTo} ${equipment.location} ${equipment.condition} ${equipment.status}`
          }
          toolbar={
            <AdminSelect
              label="Filter by condition"
              onChange={setCondition}
              options={[
                { label: 'All conditions', value: 'all' },
                { label: 'Good', value: 'Good' },
                { label: 'Fair', value: 'Fair' },
                { label: 'Poor', value: 'Poor' },
                { label: 'Non-functional', value: 'Non-functional' },
              ]}
              value={condition}
            />
          }
        />
      </AdminPanel>

      {modal ? (
        <EquipmentModal
          onClose={() => setModal(null)}
          onModeChange={(mode) =>
            setModal({ mode, equipment: modal.equipment })
          }
          state={modal}
        />
      ) : null}

      {scannerOpen ? (
        <Suspense
          fallback={
            <ModalShell
              description="Preparing secure camera access…"
              onClose={() => setScannerOpen(false)}
              title="Scan Asset QR Code"
              width="md"
            >
              <div className="grid min-h-72 place-items-center text-center">
                <div>
                  <LoaderCircle className="mx-auto size-8 animate-spin text-[#0f53b7]" />
                  <p className="mt-3 text-sm font-bold text-slate-700">Loading scanner…</p>
                </div>
              </div>
            </ModalShell>
          }
        >
          <QrScannerModal
            onAssetResolved={(asset) => {
              setScannerOpen(false)
              setInspectionAsset(asset)
            }}
            onClose={() => setScannerOpen(false)}
          />
        </Suspense>
      ) : null}

      {inspectionAsset ? (
        <InspectionLogModal
          asset={inspectionAsset}
          onClose={() => setInspectionAsset(null)}
          onSaved={handleInspectionSaved}
        />
      ) : null}
    </div>
  )
}
