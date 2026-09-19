/**
 * System: DPRMS
 * Purpose: Coordinate quarter auto save state and interactions.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
// src/services/useQuarterAutoSave.ts
import g_objApi from '../lib/axios';
import type { SetupMonitoringQuarterRecord } from '../types/setup_monitoring';
import { reportError } from '../utils/error_reporting';
import { RESOURCE_ADAPTERS, type ResourceAdapter } from './quarter_resource_adapter';

type SnapshotRow = {
    id: string;
    backendId: number | null;
    fields: Record<string, any>;
};
export type QuarterSnapshot = Record<string, Map<string, SnapshotRow>>;

/** Build snapshot. */
export function buildSnapshot(objRecord: SetupMonitoringQuarterRecord): QuarterSnapshot
{
    const objSnapshot: QuarterSnapshot = {};
    for (const objAdapter of RESOURCE_ADAPTERS)
    {
        const arrRows: any[] = (objRecord as any)[objAdapter.recordKey] ?? [];
        const objMap = new Map<string, SnapshotRow>();
        for (const objRow of arrRows)
        {
            objMap.set(objRow.id, {
                id: objRow.id,
                backendId: _backendIdFrom(objRow.id),
                fields: objAdapter.toPayload(objRow, objRecord),
            });
        }
        objSnapshot[objAdapter.recordKey as string] = objMap;
    }
    return objSnapshot;
}

/** Backend id from. */
function _backendIdFrom(strFrontendId: string): number | null
{
    const objMatch = strFrontendId.match(/_(\d+)$/);
    return objMatch ? Number(objMatch[1]) : null;
}

/** Is shallow equal. */
function _isShallowEqual(objLeft: Record<string, any>, objRight: Record<string, any>)
{
    const objKeys = new Set([...Object.keys(objLeft), ...Object.keys(objRight)]);
    for (const strKey of objKeys)
    {
        if (objLeft[strKey] !== objRight[strKey])
        {
            return false;
        }
    }
    return true;
}

export interface SyncEndpointError
{
    endpoint: string;
    error: unknown;
}

interface SyncResult
{
    snapshot: QuarterSnapshot;
    /**
     * Non-empty if one or more backend endpoints failed. The snapshot still
     * acknowledges successful endpoints so their creates are not duplicated.
     */
    errors: SyncEndpointError[];
}

