/**
 * System: DPRMS
 * Purpose: Exercise data tables and error recovery without a live backend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { DataTable, type DataColumn } from '../src/components/admin/DataTable';
import { ApplicationErrorBoundary } from '../src/components/common/ApplicationErrorBoundary';
import { AsyncErrorNotice } from '../src/components/common/AsyncErrorNotice';
import { RouteErrorBoundary } from '../src/components/common/RouteErrorBoundary';
import '../src/index.css';

interface TestRecord
{
    id: string;
    name: string;
    amount: number;
}

const ROWS: TestRecord[] = [
    { id: '1', name: 'Alpha', amount: 100 },
    { id: '2', name: 'Beta', amount: 20 },
    { id: '3', name: 'Gamma', amount: 300 },
];
const COLUMNS: DataColumn<TestRecord>[] = [
    { id: 'name', header: 'Name', render: (objRow) => objRow.name, sortValue: (objRow) => objRow.name },
    { id: 'amount', header: 'Amount', render: (objRow) => objRow.amount, sortValue: (objRow) => objRow.amount },
];

/** Deliberately fail to verify the user's recovery screen. */
export function BrokenContent(): never
{
    throw new Error('Synthetic render failure');
}

/** Exercise a failure inside React Router's own rendering boundary. */
export function BrokenRoute()
{
    const [objRouter] = useState(() => createMemoryRouter([
        { path: '/', element: <BrokenContent />, errorElement: <RouteErrorBoundary /> },
    ]));
    return <RouterProvider router={objRouter} />;
}

/** Render the fixture selected by its URL query. */
export function ComplianceFixture()
{
    const strScenario = new URLSearchParams(window.location.search).get('scenario');
    return (
        <ApplicationErrorBoundary>
            <AsyncErrorNotice />
            {strScenario === 'render-error' ? <BrokenContent /> : strScenario === 'route-error' ? <BrokenRoute /> : (
                <>
                    <button onClick={() => void Promise.reject(new Error('Synthetic asynchronous failure'))} type="button">Fail action</button>
                    <DataTable
                        arrColumns={COLUMNS}
                        arrData={ROWS}
                        blnFitColumns
                        getRowKey={(objRow) => objRow.id}
                        searchText={(objRow) => objRow.name}
                        strEmptyTitle="No matching entries"
                        strSearchPlaceholder="Find an entry"
                        strVariant="clean"
                    />
                </>
            )}
        </ApplicationErrorBoundary>
    );
}

createRoot(document.getElementById('root')!).render(<ComplianceFixture />);
