/**
 * System: DPRMS
 * Purpose: Render data table for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import
{
    ArrowDown,
    ArrowUp,
    ChevronLeft,
    ChevronRight,
    ChevronsUpDown,
    Search,
} from 'lucide-react';
import { useDeferredValue, useState, type ReactNode } from 'react';

import { cn } from '../../utils/cn';

export interface DataColumn<T>
{
    align?: 'left' | 'center' | 'right';
    className?: string;
    header: string;
    id: string;
    numeric?: boolean;
    render: (udtRow: T) => ReactNode;
    sortValue?: (udtRow: T) => number | string;
}

const NUMERIC_COLUMN_PATTERN =
    /(?:amount|balance|budget|cost|count|duration|funding|percentage|percent|progress|quantity|qty|rate|score|term|total|utilized)/i;

/** Column alignment. */
function _columnAlignment<T>(objColumn: DataColumn<T>): 'left' | 'center' | 'right'
{
    if (objColumn.align)
    {
        return objColumn.align;
    }
    if (objColumn.numeric === false)
    {
        return 'left';
    }
    if (objColumn.numeric === true)
    {
        return 'right';
    }
    if (objColumn.id.toLowerCase() === 'action')
    {
        return 'right';
    }

    const blnLooksNumeric = NUMERIC_COLUMN_PATTERN.test(`${objColumn.id} ${objColumn.header}`);

    return blnLooksNumeric ? 'right' : 'left';
}

/** Alignment class. */
function _alignmentClass(strAlignment: 'left' | 'center' | 'right'): string
{
    if (strAlignment === 'right')
    {
        return 'text-right tabular-nums';
    }
    if (strAlignment === 'center')
    {
        return 'text-center';
    }
    return 'text-left';
}

interface DataTableProps<T>
{
    arrColumns: DataColumn<T>[];
    arrData: T[];
    txtEmptyDescription?: string;
    strEmptyTitle?: string;
    blnFitColumns?: boolean;
    getRowKey: (udtRow: T) => string;
    objGroupedHeader?: ReactNode;
    intInitialRowsPerPage?: number;
    blnIsLoading?: boolean;
    mobileRender?: (udtRow: T) => ReactNode;
    onRowClick?: (udtRow: T) => void;
    strSearchPlaceholder?: string;
    searchText: (udtRow: T) => string;
    objToolbar?: ReactNode;
    strVariant?: 'default' | 'clean';
}