/** Sync quarter. */
export async function syncQuarter(
    intQuarterId: number,
    objRecord: SetupMonitoringQuarterRecord,
    objPrevSnapshot: QuarterSnapshot,
): Promise<SyncResult>
{
    try
    {
        const objNextSnapshot: QuarterSnapshot = {};

        // Group adapters by endpoint since several arrays share one backend table
        const objByEndpoint = new Map<string, ResourceAdapter[]>();
        for (const objAdapter of RESOURCE_ADAPTERS)
        {
            const arrList = objByEndpoint.get(objAdapter.endpoint) ?? [];
            arrList.push(objAdapter);
            objByEndpoint.set(objAdapter.endpoint, arrList);
        }

        const arrErrors: SyncEndpointError[] = [];
        const objFailedEndpoints = new Set<string>();
        const objCreatedBackendIds = new Map<string, number>();

        const arrRequests = Array.from(objByEndpoint.entries()).map(
            async ([strEndpoint, arrAdapters]) =>
            {
                const arrCreates: any[] = [];
                const arrUpdates: any[] = [];
                const arrDeletes: number[] = [];
                const arrTempIdLocations: { tempId: string; recordKey: string; }[] = [];

                for (const objAdapter of arrAdapters)
                {
                    const arrRows: any[] = (objRecord as any)[objAdapter.recordKey] ?? [];
                    const objPrevRows =
                        objPrevSnapshot[objAdapter.recordKey as string] ?? new Map();
                    const objSeenIds = new Set<string>();

                    arrRows.forEach((objRow) =>
                    {
                        objSeenIds.add(objRow.id);
                        const objPrevRow = objPrevRows.get(objRow.id);
                        const objPayload = objAdapter.toPayload(objRow, objRecord);

                        if (!objPrevRow)
                        {
                            // never synced before -> create
                            arrCreates.push({ temp_id: objRow.id, ...objPayload });
                            arrTempIdLocations.push({
                                tempId: objRow.id,
                                recordKey: objAdapter.recordKey as string,
                            });
                        } else if (
                            !_isShallowEqual(objPrevRow.fields, objPayload) &&
                            objPrevRow.backendId
                        )
                        {
                            arrUpdates.push({ id: objPrevRow.backendId, ...objPayload });
                        }
                    });

                    // anything in the snapshot but missing from current rows -> delete
                    for (const [strId, objPrevious] of objPrevRows)
                    {
                        if (!objSeenIds.has(strId))
                        {
                            if (objPrevious.backendId)
                            {
                                arrDeletes.push(objPrevious.backendId);
                            }
                        }
                    }
                } /* end loop */

                if (arrCreates.length === 0 && arrUpdates.length === 0 && arrDeletes.length === 0)
                {
                    return;
                }

                try
                {
                    const { data: objData } = await g_objApi.post(
                        `/quarterly-metrics/${intQuarterId}/${strEndpoint}/batch`,
                        { creates: arrCreates, updates: arrUpdates, deletes: arrDeletes },
                    );

                    // Keep UI row ids stable and store the backend identity in the
                    // snapshot. Changing a React row key here would steal input focus.
                    const arrReturned: any[] = objData.data ?? [];
                    for (const objCreated of arrReturned)
                    {
                        if (!objCreated.temp_id)
                        {
                            continue;
                        }
                        const objLocation = arrTempIdLocations.find(
                            (objItem) => objItem.tempId === objCreated.temp_id,
                        );
                        if (!objLocation)
                        {
                            continue;
                        }
                        objCreatedBackendIds.set(
                            `${objLocation.recordKey}:${objLocation.tempId}`,
                            Number(objCreated.id),
                        );
                    }
                } catch (errError)
                {
                    reportError(errError, 'use_quarter_auto_save: requests failed.');

                    // FIXED: previously an uncaught rejection here propagated straight
                    // through Promise.all, which meant EVERY endpoint's work — including
                    // ones that had already succeeded — was discarded by the caller.
                    // Catch per-endpoint instead so a single failing batch can't destroy
                    // successful reconciliation from the others, and so the caller still
                    // gets an accurate record/snapshot back to persist as the new
                    // baseline for whatever DID work.
                    arrErrors.push({ endpoint: strEndpoint, error: errError });
                    objFailedEndpoints.add(strEndpoint);
                }
            } /* end arrRequests */,
        );

        await Promise.all(arrRequests);

        // Rebuild the snapshot from the submitted record. For any endpoint that
        // failed, deliberately reuse its OLD snapshot entries instead of
        // recomputing from current rows. This keeps the next sync's diff
        // identical to this one for that data — so failed creates/updates/deletes
        // get retried next time instead of silently falling out of the diff
        // (which would happen if we baked "current but never-persisted" state in
        // as the new baseline).
        for (const objAdapter of RESOURCE_ADAPTERS)
        {
            if (objFailedEndpoints.has(objAdapter.endpoint))
            {
                objNextSnapshot[objAdapter.recordKey as string] =
                    objPrevSnapshot[objAdapter.recordKey as string] ?? new Map();
                continue;
            }
            const strRecordKey = objAdapter.recordKey as string;
            const arrRows: any[] = (objRecord as any)[objAdapter.recordKey] ?? [];
            const objPreviousRows = objPrevSnapshot[strRecordKey] ?? new Map<string, SnapshotRow>();
            const objMap = new Map<string, SnapshotRow>();
            for (const objRow of arrRows)
            {
                objMap.set(objRow.id, {
                    id: objRow.id,
                    backendId:
                        objPreviousRows.get(objRow.id)?.backendId ??
                        objCreatedBackendIds.get(`${strRecordKey}:${objRow.id}`) ??
                        null,
                    fields: objAdapter.toPayload(objRow, objRecord),
                });
            }
            objNextSnapshot[strRecordKey] = objMap;
        }

        return { snapshot: objNextSnapshot, errors: arrErrors };
    } catch (errOperation)
    {
        /* end try */

        reportError(errOperation, 'use_quarter_auto_save: sync quarter failed.');
        throw errOperation;
    }
} /* end syncQuarter */
