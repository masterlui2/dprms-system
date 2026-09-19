/**
 * System: DPRMS
 * Purpose: Coordinate document checklist data state and interactions.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { ROLES } from '../../../../config/permissions';
import { getMockUser } from '../../../../lib/mock_auth';
import
{
    addChecklistHistoryLog,
    calculateChecklistDocumentCounts,
    fetchChecklistProjectSummaries,
    fetchProposalChecklist,
    getChecklistHistory,
    GIA_STAGES,
    saveProposalChecklistReview,
    SETUP_SETS,
    type ChecklistHistoryItem,
    type ChecklistItemStatus,
    type DocumentChecklistItem,
    type ProposalChecklistRecord,
} from '../../../../services/document_checklist_store';
import { downloadBlob } from '../../../../services/download_manager';
import { reportError } from '../../../../utils/error_reporting';
import type { ChecklistCategoryItem } from '../types';
import { getItemComplianceState } from '../utils';

/** Coordinate document checklist data state and effects. */
export function useDocumentChecklistData()
{
    const [objSearchParams, setSearchParams] = useSearchParams();
    const objCurrentUser = getMockUser();

    const blnIsRpmo = objCurrentUser?.role === ROLES.RPMO;
    const blnIsDirector = objCurrentUser?.role === ROLES.PROVINCIAL_DIRECTOR;
    const blnIsFocal = objCurrentUser?.role === ROLES.FOCAL;
    const blnIsStaff = objCurrentUser?.role === ROLES.PROJECT_STAFF;
    const blnIsAdmin = objCurrentUser?.role === ROLES.SYSTEM_ADMIN;

    const blnIsReadOnly = blnIsRpmo || blnIsDirector;
    const blnCanUpload = !blnIsReadOnly && (blnIsStaff || blnIsFocal || blnIsAdmin);
    const blnCanReview = !blnIsReadOnly && (blnIsFocal || blnIsAdmin);
    const blnCanMarkComplete = !blnIsReadOnly && (blnIsFocal || blnIsAdmin);
    const blnCanViewHistory = blnIsStaff || blnIsFocal || blnIsDirector || blnIsAdmin;

    const strUserProgram = objCurrentUser?.program as 'SETUP' | 'GIA' | undefined;

    const strActiveProgram: 'SETUP' | 'GIA' = useMemo(() =>
    {
        if ((blnIsFocal || blnIsStaff) && strUserProgram)
        {
            return strUserProgram === 'GIA' ? 'GIA' : 'SETUP';
        }
        const strParam = objSearchParams.get('program')?.toUpperCase();
        if (strParam === 'GIA')
        {
            return 'GIA';
        }
        if (strParam === 'SETUP')
        {
            return 'SETUP';
        }
        return strUserProgram || 'SETUP';
    }, [objSearchParams, blnIsFocal, blnIsStaff, strUserProgram]);

    const [arrProposals, setArrProposals] = useState<ProposalChecklistRecord[]>([]);
    const [blnIsLoading, setBlnIsLoading] = useState(true);
    const [strLoadError, setStrLoadError] = useState<string | null>(null);
    const [blnIsDetailLoading, setBlnIsDetailLoading] = useState(false);
    const [strDetailLoadError, setStrDetailLoadError] = useState<string | null>(null);

    const [intSelectedProposalId, setIntSelectedProposalId] = useState<number | null>(() =>
    {
        const strFromUrl = objSearchParams.get('proposalId') || objSearchParams.get('proposal');
        return strFromUrl ? parseInt(strFromUrl, 10) || null : null;
    });
    const [strSelectedCategory, setStrSelectedCategory] = useState<string>(() =>
    {
        const strFromUrl =
            objSearchParams.get('stage') ||
            objSearchParams.get('set') ||
            objSearchParams.get('category');
        if (strFromUrl)
        {
            return strFromUrl;
        }
        return strActiveProgram === 'GIA' ? '01' : 'SET1';
    });
    const [strStatusTab, setStrStatusTab] = useState<
        'ALL' | 'VERIFIED' | 'UNDER_REVIEW' | 'RETURNED' | 'PENDING' | 'UPLOADED'
    >('ALL');
    const [blnIsFilterDropdownOpen, setBlnIsFilterDropdownOpen] = useState(false);
    const [strViewMode, setStrViewMode] = useState<'grid' | 'list'>(() =>
    {
        const strSaved = localStorage.getItem('dprms_checklist_view_mode');
        if (strSaved === 'grid' || strSaved === 'list')
        {
            return strSaved;
        }
        const strUrlParam = objSearchParams.get('view');
        if (strUrlParam === 'grid' || strUrlParam === 'list')
        {
            return strUrlParam;
        }
        return 'list';
    });

    /** Set view mode. */
    const _setViewMode = (strMode: 'grid' | 'list') =>
    {
        setStrViewMode(strMode);
        localStorage.setItem('dprms_checklist_view_mode', strMode);
        const objNext = new URLSearchParams(objSearchParams);
        objNext.set('view', strMode);
        setSearchParams(objNext, { replace: true });
    };
    const [strSearchQuery, setStrSearchQuery] = useState('');

    const [arrEditingItems, setArrEditingItems] = useState<DocumentChecklistItem[]>([]);
    const [txtEditingOverallRemarks, setTxtEditingOverallRemarks] = useState('');
    const [strAutoSaveStatus, setStrAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [strLastSavedTime, setStrLastSavedTime] = useState<string | null>(null);
    const [blnIsCompletingReview, setBlnIsCompletingReview] = useState(false);
    const objLastSavedPayloadRef = useRef<string>('');
    const objHydratedProposalIdRef = useRef<number | null>(null);
    const objDetailRequestIdRef = useRef(0);

    const [arrHistoryList, setArrHistoryList] = useState<ChecklistHistoryItem[]>([]);
    const [blnIsHistoryExpanded, setBlnIsHistoryExpanded] = useState(false);

    const _loadData = useCallback(
        async () =>
        {
            setBlnIsLoading(true);
            setStrLoadError(null);
            try
            {
                const arrData = await fetchChecklistProjectSummaries(strActiveProgram);
                setArrProposals((arrCurrent) =>
                    arrData.map((objSummary) =>
                    {
                        const objLoaded = arrCurrent.find(
                            (objProposal) =>
                                objProposal.proposalId === objSummary.proposalId &&
                                objProposal.detailsLoaded,
                        );
                        return objLoaded
                            ? {
                                ...objLoaded,
                                ...objSummary,
                                items: objLoaded.items,
                                overallRemarks: objLoaded.overallRemarks,
                                detailsLoaded: true,
                            }
                            : objSummary;
                    }),
                );
            } catch (errError)
            {
                reportError(errError, 'use_document_checklist_data: load data failed.');

                setStrLoadError(
                    (errError as Error)?.message || 'Failed to load document checklists',
                );
            } finally
            {
                setBlnIsLoading(false);
            }
        } /* end _loadData */,
        [strActiveProgram],
    );

    useEffect(() =>
    {
        void _loadData();
    }, [_loadData]);

    const arrProgramProposals = useMemo(() =>
    {
        return arrProposals.filter(
            (objItem) =>
                objItem.program === strActiveProgram &&
                (objItem.status?.toUpperCase() === 'APPROVED' || objItem.status === 'Approved'),
        );
    }, [arrProposals, strActiveProgram]);

    const objSelectedProposalSummary = useMemo(() =>
    {
        if (!intSelectedProposalId)
        {
            return null;
        }
        return (
            arrProgramProposals.find((objItem) => objItem.proposalId === intSelectedProposalId) ||
            null
        );
    }, [arrProgramProposals, intSelectedProposalId]);

    const objActiveProposal = objSelectedProposalSummary?.detailsLoaded
        ? objSelectedProposalSummary
        : null;

    const _loadProposalDetails = useCallback(
        async (intProposalId: number, objSummary?: ProposalChecklistRecord | null) =>
        {
            const intRequestId = ++objDetailRequestIdRef.current;
            setBlnIsDetailLoading(true);
            setStrDetailLoadError(null);
            try
            {
                const objLoaded = await fetchProposalChecklist(
                    intProposalId,
                    objSummary || undefined,
                );
                if (intRequestId !== objDetailRequestIdRef.current)
                {
                    return;
                }
                if (objLoaded.program !== strActiveProgram)
                {
                    throw new Error('This project is not available in the selected program.');
                }
                setArrProposals((arrCurrent) =>
                {
                    const blnExists = arrCurrent.some(
                        (objProposal) => objProposal.proposalId === intProposalId,
                    );
                    if (!blnExists)
                    {
                        return [...arrCurrent, objLoaded];
                    }
                    return arrCurrent.map((objProposal) =>
                        objProposal.proposalId === intProposalId ? objLoaded : objProposal,
                    );
                });
            } catch (errError)
            {
                reportError(errError, 'use_document_checklist_data: load proposal details failed.');

                if (intRequestId !== objDetailRequestIdRef.current)
                {
                    return;
                }
                setStrDetailLoadError(
                    (errError as Error)?.message ||
                    'Failed to load the selected project documents.',
                );
            } finally
            {
                if (intRequestId === objDetailRequestIdRef.current)
                {
                    setBlnIsDetailLoading(false);
                }
            }
        } /* end _loadProposalDetails */,
        [strActiveProgram],
    );

    useEffect(() =>
    {
        if (!intSelectedProposalId || blnIsLoading || objSelectedProposalSummary?.detailsLoaded)
        {
            return;
        }
        void _loadProposalDetails(intSelectedProposalId, objSelectedProposalSummary);
    }, [blnIsLoading, _loadProposalDetails, intSelectedProposalId, objSelectedProposalSummary]);

    const _reloadActiveProposal = useCallback(async () =>
    {
        try
        {
            if (!intSelectedProposalId)
            {
                await _loadData();
                return;
            }
            await _loadProposalDetails(intSelectedProposalId, objSelectedProposalSummary);
        } catch (errOperation)
        {
            reportError(
                errOperation,
                'use_document_checklist_data: reload active proposal failed.',
            );
            throw errOperation;
        }
    }, [_loadData, _loadProposalDetails, intSelectedProposalId, objSelectedProposalSummary]);

    useEffect(() =>
    {
        const strUrlProposalId =
            objSearchParams.get('proposalId') || objSearchParams.get('proposal');
        if (strUrlProposalId)
        {
            const intParsed = parseInt(strUrlProposalId, 10);
            if (intParsed && intParsed !== intSelectedProposalId)
            {
                setIntSelectedProposalId(intParsed);
            }
        }
        const strUrlStage =
            objSearchParams.get('stage') ||
            objSearchParams.get('set') ||
            objSearchParams.get('category');
        if (strUrlStage && strUrlStage !== strSelectedCategory)
        {
            setStrSelectedCategory(strUrlStage);
        }
    }, [objSearchParams, intSelectedProposalId, strSelectedCategory]);

    useEffect(
        () =>
        {
            if (blnIsLoading || blnIsDetailLoading)
            {
                return;
            }

            if (objActiveProposal)
            {
                if (objHydratedProposalIdRef.current === objActiveProposal.proposalId)
                {
                    return;
                }

                objHydratedProposalIdRef.current = objActiveProposal.proposalId;
                setIntSelectedProposalId(objActiveProposal.proposalId);
                const objItemsCopy = JSON.parse(JSON.stringify(objActiveProposal.items));
                const txtRemarksCopy = objActiveProposal.overallRemarks || '';
                setArrEditingItems(objItemsCopy);
                setTxtEditingOverallRemarks(txtRemarksCopy);
                objLastSavedPayloadRef.current = JSON.stringify({
                    proposalId: objActiveProposal.proposalId,
                    items: objItemsCopy,
                    remarks: txtRemarksCopy,
                });
                setStrAutoSaveStatus('idle');
                setArrHistoryList(getChecklistHistory(objActiveProposal.proposalId));
            } else if (!intSelectedProposalId)
            {
                objHydratedProposalIdRef.current = null;
                setIntSelectedProposalId(null);
                setArrEditingItems([]);
                setTxtEditingOverallRemarks('');
                setArrHistoryList([]);
                objLastSavedPayloadRef.current = '';
                setStrAutoSaveStatus('idle');
            }
        } /* end useDocumentChecklistData */,
        [objActiveProposal, blnIsDetailLoading, blnIsLoading, intSelectedProposalId],
    );

    const intActiveProposalId = objActiveProposal?.proposalId ?? null;

    useEffect(
        () =>
        {
            if (!intActiveProposalId || blnIsReadOnly || arrEditingItems.length === 0)
            {
                return;
            }

            const strCurrentPayload = JSON.stringify({
                proposalId: intActiveProposalId,
                items: arrEditingItems,
                remarks: txtEditingOverallRemarks,
            });

            if (strCurrentPayload === objLastSavedPayloadRef.current)
            {
                return;
            }

            setStrAutoSaveStatus('saving');
            const intTimer = setTimeout(
                async () =>
                {
                    try
                    {
                        await saveProposalChecklistReview(
                            intActiveProposalId,
                            arrEditingItems,
                            txtEditingOverallRemarks,
                        );

                        const objCounts = calculateChecklistDocumentCounts(arrEditingItems);
                        const {
                            totalRequired: intTotalRequired,
                            uploadedCount: intUploadedCount,
                            remainingCount: intRemainingCount,
                            compliedCount: intCompliedCount,
                        } = objCounts;
                        const dblCompliancePercentage =
                            intTotalRequired > 0
                                ? Math.round((intCompliedCount / intTotalRequired) * 100)
                                : 0;

                        setArrProposals((arrPrevious) =>
                            arrPrevious.map((objItem) =>
                            {
                                if (objItem.proposalId !== intActiveProposalId)
                                {
                                    return objItem;
                                }
                                return {
                                    ...objItem,
                                    items: arrEditingItems,
                                    overallRemarks: txtEditingOverallRemarks,
                                    compliedCount: intCompliedCount,
                                    totalRequired: intTotalRequired,
                                    uploadedCount: intUploadedCount,
                                    remainingCount: intRemainingCount,
                                    compliancePercentage: dblCompliancePercentage,
                                    lastUpdated: new Date().toISOString(),
                                };
                            }),
                        );
                        objLastSavedPayloadRef.current = strCurrentPayload;
                        setStrLastSavedTime(
                            new Date().toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                            }),
                        );
                        setStrAutoSaveStatus('saved');
                    } /* end try */ catch (errCaught)
                    {
                        reportError(errCaught, 'use_document_checklist_data: timer failed.');

                        setStrAutoSaveStatus('idle');
                    }
                } /* end intTimer */,
                600,
            );

            return () => clearTimeout(intTimer);
        } /* end useDocumentChecklistData */,
        [arrEditingItems, txtEditingOverallRemarks, intActiveProposalId, blnIsReadOnly],
    );

    const arrCategories: ChecklistCategoryItem[] = useMemo(() =>
    {
        if (strActiveProgram === 'GIA')
        {
            return GIA_STAGES.map((objItem) => ({
                id: objItem.id,
                stageOrSetTag: `Stage ${objItem.number}`,
                name: `Stage ${objItem.number}: ${objItem.shortTitle}`,
                shortName: objItem.shortTitle,
                subtitle: objItem.subtitle,
            }));
        }
        return SETUP_SETS.map((objItem) => ({
            id: objItem.id,
            stageOrSetTag: objItem.number.replace('SET', 'SET '),
            name: `${objItem.number.replace('SET', 'SET ')} · ${objItem.shortTitle}`,
            shortName: objItem.shortTitle,
            subtitle: objItem.subtitle,
        }));
    }, [strActiveProgram]);

    const arrFilteredItems = useMemo(
        () =>
        {
            return arrEditingItems.filter(
                (objItem) =>
                {
                    if (strSelectedCategory !== 'ALL')
                    {
                        const strItemCat = objItem.setId || objItem.stageId;
                        if (strItemCat !== strSelectedCategory)
                        {
                            return false;
                        }
                    }

                    const objState = getItemComplianceState(objItem);
                    if (strStatusTab === 'VERIFIED' && objState.type !== 'SATISFIED')
                    {
                        return false;
                    }
                    if (strStatusTab === 'UNDER_REVIEW' && objState.type !== 'UNDER_REVIEW')
                    {
                        return false;
                    }
                    if (strStatusTab === 'RETURNED' && objState.type !== 'RETURNED')
                    {
                        return false;
                    }
                    if (strStatusTab === 'PENDING' && objState.type !== 'PENDING')
                    {
                        return false;
                    }
                    if (strStatusTab === 'UPLOADED' && !objItem.uploadedDoc && !objItem.isPresent)
                    {
                        return false;
                    }

                    if (strSearchQuery.trim())
                    {
                        const strQuarter = strSearchQuery.toLowerCase();
                        const blnMatchName = objItem.name.toLowerCase().includes(strQuarter);
                        const blnMatchGroup = objItem.group.toLowerCase().includes(strQuarter);
                        const blnMatchFile =
                            objItem.uploadedDoc?.file_name.toLowerCase().includes(strQuarter) ||
                            false;
                        if (!blnMatchName && !blnMatchGroup && !blnMatchFile)
                        {
                            return false;
                        }
                    }

                    return true;
                } /* end arrFilteredItems */,
            );
        } /* end arrFilteredItems */,
        [arrEditingItems, strSelectedCategory, strStatusTab, strSearchQuery],
    );

    const objStats = useMemo(() =>
    {
        const intTotal = arrEditingItems.length;
        const intRequired =
            arrEditingItems.filter((objIndex) => objIndex.isRequired).length || intTotal;
        const intVerified = arrEditingItems.filter(
            (objIndex) => getItemComplianceState(objIndex).type === 'SATISFIED',
        ).length;
        const intUnderReview = arrEditingItems.filter(
            (objIndex) => getItemComplianceState(objIndex).type === 'UNDER_REVIEW',
        ).length;
        const intReturned = arrEditingItems.filter(
            (objIndex) => getItemComplianceState(objIndex).type === 'RETURNED',
        ).length;
        const intPending = arrEditingItems.filter(
            (objIndex) => getItemComplianceState(objIndex).type === 'PENDING',
        ).length;
        const intUploaded = arrEditingItems.filter((objIndex) =>
            Boolean(objIndex.uploadedDoc),
        ).length;
        const dblPercent = intRequired > 0 ? Math.round((intVerified / intRequired) * 100) : 0;

        return {
            total: intTotal,
            required: intRequired,
            uploaded: intUploaded,
            verified: intVerified,
            underReview: intUnderReview,
            returned: intReturned,
            pending: intPending,
            percent: dblPercent,
        };
    }, [arrEditingItems]);

    /** Handle select proposal. */
    const _handleSelectProposal = (objProposal: ProposalChecklistRecord) =>
    {
        objDetailRequestIdRef.current += 1;
        objHydratedProposalIdRef.current = null;
        setIntSelectedProposalId(objProposal.proposalId);
        setArrEditingItems([]);
        setTxtEditingOverallRemarks('');
        setStrDetailLoadError(null);
        objLastSavedPayloadRef.current = '';
        setStrAutoSaveStatus('idle');

        const objNext = new URLSearchParams(objSearchParams);
        objNext.set('program', objProposal.program);
        objNext.set('proposalId', String(objProposal.proposalId));
        objNext.delete('proposal');
        objNext.delete('stage');
        objNext.delete('set');
        objNext.delete('category');
        setSearchParams(objNext);
    };

    /** Handle back to projects. */
    const _handleBackToProjects = () =>
    {
        objDetailRequestIdRef.current += 1;
        objHydratedProposalIdRef.current = null;
        setIntSelectedProposalId(null);
        setArrEditingItems([]);
        setTxtEditingOverallRemarks('');
        setArrHistoryList([]);
        setStrDetailLoadError(null);
        setBlnIsDetailLoading(false);
        setStrAutoSaveStatus('idle');
        objLastSavedPayloadRef.current = '';

        const objNext = new URLSearchParams(objSearchParams);
        objNext.delete('proposalId');
        objNext.delete('proposal');
        objNext.delete('stage');
        objNext.delete('set');
        objNext.delete('category');
        setSearchParams(objNext);
    };

    /** Handle toggle item verify. */
    const _handleToggleItemVerify = async (strItemId: string) =>
    {
        try
        {
            if (blnIsReadOnly)
            {
                return;
            }
            const objTargetItem = arrEditingItems.find((objIndex) => objIndex.id === strItemId);
            if (!objTargetItem)
            {
                return;
            }

            if (!objTargetItem.isPresent && !objTargetItem.uploadedDoc)
            {
                const objResult = await Swal.fire({
                    title: 'Manual Compliance Verification',
                    html: `
          <div class="text-left space-y-2.5 pt-1">
            <p class="text-xs text-slate-500 font-medium">Evaluating requirement:</p>
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 leading-relaxed">
              ${objTargetItem.name}
            </div>
            <p class="text-xs text-slate-600 leading-relaxed">
              No digital file is attached. Do you wish to manually verify and mark this requirement as <b>Complied</b>?
            </p>
            <p class="text-[11px] text-slate-400">
              Review records and compliance metrics will be updated and auto-saved automatically.
            </p>
          </div>
        `,
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#0f53b7',
                    cancelButtonColor: '#64748b',
                    confirmButtonText: 'Confirm Verification',
                    cancelButtonText: 'Cancel',
                    customClass: {
                        popup: 'rounded-3xl p-6 font-sans',
                        confirmButton: 'rounded-xl px-4 py-2.5 font-bold text-xs',
                        cancelButton: 'rounded-xl px-4 py-2.5 font-bold text-xs',
                    },
                });
                if (!objResult.isConfirmed)
                {
                    return;
                }
            } /* end if */

            const blnNextPresent = !objTargetItem.isPresent;
            const strNextStatus: ChecklistItemStatus = blnNextPresent ? 'Complied' : 'Missing';

            if (objActiveProposal && objTargetItem)
            {
                const objLog = addChecklistHistoryLog({
                    proposalId: objActiveProposal.proposalId,
                    action: blnNextPresent ? 'VERIFY' : 'UNVERIFY',
                    itemName: objTargetItem.name,
                    userName: objCurrentUser?.name || 'User',
                    userRole: objCurrentUser?.role || ROLES.FOCAL,
                    details: blnNextPresent
                        ? `Verified compliance for ${objTargetItem.name}.`
                        : `Unmarked requirement for ${objTargetItem.name}.`,
                });
                setArrHistoryList((arrPrevious) => [objLog, ...arrPrevious]);
            }

            setArrEditingItems((arrPrevious) =>
            {
                const arrNext = arrPrevious.map((objItem) =>
                {
                    if (objItem.id !== strItemId)
                    {
                        return objItem;
                    }
                    return {
                        ...objItem,
                        isPresent: blnNextPresent,
                        status: strNextStatus,
                        reviewedAt: blnNextPresent ? new Date().toISOString() : undefined,
                    };
                });
                if (objActiveProposal)
                {
                    saveProposalChecklistReview(
                        objActiveProposal.proposalId,
                        arrNext,
                        txtEditingOverallRemarks,
                    ).catch(() => { });
                }
                return arrNext;
            });

            if (objActiveProposal)
            {
                setArrProposals((arrPrevious) =>
                    arrPrevious.map(
                        (objItem) =>
                        {
                            if (objItem.proposalId !== objActiveProposal.proposalId)
                            {
                                return objItem;
                            }
                            const arrUpdatedItems = objItem.items.map((objIt) =>
                                objIt.id === strItemId
                                    ? {
                                        ...objIt,
                                        isPresent: blnNextPresent,
                                        status: strNextStatus,
                                        reviewedAt: blnNextPresent
                                            ? new Date().toISOString()
                                            : undefined,
                                    }
                                    : objIt,
                            );
                            const objCounts = calculateChecklistDocumentCounts(arrUpdatedItems);
                            const {
                                totalRequired: intTotalRequired,
                                uploadedCount: intUploadedCount,
                                remainingCount: intRemainingCount,
                                compliedCount: intCompliedCount,
                            } = objCounts;
                            const dblCompliancePercentage =
                                intTotalRequired > 0
                                    ? Math.round((intCompliedCount / intTotalRequired) * 100)
                                    : 0;
                            return {
                                ...objItem,
                                items: arrUpdatedItems,
                                totalRequired: intTotalRequired,
                                uploadedCount: intUploadedCount,
                                remainingCount: intRemainingCount,
                                compliedCount: intCompliedCount,
                                compliancePercentage: dblCompliancePercentage,
                            };
                        } /* end _handleToggleItemVerify */,
                    ),
                );
            } /* end if */
        } catch (errOperation)
        {
            /* end try */

            reportError(
                errOperation,
                'use_document_checklist_data: handle toggle item verify failed.',
            );
            throw errOperation;
        }
    }; /* end _handleToggleItemVerify */

    /** Handle mark review completed. */
    const _handleMarkReviewCompleted = async () =>
    {
        try
        {
            if (!objActiveProposal || blnIsReadOnly || blnIsCompletingReview)
            {
                return;
            }

            const intMissingRequiredCount = arrEditingItems.filter(
                (objIndex) => objIndex.isRequired && !objIndex.isPresent,
            ).length;

            if (intMissingRequiredCount > 0)
            {
                const objResult = await Swal.fire({
                    title: 'Incomplete Requirements',
                    html: `
          <div class="text-left space-y-2.5 pt-1">
            <p class="text-xs text-slate-600 leading-relaxed">
              There are still <b>${intMissingRequiredCount} required item(s)</b> unverified or pending attachment.
            </p>
            <p class="text-xs text-slate-500">
              Do you want to finalize and mark this document checklist evaluation as <b>Completed</b> anyway?
            </p>
          </div>
        `,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#0f53b7',
                    cancelButtonColor: '#64748b',
                    confirmButtonText: 'Yes, Finalize Review',
                    cancelButtonText: 'Continue Review',
                    customClass: {
                        popup: 'rounded-3xl p-6 font-sans',
                        confirmButton: 'rounded-xl px-4 py-2.5 font-bold text-xs',
                        cancelButton: 'rounded-xl px-4 py-2.5 font-bold text-xs',
                    },
                });
                if (!objResult.isConfirmed)
                {
                    return;
                }
            } /* end if */ else
            {
                const objResult = await Swal.fire({
                    title: 'Mark Review as Completed?',
                    html: `
          <div class="text-left space-y-2.5 pt-1">
            <p class="text-xs text-slate-600 leading-relaxed">
              You are completing the document evaluation for <b>${objActiveProposal.enterpriseName}</b> (${objActiveProposal.referenceNumber}).
            </p>
            <p class="text-xs text-slate-500">
              All checklist requirements and evaluation notes will be finalized.
            </p>
          </div>
        `,
                    icon: 'success',
                    showCancelButton: true,
                    confirmButtonColor: '#059669',
                    cancelButtonColor: '#64748b',
                    confirmButtonText: 'Confirm Completion',
                    cancelButtonText: 'Cancel',
                    customClass: {
                        popup: 'rounded-3xl p-6 font-sans',
                        confirmButton: 'rounded-xl px-4 py-2.5 font-bold text-xs',
                        cancelButton: 'rounded-xl px-4 py-2.5 font-bold text-xs',
                    },
                });
                if (!objResult.isConfirmed)
                {
                    return;
                }
            } /* end if */

            setBlnIsCompletingReview(true);
            try
            {
                await saveProposalChecklistReview(
                    objActiveProposal.proposalId,
                    arrEditingItems,
                    txtEditingOverallRemarks,
                );

                const objCounts = calculateChecklistDocumentCounts(arrEditingItems);
                const {
                    totalRequired: intTotalRequired,
                    uploadedCount: intUploadedCount,
                    remainingCount: intRemainingCount,
                    compliedCount: intCompliedCount,
                } = objCounts;
                const dblCompliancePercentage =
                    intTotalRequired > 0
                        ? Math.round((intCompliedCount / intTotalRequired) * 100)
                        : 0;

                setArrProposals((arrPrevious) =>
                    arrPrevious.map((objItem) =>
                    {
                        if (objItem.proposalId !== objActiveProposal.proposalId)
                        {
                            return objItem;
                        }
                        return {
                            ...objItem,
                            items: arrEditingItems,
                            overallRemarks: txtEditingOverallRemarks,
                            compliedCount: intCompliedCount,
                            totalRequired: intTotalRequired,
                            uploadedCount: intUploadedCount,
                            remainingCount: intRemainingCount,
                            compliancePercentage: dblCompliancePercentage,
                            lastUpdated: new Date().toISOString(),
                        };
                    }),
                );

                if (objActiveProposal)
                {
                    const objLog = addChecklistHistoryLog({
                        proposalId: objActiveProposal.proposalId,
                        action: 'COMPLETE_REVIEW',
                        userName: objCurrentUser?.name || 'Focal Evaluator',
                        userRole: objCurrentUser?.role || ROLES.FOCAL,
                        details:
                            'Finalized and marked document checklist evaluation review as Completed.',
                    });
                    setArrHistoryList((arrPrevious) => [objLog, ...arrPrevious]);
                }

                setStrLastSavedTime(
                    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                );
                setStrAutoSaveStatus('saved');

                Swal.fire({
                    icon: 'success',
                    title: 'Review Completed',
                    text: `Document review for ${objActiveProposal.enterpriseName} has been successfully completed.`,
                    timer: 2000,
                    showConfirmButton: false,
                });
            } /* end try */ catch (errCaught)
            {
                reportError(
                    errCaught,
                    'use_document_checklist_data: handle mark review completed failed.',
                );

                Swal.fire({
                    icon: 'error',
                    title: 'Completion Failed',
                    text: 'Unable to finalize review. Please try again.',
                    confirmButtonColor: '#0f53b7',
                });
            } finally
            {
                setBlnIsCompletingReview(false);
            }
        } catch (errOperation)
        {
            /* end try */

            reportError(
                errOperation,
                'use_document_checklist_data: handle mark review completed failed.',
            );
            throw errOperation;
        }
    }; /* end _handleMarkReviewCompleted */

    /** Export summary csv. */
    const _exportSummaryCsv = async () =>
    {
        if (arrProgramProposals.length === 0 || !objCurrentUser)
        {
            return;
        }
        const arrHeaders = [
            'Reference Number',
            'Enterprise / Project Title',
            'Proponent Name',
            'Program',
            'Status',
            'Complied Requirements',
            'Total Required',
            'Compliance Rate',
            'Overall Remarks',
        ];
        const arrRows = arrProgramProposals.map((objItem) => [
            `"${objItem.referenceNumber}"`,
            `"${objItem.enterpriseName.replace(/"/g, '""')}"`,
            `"${objItem.proponentName.replace(/"/g, '""')}"`,
            `"${objItem.program}"`,
            `"${objItem.status}"`,
            objItem.compliedCount,
            objItem.totalRequired,
            `${objItem.compliancePercentage}%`,
            `"${(objItem.overallRemarks || '').replace(/"/g, '""')}"`,
        ]);

        const txtCsvContent = [
            arrHeaders.join(','),
            ...arrRows.map((arrEvent) => arrEvent.join(',')),
        ].join('\n');
        try
        {
            await downloadBlob({
                blob: new Blob([txtCsvContent], { type: 'text/csv;charset=utf-8' }),
                fileName: `${strActiveProgram.toLowerCase()}_document_checklist_${new Date().toISOString().split('T')[0]}.csv`,
                program: strActiveProgram,
                user: objCurrentUser,
            });
        } catch (errError)
        {
            reportError(errError, 'use_document_checklist_data: export summary csv failed.');

            if (!(errError instanceof DOMException && errError.name === 'AbortError'))
            {
                reportError(errError, 'Failed to export document checklist:');
                void Swal.fire({
                    icon: 'error',
                    title: 'Export Failed',
                    text: 'The checklist CSV could not be saved. Please try again.',
                    confirmButtonColor: '#0f53b7',
                });
            }
        }
    }; /* end _exportSummaryCsv */

    return {
        currentUser: objCurrentUser,
        isRpmo: blnIsRpmo,
        isDirector: blnIsDirector,
        isFocal: blnIsFocal,
        isStaff: blnIsStaff,
        isAdmin: blnIsAdmin,
        isReadOnly: blnIsReadOnly,
        canUpload: blnCanUpload,
        canReview: blnCanReview,
        canMarkComplete: blnCanMarkComplete,
        canViewHistory: blnCanViewHistory,
        activeProgram: strActiveProgram,
        proposals: arrProposals,
        programProposals: arrProgramProposals,
        setProposals: setArrProposals,
        isLoading: blnIsLoading,
        loadError: strLoadError,
        loadData: _loadData,
        reloadActiveProposal: _reloadActiveProposal,
        activeProposal: objActiveProposal,
        selectedProposalId: intSelectedProposalId,
        isDetailLoading: blnIsDetailLoading,
        detailLoadError: strDetailLoadError,
        handleSelectProposal: _handleSelectProposal,
        handleBackToProjects: _handleBackToProjects,
        selectedCategory: strSelectedCategory,
        setSelectedCategory: setStrSelectedCategory,
        statusTab: strStatusTab,
        setStatusTab: setStrStatusTab,
        isFilterDropdownOpen: blnIsFilterDropdownOpen,
        setIsFilterDropdownOpen: setBlnIsFilterDropdownOpen,
        viewMode: strViewMode,
        setViewMode: _setViewMode,
        searchQuery: strSearchQuery,
        setSearchQuery: setStrSearchQuery,
        categories: arrCategories,
        filteredItems: arrFilteredItems,
        stats: objStats,
        editingItems: arrEditingItems,
        setEditingItems: setArrEditingItems,
        editingOverallRemarks: txtEditingOverallRemarks,
        setEditingOverallRemarks: setTxtEditingOverallRemarks,
        autoSaveStatus: strAutoSaveStatus,
        lastSavedTime: strLastSavedTime,
        isCompletingReview: blnIsCompletingReview,
        handleToggleItemVerify: _handleToggleItemVerify,
        handleMarkReviewCompleted: _handleMarkReviewCompleted,
        exportSummaryCsv: _exportSummaryCsv,
        historyList: arrHistoryList,
        setHistoryList: setArrHistoryList,
        isHistoryExpanded: blnIsHistoryExpanded,
        setIsHistoryExpanded: setBlnIsHistoryExpanded,
    };
} /* end useDocumentChecklistData */
