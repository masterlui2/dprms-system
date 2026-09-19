import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ProjectCombobox } from '../src/components/admin/equipment/ProjectCombobox'
import '../src/index.css'

const projects = Array.from({ length: 120 }, (_, index) => ({
  cooperator: index === 87 ? 'Davao Cacao Cooperative' : `Cooperator ${index + 1}`,
  id: index + 1,
  location: index === 87 ? 'Mati City' : `Location ${index + 1}`,
  program_type: 'GIA' as const,
  reference_number: `GIA-2026-${String(index + 1).padStart(4, '0')}`,
  title: index === 87 ? 'Cacao Processing Innovation Center' : `Research Project ${index + 1}`,
}))

export function Fixture() {
  const [value, setValue] = useState('')
  return <main className="mx-auto max-w-xl p-8"><label className="block text-sm font-bold text-slate-800">Active project <span className="text-rose-600">*</span><ProjectCombobox onChange={setValue} placeholder="Search and select a GIA project" arrProjects={projects} value={value} /></label><output data-testid="selected-project">{value}</output></main>
}

createRoot(document.getElementById('root')!).render(<Fixture />)
