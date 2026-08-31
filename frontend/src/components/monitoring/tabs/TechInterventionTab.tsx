import {
  Award,
  BookOpen,
  Briefcase,
  Copy,
  Layers,
  Plus,
  TestTube,
  Trash2,
} from 'lucide-react'
import type {
  ConsultancyItem,
  OtherDostProjectItem,
  SetupMonitoringQuarterRecord,
  SupportServiceItem,
  TechTransferItem,
  TrainingItem,
} from '../../../types/setupMonitoring'

interface Props {
  record: SetupMonitoringQuarterRecord
  onChange: (record: SetupMonitoringQuarterRecord) => void
  readOnly?: boolean
}

export function TechInterventionTab({
  record,
  onChange,
  readOnly = false,
}: Props) {
  // 1. Consultancies
  const handleUpdateConsultancy = (id: string, field: keyof ConsultancyItem, val: any) => {
    const updated = record.consultancies.map((c) => {
      if (c.id !== id) return c
      return { ...c, [field]: val }
    })
    onChange({ ...record, consultancies: updated })
  }

  const handleAddConsultancy = () => {
    const newItem: ConsultancyItem = {
      id: 'cons_' + Date.now(),
      serviceName: 'Packaging and Labelling Assistance',
      availed: true,
      areaOfIntervention: 'Brand Design & Shelf-life Analysis',
      date: 'Aug 2024',
    }
    onChange({ ...record, consultancies: [...record.consultancies, newItem] })
  }

  const handleDuplicateConsultancy = (id: string) => {
    const target = record.consultancies.find((c) => c.id === id)
    if (!target) return
    const dup: ConsultancyItem = {
      ...target,
      id: 'cons_' + Date.now(),
      serviceName: `${target.serviceName} (Copy)`,
    }
    const idx = record.consultancies.findIndex((c) => c.id === id)
    const newItems = [...record.consultancies]
    newItems.splice(idx + 1, 0, dup)
    onChange({ ...record, consultancies: newItems })
  }

  const handleRemoveConsultancy = (id: string) => {
    onChange({
      ...record,
      consultancies: record.consultancies.filter((c) => c.id !== id),
    })
  }

  // 2. Trainings
  const handleUpdateTraining = (id: string, field: keyof TrainingItem, val: any) => {
    const updated = record.trainings.map((t) => {
      if (t.id !== id) return t
      return { ...t, [field]: val }
    })
    onChange({ ...record, trainings: updated })
  }

  const handleAddTraining = () => {
    const newItem: TrainingItem = {
      id: 'tr_' + Date.now(),
      category: 'DOST',
      trainingName: 'Food Safety & GMP Seminar',
      date: 'Jul 15, 2024',
    }
    onChange({ ...record, trainings: [...record.trainings, newItem] })
  }

  const handleDuplicateTraining = (id: string) => {
    const target = record.trainings.find((t) => t.id === id)
    if (!target) return
    const dup: TrainingItem = {
      ...target,
      id: 'tr_' + Date.now(),
      trainingName: `${target.trainingName} (Copy)`,
    }
    const idx = record.trainings.findIndex((t) => t.id === id)
    const newItems = [...record.trainings]
    newItems.splice(idx + 1, 0, dup)
    onChange({ ...record, trainings: newItems })
  }

  const handleRemoveTraining = (id: string) => {
    onChange({
      ...record,
      trainings: record.trainings.filter((t) => t.id !== id),
    })
  }

  // 3. Tech Transfers
  const handleUpdateTechTransfer = (id: string, field: keyof TechTransferItem, val: any) => {
    const updated = record.techTransfers.map((tt) => {
      if (tt.id !== id) return tt
      return { ...tt, [field]: val }
    })
    onChange({ ...record, techTransfers: updated })
  }

  const handleAddTechTransfer = () => {
    const newItem: TechTransferItem = {
      id: 'tt_' + Date.now(),
      type: 'EQUIPMENT',
      details: 'Automated Bottling & Sealing Machine',
      date: '2024-03',
    }
    onChange({ ...record, techTransfers: [...record.techTransfers, newItem] })
  }

  const handleDuplicateTechTransfer = (id: string) => {
    const target = record.techTransfers.find((tt) => tt.id === id)
    if (!target) return
    const dup: TechTransferItem = {
      ...target,
      id: 'tt_' + Date.now(),
      details: `${target.details} (Copy)`,
    }
    const idx = record.techTransfers.findIndex((tt) => tt.id === id)
    const newItems = [...record.techTransfers]
    newItems.splice(idx + 1, 0, dup)
    onChange({ ...record, techTransfers: newItems })
  }

  const handleRemoveTechTransfer = (id: string) => {
    onChange({
      ...record,
      techTransfers: record.techTransfers.filter((tt) => tt.id !== id),
    })
  }

  // 4. Support Services (Testing & Calibration)
  const handleUpdateSupport = (id: string, field: keyof SupportServiceItem, val: any) => {
    const updated = record.supportServices.map((s) => {
      if (s.id !== id) return s
      return { ...s, [field]: val }
    })
    onChange({ ...record, supportServices: updated })
  }

  const handleAddSupport = () => {
    const newItem: SupportServiceItem = {
      id: 'sup_srv_' + Date.now(),
      type: 'Microbiology',
      productTestedParameters: 'E. coli, Coliform, Yeast & Mold Count',
      date: 'Aug 2024',
    }
    onChange({ ...record, supportServices: [...record.supportServices, newItem] })
  }

  const handleDuplicateSupport = (id: string) => {
    const target = record.supportServices.find((s) => s.id === id)
    if (!target) return
    const dup: SupportServiceItem = {
      ...target,
      id: 'sup_srv_' + Date.now(),
      productTestedParameters: `${target.productTestedParameters} (Copy)`,
    }
    const idx = record.supportServices.findIndex((s) => s.id === id)
    const newItems = [...record.supportServices]
    newItems.splice(idx + 1, 0, dup)
    onChange({ ...record, supportServices: newItems })
  }

  const handleRemoveSupport = (id: string) => {
    onChange({
      ...record,
      supportServices: record.supportServices.filter((s) => s.id !== id),
    })
  }

  // 5. Other Projects
  const handleUpdateOtherProject = (id: string, field: keyof OtherDostProjectItem, val: any) => {
    const updated = record.otherProjects.map((p) => {
      if (p.id !== id) return p
      return { ...p, [field]: val }
    })
    onChange({ ...record, otherProjects: updated })
  }

  const handleAddOtherProject = () => {
    const newItem: OtherDostProjectItem = {
      id: 'oth_' + Date.now(),
      projectTitle: 'SETUP Level Up Phase II Proposal',
      date: '2024-06',
    }
    onChange({ ...record, otherProjects: [...record.otherProjects, newItem] })
  }

  const handleDuplicateOtherProject = (id: string) => {
    const target = record.otherProjects.find((p) => p.id === id)
    if (!target) return
    const dup: OtherDostProjectItem = {
      ...target,
      id: 'oth_' + Date.now(),
      projectTitle: `${target.projectTitle} (Copy)`,
    }
    const idx = record.otherProjects.findIndex((p) => p.id === id)
    const newItems = [...record.otherProjects]
    newItems.splice(idx + 1, 0, dup)
    onChange({ ...record, otherProjects: newItems })
  }

  const handleRemoveOtherProject = (id: string) => {
    onChange({
      ...record,
      otherProjects: record.otherProjects.filter((p) => p.id !== id),
    })
  }

  return (
    <div className="space-y-8 font-sans">
      {/* 1. CONSULTANCY SERVICES (EXCEL PAGE 7) */}
      <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between bg-[#285497] px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <Briefcase className="size-5 text-white" />
            <div>
              <h3 className="text-base font-bold tracking-wide text-white">
                SUMMARY OF INTERVENTION — CONSULTANCY SERVICES
              </h3>
              <p className="text-xs text-blue-100 font-normal">
                MPEX, CPT, Energy Audit, Plant Layout (FS), GMP Assessment, In-House GMP Training, Packaging & Labelling
              </p>
            </div>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={handleAddConsultancy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-xs font-bold text-[#285497] shadow-sm transition hover:bg-[#E6EEF4] active:scale-95"
            >
              <Plus className="size-3.5 text-[#285497]" />
              <span>Add Row</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#E6EEF4] border-b border-[#B5BFCD]/80 text-[11px] font-bold uppercase tracking-wider text-[#285497]">
              <tr>
                <th className="py-3 px-3 w-1/3">Particulars (Consultancy Services)</th>
                <th className="py-3 px-2 text-center w-24">Availed?</th>
                <th className="py-3 px-2">Area/s of Intervention</th>
                <th className="py-3 px-2 w-36">Date</th>
                {!readOnly && <th className="py-3 px-2 w-14"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B5BFCD]/30 text-slate-800">
              {record.consultancies.map((c) => (
                <tr key={c.id} className="hover:bg-[#E6EEF4]/30 transition group">
                  <td className="p-2">
                    <input
                      type="text"
                      value={c.serviceName}
                      onChange={(e) => handleUpdateConsultancy(c.id, 'serviceName', e.target.value)}
                      readOnly={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1 text-center">
                    <input
                      type="checkbox"
                      checked={c.availed}
                      onChange={(e) => handleUpdateConsultancy(c.id, 'availed', e.target.checked)}
                      disabled={readOnly}
                      className="size-4 rounded border-[#B5BFCD] text-[#285497] focus:ring-[#285497]"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={c.areaOfIntervention}
                      onChange={(e) => handleUpdateConsultancy(c.id, 'areaOfIntervention', e.target.value)}
                      readOnly={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-700 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={c.date}
                      onChange={(e) => handleUpdateConsultancy(c.id, 'date', e.target.value)}
                      readOnly={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  {!readOnly && (
                    <td className="p-1 text-right w-14">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicateConsultancy(c.id)}
                          title="Duplicate row"
                          className="rounded-md p-1 text-slate-500 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
                        >
                          <Copy className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveConsultancy(c.id)}
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

      {/* 2. TRAININGS / SEMINARS CONDUCTED */}
      <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between bg-[#285497] px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <BookOpen className="size-5 text-white" />
            <div>
              <h3 className="text-base font-bold tracking-wide text-white">
                SUMMARY OF INTERVENTION — TRAININGS / SEMINARS
              </h3>
              <p className="text-xs text-blue-100 font-normal">
                Workforce capacity building, food safety certifications, equipment operation trainings
              </p>
            </div>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={handleAddTraining}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-xs font-bold text-[#285497] shadow-sm transition hover:bg-[#E6EEF4] active:scale-95"
            >
              <Plus className="size-3.5 text-[#285497]" />
              <span>Add Row</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#E6EEF4] border-b border-[#B5BFCD]/80 text-[11px] font-bold uppercase tracking-wider text-[#285497]">
              <tr>
                <th className="py-3 px-3 w-1/4">Category</th>
                <th className="py-3 px-2">Training / Seminar Title</th>
                <th className="py-3 px-2 w-36">Date</th>
                {!readOnly && <th className="py-3 px-2 w-14"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B5BFCD]/30 text-slate-800">
              {record.trainings.map((t) => (
                <tr key={t.id} className="hover:bg-[#E6EEF4]/30 transition group">
                  <td className="p-1">
                    <select
                      value={t.category}
                      onChange={(e) => handleUpdateTraining(t.id, 'category', e.target.value as any)}
                      disabled={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-1.5 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    >
                      <option value="DOST">DOST</option>
                      <option value="RDI">RDI</option>
                      <option value="FPIC">FPIC</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={t.trainingName}
                      onChange={(e) => handleUpdateTraining(t.id, 'trainingName', e.target.value)}
                      readOnly={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={t.date}
                      onChange={(e) => handleUpdateTraining(t.id, 'date', e.target.value)}
                      readOnly={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-700 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  {!readOnly && (
                    <td className="p-1 text-right w-14">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicateTraining(t.id)}
                          title="Duplicate row"
                          className="rounded-md p-1 text-slate-500 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
                        >
                          <Copy className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveTraining(t.id)}
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

      {/* 3. TECHNOLOGY TRANSFER */}
      <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between bg-[#285497] px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <Award className="size-5 text-white" />
            <div>
              <h3 className="text-base font-bold tracking-wide text-white">
                SUMMARY OF INTERVENTION — TECHNOLOGY TRANSFER
              </h3>
              <p className="text-xs text-blue-100 font-normal">
                Adopted DOST technologies, specialized machinery, or process commercialization
              </p>
            </div>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={handleAddTechTransfer}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-xs font-bold text-[#285497] shadow-sm transition hover:bg-[#E6EEF4] active:scale-95"
            >
              <Plus className="size-3.5 text-[#285497]" />
              <span>Add Row</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#E6EEF4] border-b border-[#B5BFCD]/80 text-[11px] font-bold uppercase tracking-wider text-[#285497]">
              <tr>
                <th className="py-3 px-3 w-1/4">Type</th>
                <th className="py-3 px-2">Details / Specifics</th>
                <th className="py-3 px-2 w-36">Date</th>
                {!readOnly && <th className="py-3 px-2 w-14"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B5BFCD]/30 text-slate-800">
              {record.techTransfers.map((tt) => (
                <tr key={tt.id} className="hover:bg-[#E6EEF4]/30 transition group">
                  <td className="p-1">
                    <select
                      value={tt.type}
                      onChange={(e) => handleUpdateTechTransfer(tt.id, 'type', e.target.value as any)}
                      disabled={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-1.5 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    >
                      <option value="TNA">TNA</option>
                      <option value="EQUIPMENT">EQUIPMENT</option>
                      <option value="PRODUCTS_DEVELOPED">PRODUCTS DEVELOPED</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={tt.details}
                      onChange={(e) => handleUpdateTechTransfer(tt.id, 'details', e.target.value)}
                      readOnly={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={tt.date}
                      onChange={(e) => handleUpdateTechTransfer(tt.id, 'date', e.target.value)}
                      readOnly={readOnly}
                      className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-700 focus:border-[#285497] focus:outline-none"
                    />
                  </td>
                  {!readOnly && (
                    <td className="p-1 text-right w-14">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicateTechTransfer(tt.id)}
                          title="Duplicate row"
                          className="rounded-md p-1 text-slate-500 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
                        >
                          <Copy className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveTechTransfer(tt.id)}
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

      {/* 4. SUPPORT SERVICES (TESTING & CALIBRATION) & 5. OTHER PROJECTS */}
      <div className="grid gap-6 lg:grid-cols-2 items-start">
        {/* Testing and Calibration Services */}
        <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white shadow-sm overflow-hidden">
          <div>
            <div className="flex items-center justify-between bg-[#285497] px-5 py-3.5 text-white">
              <div className="flex items-center gap-2">
                <TestTube className="size-4.5 text-white" />
                <h4 className="text-sm font-bold tracking-wide text-white">
                  TESTING & CALIBRATION SERVICES
                </h4>
              </div>
              {!readOnly && (
                <button
                  type="button"
                  onClick={handleAddSupport}
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
                    <th className="py-3 px-2 w-28">Type</th>
                    <th className="py-3 px-3">Product / Parameters</th>
                    <th className="py-3 px-2 w-32">Date</th>
                    {!readOnly && <th className="py-3 px-2 w-14"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#B5BFCD]/30">
                  {record.supportServices.map((s) => (
                    <tr key={s.id} className="hover:bg-[#E6EEF4]/30 transition group">
                      <td className="p-1">
                        <select
                          value={s.type}
                          onChange={(e) => handleUpdateSupport(s.id, 'type', e.target.value as any)}
                          disabled={readOnly}
                          className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-1 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                        >
                          <option value="Microbiology">Microbiology</option>
                          <option value="Chemical">Chemical</option>
                          <option value="Calibration">Calibration</option>
                          <option value="Shelf Life">Shelf Life</option>
                          <option value="Other">Other</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={s.productTestedParameters}
                          onChange={(e) => handleUpdateSupport(s.id, 'productTestedParameters', e.target.value)}
                          readOnly={readOnly}
                          className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 font-normal text-slate-800 text-xs focus:border-[#285497] focus:outline-none"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={s.date}
                          onChange={(e) => handleUpdateSupport(s.id, 'date', e.target.value)}
                          readOnly={readOnly}
                          className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 font-normal text-slate-700 text-xs focus:border-[#285497] focus:outline-none"
                        />
                      </td>
                      {!readOnly && (
                        <td className="p-1 text-right w-14">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleDuplicateSupport(s.id)}
                              title="Duplicate row"
                              className="rounded-md p-1 text-slate-500 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
                            >
                              <Copy className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveSupport(s.id)}
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
        </div>

        {/* Other Projects */}
        <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white shadow-sm overflow-hidden">
          <div>
            <div className="flex items-center justify-between bg-[#285497] px-5 py-3.5 text-white">
              <div className="flex items-center gap-2">
                <Layers className="size-4.5 text-white" />
                <h4 className="text-sm font-bold tracking-wide text-white">
                  OTHER PROJECTS / INTERVENTIONS
                </h4>
              </div>
              {!readOnly && (
                <button
                  type="button"
                  onClick={handleAddOtherProject}
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
                    <th className="py-3 px-3">Project Title</th>
                    <th className="py-3 px-2 w-32">Date</th>
                    {!readOnly && <th className="py-3 px-2 w-14"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#B5BFCD]/30">
                  {record.otherProjects.map((p) => (
                    <tr key={p.id} className="hover:bg-[#E6EEF4]/30 transition group">
                      <td className="p-2">
                        <input
                          type="text"
                          value={p.projectTitle}
                          onChange={(e) => handleUpdateOtherProject(p.id, 'projectTitle', e.target.value)}
                          readOnly={readOnly}
                          className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 font-normal text-slate-800 text-xs focus:border-[#285497] focus:outline-none"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={p.date}
                          onChange={(e) => handleUpdateOtherProject(p.id, 'date', e.target.value)}
                          readOnly={readOnly}
                          className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 font-normal text-slate-700 text-xs focus:border-[#285497] focus:outline-none"
                        />
                      </td>
                      {!readOnly && (
                        <td className="p-1 text-right w-14">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleDuplicateOtherProject(p.id)}
                              title="Duplicate row"
                              className="rounded-md p-1 text-slate-500 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
                            >
                              <Copy className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveOtherProject(p.id)}
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
        </div>
      </div>
    </div>
  )
}
