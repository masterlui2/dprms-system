import axios from 'axios'
import { Check, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import {
  fetchSiteVisitOptions,
  scheduleSiteVisit,
  type SiteVisitPersonnelOption,
  type SiteVisitProjectOption,
  type VisitPurpose,
} from '../../../services/siteVisitStore'
import { notifyNotificationsChanged } from '../../../services/notificationStore'
import { ModalShell } from '../ModalShell'

const purposes: Array<{ value: VisitPurpose; label: string }> = [
  { value: 'PRE_IMPLEMENTATION', label: 'Pre-Implementation' },
  { value: 'EQUIPMENT_ARRIVAL', label: 'Equipment Arrival' },
  { value: 'QUARTERLY_MONITORING', label: 'Quarterly Monitoring' },
  { value: 'ENERGY_AUDIT', label: 'Energy Audit' },
]

export function ScheduleSiteVisitModal({
  initialDate,
  onClose,
  onSaved,
}: {
  initialDate: string
  onClose: () => void
  onSaved: () => void
}) {
  const [projects, setProjects] = useState<SiteVisitProjectOption[]>([])
  const [personnel, setPersonnel] = useState<SiteVisitPersonnelOption[]>([])
  const [projectSearch, setProjectSearch] = useState('')
  const [selectedProject, setSelectedProject] = useState<SiteVisitProjectOption | null>(null)
  const [date, setDate] = useState(initialDate)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('11:00')
  const [purpose, setPurpose] = useState<VisitPurpose>('QUARTERLY_MONITORING')
  const [assignedIds, setAssignedIds] = useState<number[]>([])
  const [personnelSearch, setPersonnelSearch] = useState('')
  const [location, setLocation] = useState('')
  const [instructions, setInstructions] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSiteVisitOptions()
      .then((result) => {
        setProjects(result.projects)
        setPersonnel(result.personnel)
      })
      .catch(() => setError('Scheduling options could not be loaded.'))
      .finally(() => setLoading(false))
  }, [])

  const matchingProjects = useMemo(() => {
    const search = projectSearch.trim().toLowerCase()
    if (!search) return projects.slice(0, 8)
    return projects.filter((project) =>
      `${project.reference_number} ${project.title}`.toLowerCase().includes(search)).slice(0, 12)
  }, [projectSearch, projects])

  const availablePersonnel = personnel.filter((person) =>
    !selectedProject || person.programs.includes(selectedProject.program))

  const matchingPersonnel = availablePersonnel
    .filter((person) => `${person.name} ${person.role}`.toLowerCase().includes(personnelSearch.trim().toLowerCase()))
    .sort((left, right) => {
      const selectedOrder = Number(assignedIds.includes(right.id)) - Number(assignedIds.includes(left.id))
      return selectedOrder || left.name.localeCompare(right.name)
    })
    .slice(0, 50)

  function selectProject(project: SiteVisitProjectOption) {
    setSelectedProject(project)
    setProjectSearch(`${project.reference_number} — ${project.title}`)
    setLocation(project.location)
    setAssignedIds((ids) => ids.filter((id) =>
      personnel.find((person) => person.id === id)?.programs.includes(project.program)))
  }

  async function submit() {
    if (!selectedProject || assignedIds.length === 0) {
      setError('Choose a project and at least one officer.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await scheduleSiteVisit({
        project_id: selectedProject.id,
        scheduled_date: date,
        start_time: startTime,
        end_time: endTime,
        purpose,
        assigned_user_ids: assignedIds,
        facility_location: location,
        proponent_instructions: instructions,
      })
      notifyNotificationsChanged()
      onSaved()
    } catch (cause) {
      if (axios.isAxiosError(cause)) {
        const errors = cause.response?.data?.errors as Record<string, string[]> | undefined
        setError(errors ? Object.values(errors)[0]?.[0] : 'The visit could not be scheduled.')
      } else {
        setError('The visit could not be scheduled.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell
      description="Add a field visit"
      footer={
        <div className="flex justify-end gap-2">
          <button className="h-10 rounded-xl px-4 text-sm font-bold text-slate-600 hover:bg-slate-100" onClick={onClose} type="button">Cancel</button>
          <button className="h-10 rounded-xl bg-[#0f53b7] px-5 text-sm font-bold text-white disabled:opacity-60" disabled={saving || loading} onClick={() => void submit()} type="button">
            {saving ? 'Saving...' : 'Schedule Visit'}
          </button>
        </div>
      }
      onClose={onClose}
      title="Schedule Site Visit"
      width="lg"
    >
      {error ? <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <label className="text-sm font-bold text-slate-800">Project</label>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-3 size-4 text-slate-400" />
            <input className="h-10 w-full rounded-xl border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-[#0f53b7]" onChange={(event) => { setProjectSearch(event.target.value); setSelectedProject(null) }} placeholder="Search project or reference" value={projectSearch} />
          </div>
          {!selectedProject && !loading && (matchingProjects.length > 0 || projectSearch.trim()) ? (
            <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1">
              {matchingProjects.map((project) => (
                <button className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-blue-50" key={project.id} onClick={() => selectProject(project)} type="button">
                  <span className="min-w-0"><span className="block truncate text-sm font-bold text-slate-800">{project.title}</span><span className="text-xs text-slate-500">{project.reference_number}</span></span>
                  <span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-black text-[#0f53b7]">{project.program}</span>
                </button>
              ))}
              {!loading && matchingProjects.length === 0 ? <p className="px-3 py-4 text-center text-sm text-slate-500">No active project found</p> : null}
            </div>
          ) : null}
        </div>

        <label className="text-sm font-bold text-slate-800">Date<input className="mt-2 h-10 w-full rounded-xl border border-slate-300 px-3 font-normal outline-none focus:border-[#0f53b7]" min={new Date().toISOString().slice(0, 10)} onChange={(event) => setDate(event.target.value)} type="date" value={date} /></label>
        <label className="text-sm font-bold text-slate-800">Purpose<select className="mt-2 h-10 w-full rounded-xl border border-slate-300 px-3 font-normal outline-none focus:border-[#0f53b7]" onChange={(event) => setPurpose(event.target.value as VisitPurpose)} value={purpose}>{purposes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label className="text-sm font-bold text-slate-800">Start<input className="mt-2 h-10 w-full rounded-xl border border-slate-300 px-3 font-normal" onChange={(event) => setStartTime(event.target.value)} type="time" value={startTime} /></label>
        <label className="text-sm font-bold text-slate-800">End<input className="mt-2 h-10 w-full rounded-xl border border-slate-300 px-3 font-normal" onChange={(event) => setEndTime(event.target.value)} type="time" value={endTime} /></label>
        <label className="text-sm font-bold text-slate-800 lg:col-span-2">Location<input className="mt-2 h-10 w-full rounded-xl border border-slate-300 px-3 font-normal outline-none focus:border-[#0f53b7]" onChange={(event) => setLocation(event.target.value)} value={location} /></label>

        <div className="lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-slate-800">Assigned personnel</p>
            {assignedIds.length > 0 ? <span className="text-xs font-semibold text-[#0f53b7]">{assignedIds.length} selected</span> : null}
          </div>
          {loading ? <p className="mt-2 text-sm text-slate-500">Loading...</p> : null}
          {!loading && availablePersonnel.length > 0 ? <>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-3 size-4 text-slate-400" />
              <input aria-label="Search personnel" className="h-10 w-full rounded-xl border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-[#0f53b7]" onChange={(event) => setPersonnelSearch(event.target.value)} placeholder="Search personnel" value={personnelSearch} />
            </div>
            <div className="mt-2 grid max-h-40 gap-1.5 overflow-y-auto rounded-xl border border-slate-200 p-2 sm:grid-cols-2 lg:grid-cols-3">
            {matchingPersonnel.map((person) => {
              const checked = assignedIds.includes(person.id)
              return (
                <button className={`flex items-center gap-3 rounded-lg border px-3 py-1.5 text-left ${checked ? 'border-blue-300 bg-blue-50' : 'border-slate-200'}`} key={person.id} onClick={() => setAssignedIds((ids) => checked ? ids.filter((id) => id !== person.id) : [...ids, person.id])} type="button">
                  <span className={`grid size-5 place-items-center rounded border ${checked ? 'border-[#0f53b7] bg-[#0f53b7] text-white' : 'border-slate-300'}`}>{checked ? <Check className="size-3" /> : null}</span>
                  <span><span className="block text-sm font-bold text-slate-800">{person.name}</span><span className="text-xs text-slate-500">{person.role}</span></span>
                </button>
              )
            })}
            {matchingPersonnel.length === 0 ? <p className="col-span-full px-3 py-4 text-center text-sm text-slate-500">No personnel found</p> : null}
            </div>
            {availablePersonnel.length > 50 && !personnelSearch.trim() ? <p className="mt-1 text-xs text-slate-500">Search to view more personnel</p> : null}
          </> : null}
          {!loading && availablePersonnel.length === 0 ? <p className="mt-2 text-sm text-slate-500">No personnel available</p> : null}
        </div>

        <label className="text-sm font-bold text-slate-800 lg:col-span-2">Instructions <span className="font-normal text-slate-400">(optional)</span><textarea className="mt-2 min-h-16 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal outline-none focus:border-[#0f53b7]" onChange={(event) => setInstructions(event.target.value)} value={instructions} /></label>

      </div>
    </ModalShell>
  )
}
