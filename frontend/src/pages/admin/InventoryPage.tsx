import { useState, type ReactNode } from 'react'
import {
  Boxes,
  CircleCheck,
  Eye,
  PackageCheck,
  Pencil,
  Plus,
  QrCode,
  Wrench,
} from 'lucide-react'

import { AdminSelect } from '../../components/admin/AdminFilters'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { AdminPanel } from '../../components/admin/AdminPanel'
import {
  DataTable,
  type DataColumn,
} from '../../components/admin/DataTable'
import { MetricCard } from '../../components/admin/MetricCard'
import { ModalShell } from '../../components/admin/ModalShell'
import {
  equipmentRecords,
  projectRecords,
  type EquipmentRecord,
} from '../../data/admin'
import { cn } from '../../utils/cn'

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
  if (condition === 'For repair') return 'text-red-600'
  return 'text-amber-700'
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
          <option>Needs inspection</option>
          <option>For repair</option>
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
        <div className="mx-auto grid size-48 place-items-center rounded-xl border-4 border-slate-900 bg-white">
          <QrCode className="size-40 text-slate-950" strokeWidth={1.35} />
        </div>
        <p className="mt-3 font-mono text-sm font-black text-[#073b82]">
          {equipment.id}
        </p>
      </div>

      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        {[
          ['Equipment Name', equipment.name],
          ['Assigned Project', equipment.projectId],
          ['Beneficiary', equipment.assignedTo],
          ['Current Location', equipment.location],
          ['Condition', equipment.condition],
          ['Asset Status', equipment.status],
          ['Last Scanned', equipment.lastScanned],
          ['Serial Number', `SN-${equipment.id.slice(3)}-2026`],
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
  const visibleEquipment = equipmentRecords.filter(
    (equipment) =>
      condition === 'all' || equipment.condition === condition,
  )

  function openModal(mode: EquipmentModalMode, equipment?: EquipmentRecord) {
    setModal({ mode, equipment })
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
          <button
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0f53b7] px-4 text-sm font-bold text-white shadow-lg shadow-blue-900/15 transition hover:bg-[#0b3f8b]"
            onClick={() => openModal('register')}
            type="button"
          >
            <Plus className="size-4" />
            Register Equipment
          </button>
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
          value={String(equipmentRecords.length)}
        />
        <MetricCard
          detail="Assigned to beneficiaries"
          icon={PackageCheck}
          label="Currently Issued"
          tone="sky"
          value={String(
            equipmentRecords.filter((item) => item.status === 'Issued').length,
          )}
        />
        <MetricCard
          detail="Verified in good condition"
          icon={CircleCheck}
          label="Good Condition"
          tone="green"
          value={String(
            equipmentRecords.filter((item) => item.condition === 'Good').length,
          )}
        />
        <MetricCard
          detail="Inspection or repair required"
          icon={Wrench}
          label="Condition Alerts"
          tone="red"
          value={String(
            equipmentRecords.filter((item) => item.condition !== 'Good').length,
          )}
        />
      </section>

      <AdminPanel
        description={`${visibleEquipment.length} equipment records shown.`}
        title="Equipment registry"
      >
        <DataTable
          columns={columns}
          data={visibleEquipment}
          emptyDescription="No equipment matches the selected condition."
          emptyTitle="No equipment found"
          getRowKey={(equipment) => equipment.id}
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
                { label: 'Needs inspection', value: 'Needs inspection' },
                { label: 'For repair', value: 'For repair' },
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
    </div>
  )
}
