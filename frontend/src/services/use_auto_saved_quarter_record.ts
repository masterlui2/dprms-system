/**
 * System: DPRMS
 * Purpose: Coordinate auto saved quarter record state and interactions.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
// src/services/useAutoSavedQuarterRecord.ts
//
// Debounced glue between the quarter-monitoring form and syncQuarter().
// NOTE: narrative (problemsAndActions / plansForImprovement) is intentionally
// NOT synced here — there's no narrativeAdapter in RESOURCE_ADAPTERS because
// the backend side of that resource isn't being fixed right now. Those two
// fields stay local-only (they still live on `record` and get edited via
// updateRecord like everything else, they just never round-trip to the
// server). Do not add a narrative adapter to fix this without confirming
// the backend issue is actually resolved.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Quarter, SetupMonitoringQuarterRecord } from '../types/setup_monitoring';
import { reportError } from '../utils/error_reporting';
import { fetchQuarterlyMetricsWithId } from './setup_monitoring_store';
import
{
    buildSnapshot,
    syncQuarter,
    type QuarterSnapshot,
    type SyncEndpointError,
} from './use_quarter_auto_save';

const DEFAULT_DEBOUNCE_MS = 1200;

export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

interface Args
{
    projectId: string;
    year: number;
    quarter: Quarter;
    overrides?: Partial<Pick<SetupMonitoringQuarterRecord, 'enterpriseName' | 'enterpriseAddress'>>;
    debounceMs?: number;
}

/** Coordinate auto saved quarter record state and effects. */
export function useAutoSavedQuarterRecord({
    projectId: strProjectId,
    year: intYear,
    quarter: strQuarter,
    overrides: objOverrides,
    debounceMs: intDebounceMs = DEFAULT_DEBOUNCE_MS,
}: Args)
{
    const [objRecord, setObjRecord] = useState<SetupMonitoringQuarterRecord | null>(null);
    const [intQuarterMetricId, setIntQuarterMetricId] = useState<number | null>(null);
    const [strStatus, setStrStatus] = useState<SaveStatus>('idle');
    const [arrErrors, setArrErrors] = useState<SyncEndpointError[]>([]);
    const [blnLoading, setBlnLoading] = useState(true);

    // Refs so the debounce timer / in-flight sync always see the latest data
    // without re-binding callbacks on every keystroke.
    const objRecordRef = useRef<SetupMonitoringQuarterRecord | null>(null);
    const objSnapshotRef = useRef<QuarterSnapshot>({});
    const objQuarterMetricIdRef = useRef<number | null>(null);
    const objTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const objInFlightRef = useRef(false);
    // A change arrived while a sync was already running -> run once more
    // right after, instead of losing it.
    const objDirtyWhileSavingRef = useRef(false);
    const objUnmountedRef = useRef(false);

    // Override literals must not reload the draft on every parent render.
    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(
        () =>
        {
            objUnmountedRef.current = false;
            setBlnLoading(true);
            fetchQuarterlyMetricsWithId(strProjectId, intYear, strQuarter, objOverrides)
                .then(({ record: objRec, quarterMetricId: intQid }) =>
                {
                    if (objUnmountedRef.current)
                    {
                        return;
                    }
                    objRecordRef.current = objRec;
                    objSnapshotRef.current = buildSnapshot(objRec);
                    objQuarterMetricIdRef.current = intQid;
                    setObjRecord(objRec);
                    setIntQuarterMetricId(intQid);
                    setStrStatus('idle');
                    setArrErrors([]);
                })
                .finally(() =>
                {
                    if (!objUnmountedRef.current)
                    {
                        setBlnLoading(false);
                    }
                });
            return () =>
            {
                objUnmountedRef.current = true;
                if (objTimerRef.current)
                {
                    clearTimeout(objTimerRef.current);
                }
            };
        } /* end useAutoSavedQuarterRecord */,
        [strProjectId, intYear, strQuarter],
    );
    /* eslint-enable react-hooks/exhaustive-deps */

    const _runSync = useCallback(
        async () =>
        {
            try
            {
                const intQid = objQuarterMetricIdRef.current;
                if (intQid == null || !objRecordRef.current)
                {
                    return;
                }

                if (objInFlightRef.current)
                {
                    objDirtyWhileSavingRef.current = true;
                    return;
                }

                objInFlightRef.current = true;
                setStrStatus('saving');
                try
                {
                    const objResult = await syncQuarter(
                        intQid,
                        objRecordRef.current,
                        objSnapshotRef.current,
                    );
                    if (objUnmountedRef.current)
                    {
                        return;
                    }
                    objSnapshotRef.current = objResult.snapshot;
                    setArrErrors(objResult.errors);
                    setStrStatus(objResult.errors.length > 0 ? 'error' : 'saved');
                } finally
                {
                    objInFlightRef.current = false;
                    if (objDirtyWhileSavingRef.current)
                    {
                        objDirtyWhileSavingRef.current = false;
                        _runSync();
                    }
                }
            } catch (errOperation)
            {
                /* end try */

                reportError(errOperation, 'use_auto_saved_quarter_record: run sync failed.');
                throw errOperation;
            }
        } /* end _runSync */,
        [],
    );

    const _scheduleSync = useCallback(() =>
    {
        if (objQuarterMetricIdRef.current == null)
        {
            return;
        } // nothing to sync against yet
        if (objTimerRef.current)
        {
            clearTimeout(objTimerRef.current);
        }
        setStrStatus('pending');
        objTimerRef.current = setTimeout(() =>
        {
            objTimerRef.current = null;
            _runSync();
        }, intDebounceMs);
    }, [intDebounceMs, _runSync]);

    // Drop-in replacement for the `onChange` prop every Tab component expects.
    const _updateRecord = useCallback(
        (objNext: SetupMonitoringQuarterRecord) =>
        {
            objRecordRef.current = objNext;
            setObjRecord(objNext);
            _scheduleSync();
        },
        [_scheduleSync],
    );

    // Force a pending save to run now (e.g. before navigating away or on an
    // explicit "Save" button) instead of waiting out the debounce window.
    const _flush = useCallback(() =>
    {
        if (objTimerRef.current)
        {
            clearTimeout(objTimerRef.current);
            objTimerRef.current = null;
        }
        return _runSync();
    }, [_runSync]);

    useEffect(() =>
    {
        return () =>
        {
            // best-effort flush on unmount so a trailing debounced edit isn't lost
            if (objTimerRef.current)
            {
                clearTimeout(objTimerRef.current);
                _runSync();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        record: objRecord,
        updateRecord: _updateRecord,
        status: strStatus,
        errors: arrErrors,
        loading: blnLoading,
        flush: _flush,
        /** false until the backend has a row for this project/year/quarter */
        canAutosave: intQuarterMetricId != null,
    };
} /* end useAutoSavedQuarterRecord */
