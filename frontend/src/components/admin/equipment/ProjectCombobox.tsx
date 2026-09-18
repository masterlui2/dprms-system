import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Check, ChevronsUpDown, Search, X } from 'lucide-react'

import type { EquipmentProjectOption } from '../../../services/equipmentStore'

const MAX_VISIBLE_RESULTS = 50

function searchableText(project: EquipmentProjectOption): string {
  return [project.reference_number, project.title, project.cooperator, project.location]
    .join(' ')
    .toLocaleLowerCase()
}

export function ProjectCombobox({ onChange, placeholder, projects, value }: {
  onChange: (projectId: string) => void
  placeholder: string
  projects: EquipmentProjectOption[]
  value: string
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const selected = projects.find((project) => String(project.id) === value)
  const matches = useMemo(() => {
    const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)
    return terms.length === 0
      ? projects
      : projects.filter((project) => terms.every((term) => searchableText(project).includes(term)))
  }, [projects, query])
  const visibleMatches = matches.slice(0, MAX_VISIBLE_RESULTS)
  const listboxId = 'active-project-options'

  useEffect(() => {
    function closeWhenClickingOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', closeWhenClickingOutside)
    return () => document.removeEventListener('mousedown', closeWhenClickingOutside)
  }, [])

  function showOptions() {
    setOpen(true)
    setActiveIndex(Math.max(0, visibleMatches.findIndex((project) => String(project.id) === value)))
    window.requestAnimationFrame(() => inputRef.current?.focus())
  }

  function choose(project: EquipmentProjectOption) {
    onChange(String(project.id))
    setQuery('')
    setOpen(false)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      setOpen(false)
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) setOpen(true)
      const direction = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex((current) => Math.max(0, Math.min(visibleMatches.length - 1, current + direction)))
    } else if (event.key === 'Enter' && open && visibleMatches[activeIndex]) {
      event.preventDefault()
      choose(visibleMatches[activeIndex])
    }
  }

  return (
    <div className="relative mt-1.5" ref={rootRef}>
      {open ? (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            aria-label="Search active projects"
            aria-activedescendant={visibleMatches[activeIndex] ? `project-option-${visibleMatches[activeIndex].id}` : undefined}
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-expanded="true"
            autoComplete="off"
            className="h-11 w-full rounded-xl border border-[#0f53b7] bg-white pl-10 pr-10 text-sm outline-none ring-4 ring-blue-100 placeholder:text-slate-400"
            onChange={(event) => { setQuery(event.target.value); setActiveIndex(0) }}
            onKeyDown={handleKeyDown}
            placeholder="Search reference, title, cooperator, or location"
            ref={inputRef}
            role="combobox"
            value={query}
          />
          <button aria-label="Close project search" className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" onClick={() => setOpen(false)} type="button"><X className="size-4" /></button>
        </div>
      ) : (
        <button aria-expanded="false" aria-haspopup="listbox" aria-label={selected ? `Active project: ${selected.reference_number} — ${selected.title}` : placeholder} aria-required="true" className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm outline-none transition hover:border-blue-400 focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100" onClick={showOptions} type="button">
          <span className={selected ? 'min-w-0 text-slate-800' : 'text-slate-400'}>
            {selected ? <><span className="font-bold text-[#073b82]">{selected.reference_number}</span><span className="mx-1.5 text-slate-300">—</span>{selected.title}</> : placeholder}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-slate-400" />
        </button>
      )}

      {open ? (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
            <span>{matches.length.toLocaleString()} {matches.length === 1 ? 'project' : 'projects'} found</span>
            {query ? <button className="font-bold text-[#0f53b7] hover:underline" onClick={() => { setQuery(''); setActiveIndex(0); inputRef.current?.focus() }} type="button">Clear search</button> : null}
          </div>
          <ul className="max-h-64 overflow-y-auto p-1.5" id={listboxId} role="listbox">
            {visibleMatches.map((project, index) => {
              const isSelected = String(project.id) === value
              return (
                <li aria-selected={isSelected} className={`flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 ${index === activeIndex ? 'bg-blue-50' : 'hover:bg-slate-50'}`} id={`project-option-${project.id}`} key={project.id} onMouseDown={(event) => { event.preventDefault(); choose(project) }} onMouseEnter={() => setActiveIndex(index)} role="option" title={`${project.reference_number} — ${project.title}`}>
                  <Check className={`size-3.5 shrink-0 ${isSelected ? 'text-[#0f53b7]' : 'text-transparent'}`} />
                  <span className="min-w-0 truncate text-sm text-slate-800">
                    <span className="font-bold text-[#073b82]">{project.reference_number}</span>
                    <span className="mx-1.5 text-slate-300">—</span>
                    {project.title}
                  </span>
                </li>
              )
            })}
            {matches.length === 0 ? <li aria-disabled="true" className="px-4 py-8 text-center" role="option"><p className="text-sm font-bold text-slate-700">No matching projects</p><p className="mt-1 text-xs text-slate-500">Try a reference number, a shorter title, cooperator, or location.</p></li> : null}
          </ul>
          {matches.length > MAX_VISIBLE_RESULTS ? <p className="border-t border-slate-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">Showing the first {MAX_VISIBLE_RESULTS} matches. Add another search word to narrow the list.</p> : null}
        </div>
      ) : null}

      {selected ? <button className="mt-1.5 text-xs font-bold text-[#0f53b7] hover:underline" onClick={() => { onChange(''); setQuery(''); showOptions() }} type="button">Change project</button> : null}
    </div>
  )
}