/** Render data table and its available actions. */
export function DataTable<T>({
    arrColumns,
    arrData,
    txtEmptyDescription = 'Try changing your search or filters.',
    strEmptyTitle = 'No records found',
    blnFitColumns = false,
    getRowKey,
    objGroupedHeader,
    intInitialRowsPerPage = 5,
    blnIsLoading = false,
    mobileRender,
    onRowClick,
    strSearchPlaceholder = 'Search records...',
    searchText,
    objToolbar,
    strVariant = 'default',
}: DataTableProps<T>)
{
    const arrRowsPerPageOptions = Array.from(new Set([intInitialRowsPerPage, 5, 10, 20])).sort(
        (intLeft, intRight) => intLeft - intRight,
    );
    const [strQuery, setStrQuery] = useState('');
    const [intPage, setIntPage] = useState(1);
    const [intRowsPerPage, setIntRowsPerPage] = useState(intInitialRowsPerPage);
    const [objSort, setObjSort] = useState<{
        direction: 'asc' | 'desc';
        id: string;
    } | null>(null);
    const strDeferredQuery = useDeferredValue(strQuery.trim().toLowerCase());

    const arrFiltered = strDeferredQuery
        ? arrData.filter((udtRow) => searchText(udtRow).toLowerCase().includes(strDeferredQuery))
        : arrData;
    const arrSorted = [...arrFiltered].sort((udtLeft, udtRight) =>
    {
        if (!objSort)
        {
            return 0;
        }
        const objColumn = arrColumns.find((objItem) => objItem.id === objSort.id);
        if (!objColumn?.sortValue)
        {
            return 0;
        }
        const objLeftValue = objColumn.sortValue(udtLeft);
        const objRightValue = objColumn.sortValue(udtRight);
        const intComparison =
            typeof objLeftValue === 'number' && typeof objRightValue === 'number'
                ? objLeftValue - objRightValue
                : String(objLeftValue).localeCompare(String(objRightValue));
        return objSort.direction === 'asc' ? intComparison : -intComparison;
    });
    const intPageCount = Math.max(1, Math.ceil(arrSorted.length / intRowsPerPage));
    const intSafePage = Math.min(intPage, intPageCount);
    const arrVisibleRows = arrSorted.slice(
        (intSafePage - 1) * intRowsPerPage,
        intSafePage * intRowsPerPage,
    );
    const intFirstRow = arrSorted.length ? (intSafePage - 1) * intRowsPerPage + 1 : 0;
    const intLastRow = Math.min(intSafePage * intRowsPerPage, arrSorted.length);

    /** Toggle sort. */
    function _toggleSort(objColumn: DataColumn<T>)
    {
        if (!objColumn.sortValue)
        {
            return;
        }
        setIntPage(1);
        setObjSort((objCurrent) =>
        {
            if (objCurrent?.id !== objColumn.id)
            {
                return { id: objColumn.id, direction: 'asc' };
            }
            return {
                id: objColumn.id,
                direction: objCurrent.direction === 'asc' ? 'desc' : 'asc',
            };
        });
    }

    return (
        <div className="min-w-0 max-w-full">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <label
                    className={cn(
                        'relative block min-w-0 flex-1 lg:max-w-sm',
                        strVariant === 'clean' && 'lg:max-w-md',
                    )}
                >
                    <span className="sr-only">{strSearchPlaceholder}</span>
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                        className={cn(
                            'w-full border bg-white pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100',
                            strVariant === 'clean'
                                ? 'h-12 rounded-2xl border-[#cfdced] text-[15px]'
                                : 'h-10 rounded-lg border-slate-300',
                        )}
                        onChange={(objEvent) =>
                        {
                            setStrQuery(objEvent.target.value);
                            setIntPage(1);
                        }}
                        placeholder={strSearchPlaceholder}
                        type="search"
                        value={strQuery}
                    />
                </label>
                {objToolbar ? (
                    <div className="flex flex-wrap items-center gap-2">{objToolbar}</div>
                ) : null}
            </div>

            <div className="hidden max-w-full overflow-hidden xl:block">
                <table className="w-full table-fixed text-left text-sm">
                    <thead
                        className={cn(
                            'text-xs text-slate-500',
                            strVariant === 'clean'
                                ? 'bg-[#f8fbff] text-[#5c7394]'
                                : 'bg-slate-50 uppercase tracking-[0.08em]',
                        )}
                    >
                        {objGroupedHeader}
                        <tr>
                            {arrColumns.map((objColumn) => (
                                <th
                                    className={cn(
                                        'font-semibold',
                                        blnFitColumns ? 'px-3' : 'px-5',
                                        strVariant === 'clean' ? 'py-4 text-sm' : 'py-3',
                                        _alignmentClass(_columnAlignment(objColumn)),
                                        objColumn.className,
                                    )}
                                    key={objColumn.id}
                                >
                                    {objColumn.sortValue ? (
                                        <button
                                            className={cn(
                                                'inline-flex w-full items-center gap-1.5 transition hover:text-[#073b82]',
                                                _columnAlignment(objColumn) === 'right' &&
                                                'justify-end',
                                                _columnAlignment(objColumn) === 'center' &&
                                                'justify-center',
                                            )}
                                            onClick={() => _toggleSort(objColumn)}
                                            type="button"
                                        >
                                            {objColumn.header}
                                            {objSort?.id === objColumn.id ? (
                                                objSort.direction === 'asc' ? (
                                                    <ArrowUp className="size-3.5" />
                                                ) : (
                                                    <ArrowDown className="size-3.5" />
                                                )
                                            ) : (
                                                <ChevronsUpDown className="size-3.5 text-slate-300" />
                                            )}
                                        </button>
                                    ) : (
                                        objColumn.header
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {blnIsLoading
                            ? Array.from(
                                { length: Math.min(intRowsPerPage, 5) },
                                (_objUnused, intIndex) => (
                                    <tr key={`loading-${intIndex}`}>
                                        {arrColumns.map((objColumn) => (
                                            <td
                                                className={cn(
                                                    'py-4',
                                                    blnFitColumns ? 'px-3' : 'px-5',
                                                    _alignmentClass(_columnAlignment(objColumn)),
                                                    objColumn.className,
                                                )}
                                                key={objColumn.id}
                                            >
                                                <div className="h-4 animate-pulse rounded bg-slate-100" />
                                            </td>
                                        ))}
                                    </tr>
                                ),
                            )
                            : arrVisibleRows.map((udtRow) => (
                                <tr
                                    className={cn(
                                        'transition hover:bg-blue-50/40',
                                        onRowClick && 'cursor-pointer focus:bg-blue-50/40',
                                    )}
                                    key={getRowKey(udtRow)}
                                    onClick={() => onRowClick?.(udtRow)}
                                    onKeyDown={(objEvent) =>
                                    {
                                        if (
                                            onRowClick &&
                                            (objEvent.key === 'Enter' || objEvent.key === ' ')
                                        )
                                        {
                                            objEvent.preventDefault();
                                            onRowClick(udtRow);
                                        }
                                    }}
                                    tabIndex={onRowClick ? 0 : undefined}
                                >
                                    {arrColumns.map((objColumn) => (
                                        <td
                                            className={cn(
                                                blnFitColumns ? 'px-3' : 'px-5',
                                                strVariant === 'clean' ? 'py-5' : 'py-4',
                                                _alignmentClass(_columnAlignment(objColumn)),
                                                objColumn.className,
                                            )}
                                            key={objColumn.id}
                                        >
                                            <div
                                                className={cn(
                                                    'min-w-0 break-words',
                                                    _columnAlignment(objColumn) === 'right' &&
                                                    '[&>*]:ml-auto',
                                                )}
                                            >
                                                {objColumn.render(udtRow)}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            <div className="divide-y divide-slate-100 xl:hidden">
                {blnIsLoading
                    ? Array.from(
                        { length: Math.min(intRowsPerPage, 3) },
                        (_objUnused, intIndex) => (
                            <div className="space-y-3 p-5" key={`mobile-loading-${intIndex}`}>
                                <div className="h-4 animate-pulse rounded bg-slate-100" />
                                <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                                <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
                            </div>
                        ),
                    )
                    : arrVisibleRows.map((udtRow) => (
                        <article
                            className={cn(
                                'space-y-3 p-5',
                                onRowClick && 'cursor-pointer active:bg-blue-50/50',
                            )}
                            key={getRowKey(udtRow)}
                            onClick={() => onRowClick?.(udtRow)}
                            onKeyDown={(objEvent) =>
                            {
                                if (
                                    onRowClick &&
                                    (objEvent.key === 'Enter' || objEvent.key === ' ')
                                )
                                {
                                    objEvent.preventDefault();
                                    onRowClick(udtRow);
                                }
                            }}
                            tabIndex={onRowClick ? 0 : undefined}
                        >
                            {mobileRender
                                ? mobileRender(udtRow)
                                : arrColumns.map((objColumn) => (
                                    <div
                                        className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 text-sm"
                                        key={objColumn.id}
                                    >
                                        <p
                                            className={cn(
                                                'text-xs font-semibold uppercase tracking-wide text-slate-400',
                                                _alignmentClass(_columnAlignment(objColumn)),
                                            )}
                                        >
                                            {objColumn.header}
                                        </p>
                                        <div
                                            className={cn(
                                                'min-w-0 break-words',
                                                _alignmentClass(_columnAlignment(objColumn)),
                                                _columnAlignment(objColumn) === 'right' &&
                                                '[&>*]:ml-auto',
                                            )}
                                        >
                                            {objColumn.render(udtRow)}
                                        </div>
                                    </div>
                                ))}
                        </article>
                    ))}
            </div>

            {!blnIsLoading && arrVisibleRows.length === 0 ? (
                <div className="px-6 py-14 text-center">
                    <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                        <Search className="size-5" />
                    </span>
                    <p className="mt-4 font-bold text-slate-800">{strEmptyTitle}</p>
                    <p className="mt-1 text-sm text-slate-500">{txtEmptyDescription}</p>
                </div>
            ) : null}

            <div
                className={cn(
                    'flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between',
                    strVariant === 'clean' && 'py-5',
                )}
            >
                <div className="flex flex-wrap items-center gap-4">
                    <p className="text-xs text-slate-500">
                        Showing {intFirstRow}-{intLastRow} of {arrSorted.length}
                    </p>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                        Rows per page
                        <select
                            className="h-8 rounded-lg border border-slate-300 bg-white px-2 outline-none focus:border-[#0f53b7] focus:ring-2 focus:ring-blue-100"
                            onChange={(objEvent) =>
                            {
                                setIntRowsPerPage(Number(objEvent.target.value));
                                setIntPage(1);
                            }}
                            value={intRowsPerPage}
                        >
                            {arrRowsPerPageOptions.map((intValue) => (
                                <option key={intValue} value={intValue}>
                                    {intValue}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <nav aria-label="Table pagination" className="flex items-center gap-1">
                    <button
                        aria-label="Previous page"
                        className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        disabled={intSafePage === 1 || blnIsLoading}
                        onClick={() => setIntPage((intCurrent) => Math.max(1, intCurrent - 1))}
                        type="button"
                    >
                        <ChevronLeft className="size-4" />
                    </button>
                    <span className="min-w-20 text-center text-xs font-bold text-slate-600">
                        Page {intSafePage} of {intPageCount}
                    </span>
                    <button
                        aria-label="Next page"
                        className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        disabled={intSafePage === intPageCount || blnIsLoading}
                        onClick={() =>
                            setIntPage((intCurrent) => Math.min(intPageCount, intCurrent + 1))
                        }
                        type="button"
                    >
                        <ChevronRight className="size-4" />
                    </button>
                </nav>
            </div>
        </div>
    ); // end return
} /* end DataTable */
