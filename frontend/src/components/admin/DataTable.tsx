import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  useDeferredValue,
  useState,
  type ReactNode,
} from 'react'

import { cn } from '../../utils/cn'

export interface DataColumn<T> {
  className?: string
  header: string
  id: string
  render: (row: T) => ReactNode
  sortValue?: (row: T) => number | string
}

interface DataTableProps<T> {
  columns: DataColumn<T>[]
  data: T[]
  emptyDescription?: string
  emptyTitle?: string
  getRowKey: (row: T) => string
  initialRowsPerPage?: number
  isLoading?: boolean
  onRowClick?: (row: T) => void
  searchPlaceholder?: string
  searchText: (row: T) => string
  toolbar?: ReactNode
  variant?: 'default' | 'clean'
}

export function DataTable<T>({
  columns,
  data,
  emptyDescription = 'Try changing your search or filters.',
  emptyTitle = 'No records found',
  getRowKey,
  initialRowsPerPage = 5,
  isLoading = false,
  onRowClick,
  searchPlaceholder = 'Search records...',
  searchText,
  toolbar,
  variant = 'default',
}: DataTableProps<T>) {
  const rowsPerPageOptions = Array.from(
    new Set([initialRowsPerPage, 5, 10, 20]),
  ).sort((left, right) => left - right)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage)
  const [sort, setSort] = useState<{
    direction: 'asc' | 'desc'
    id: string
  } | null>(null)
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())

  const filtered = deferredQuery
    ? data.filter((row) =>
        searchText(row).toLowerCase().includes(deferredQuery),
      )
    : data
  const sorted = [...filtered].sort((left, right) => {
    if (!sort) return 0
    const column = columns.find((item) => item.id === sort.id)
    if (!column?.sortValue) return 0
    const leftValue = column.sortValue(left)
    const rightValue = column.sortValue(right)
    const comparison =
      typeof leftValue === 'number' && typeof rightValue === 'number'
        ? leftValue - rightValue
        : String(leftValue).localeCompare(String(rightValue))
    return sort.direction === 'asc' ? comparison : -comparison
  })
  const pageCount = Math.max(1, Math.ceil(sorted.length / rowsPerPage))
  const safePage = Math.min(page, pageCount)
  const visibleRows = sorted.slice(
    (safePage - 1) * rowsPerPage,
    safePage * rowsPerPage,
  )
  const firstRow = sorted.length ? (safePage - 1) * rowsPerPage + 1 : 0
  const lastRow = Math.min(safePage * rowsPerPage, sorted.length)

  function toggleSort(column: DataColumn<T>) {
    if (!column.sortValue) return
    setPage(1)
    setSort((current) => {
      if (current?.id !== column.id) {
        return { id: column.id, direction: 'asc' }
      }
      return {
        id: column.id,
        direction: current.direction === 'asc' ? 'desc' : 'asc',
      }
    })
  }

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <label
          className={cn(
            'relative block min-w-0 flex-1 lg:max-w-sm',
            variant === 'clean' && 'lg:max-w-md',
          )}
        >
          <span className="sr-only">{searchPlaceholder}</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            className={cn(
              'w-full border bg-white pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100',
              variant === 'clean'
                ? 'h-12 rounded-2xl border-[#cfdced] text-[15px]'
                : 'h-10 rounded-lg border-slate-300',
            )}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
            placeholder={searchPlaceholder}
            type="search"
            value={query}
          />
        </label>
        {toolbar ? (
          <div className="flex flex-wrap items-center gap-2">{toolbar}</div>
        ) : null}
      </div>

      <div className="hidden overflow-hidden xl:block">
        <table className="w-full table-fixed text-left text-sm">
          <thead
            className={cn(
              'text-xs text-slate-500',
              variant === 'clean'
                ? 'bg-[#f8fbff] text-[#5c7394]'
                : 'bg-slate-50 uppercase tracking-[0.08em]',
            )}
          >
            <tr>
              {columns.map((column) => (
                <th
                  className={cn(
                    'px-5 font-black',
                    variant === 'clean' ? 'py-4 text-sm' : 'py-3',
                    column.className,
                  )}
                  key={column.id}
                >
                  {column.sortValue ? (
                    <button
                      className="inline-flex items-center gap-1.5 transition hover:text-[#073b82]"
                      onClick={() => toggleSort(column)}
                      type="button"
                    >
                      {column.header}
                      {sort?.id === column.id ? (
                        sort.direction === 'asc' ? (
                          <ArrowUp className="size-3.5" />
                        ) : (
                          <ArrowDown className="size-3.5" />
                        )
                      ) : (
                        <ChevronsUpDown className="size-3.5 text-slate-300" />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading
              ? Array.from({ length: Math.min(rowsPerPage, 5) }, (_, index) => (
                  <tr key={`loading-${index}`}>
                    {columns.map((column) => (
                      <td className="px-5 py-4" key={column.id}>
                        <div className="h-4 animate-pulse rounded bg-slate-100" />
                      </td>
                    ))}
                  </tr>
                ))
              : visibleRows.map((row) => (
                  <tr
                    className={cn(
                      'transition hover:bg-blue-50/40',
                      onRowClick && 'cursor-pointer focus:bg-blue-50/40',
                    )}
                    key={getRowKey(row)}
                    onClick={() => onRowClick?.(row)}
                    onKeyDown={(event) => {
                      if (
                        onRowClick &&
                        (event.key === 'Enter' || event.key === ' ')
                      ) {
                        event.preventDefault()
                        onRowClick(row)
                      }
                    }}
                    tabIndex={onRowClick ? 0 : undefined}
                  >
                    {columns.map((column) => (
                      <td
                        className={cn(
                          'px-5',
                          variant === 'clean' ? 'py-5' : 'py-4',
                          column.className,
                        )}
                        key={column.id}
                      >
                        <div className="min-w-0 break-words">
                          {column.render(row)}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-slate-100 xl:hidden">
        {isLoading
          ? Array.from({ length: Math.min(rowsPerPage, 3) }, (_, index) => (
              <div className="space-y-3 p-5" key={`mobile-loading-${index}`}>
                <div className="h-4 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
              </div>
            ))
          : visibleRows.map((row) => (
              <article
                className={cn(
                  'space-y-3 p-5',
                  onRowClick && 'cursor-pointer active:bg-blue-50/50',
                )}
                key={getRowKey(row)}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <div
                    className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 text-sm"
                    key={column.id}
                  >
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      {column.header}
                    </p>
                    <div className="min-w-0 break-words">{column.render(row)}</div>
                  </div>
                ))}
              </article>
            ))}
      </div>

      {!isLoading && visibleRows.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
            <Search className="size-5" />
          </span>
          <p className="mt-4 font-bold text-slate-800">{emptyTitle}</p>
          <p className="mt-1 text-sm text-slate-500">{emptyDescription}</p>
        </div>
      ) : null}

      <div
        className={cn(
          'flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between',
          variant === 'clean' && 'py-5',
        )}
      >
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-xs text-slate-500">
            Showing {firstRow}-{lastRow} of {sorted.length}
          </p>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            Rows per page
            <select
              className="h-8 rounded-lg border border-slate-300 bg-white px-2 outline-none focus:border-[#0f53b7] focus:ring-2 focus:ring-blue-100"
              onChange={(event) => {
                setRowsPerPage(Number(event.target.value))
                setPage(1)
              }}
              value={rowsPerPage}
            >
              {rowsPerPageOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>

        <nav aria-label="Table pagination" className="flex items-center gap-1">
          <button
            aria-label="Previous page"
            className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={safePage === 1 || isLoading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            type="button"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="min-w-20 text-center text-xs font-bold text-slate-600">
            Page {safePage} of {pageCount}
          </span>
          <button
            aria-label="Next page"
            className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={safePage === pageCount || isLoading}
            onClick={() =>
              setPage((current) => Math.min(pageCount, current + 1))
            }
            type="button"
          >
            <ChevronRight className="size-4" />
          </button>
        </nav>
      </div>
    </div>
  )
}
