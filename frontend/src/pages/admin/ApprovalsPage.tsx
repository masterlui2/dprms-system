/**
 * System: DPRMS
 * Purpose: Render approvals page for the application pages.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { ArrowRight, Check, Eye, FileCheck2, Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { DataTable, type DataColumn } from '../../components/admin/DataTable';
import
{
    ProposalReviewModal,
    type ReviewSection,
} from '../../components/admin/ProposalReviewModal';
import { AnimatedTabs } from '../../components/common/AnimatedTabs';
import { ROLES } from '../../config/permissions';
import { type ProposalRecord } from '../../data/admin';
import { getMockUser } from '../../lib/mock_auth';
import { applyProposalDecision, getAllProposals } from '../../services/proposal_store';
import type { ApplicationRecord } from '../../types/application';
import { cn } from '../../utils/cn';
import { reportError } from '../../utils/error_reporting';

/** Render approvals page and its available actions. */
export function ApprovalsPage()
{
    const _navigate = useNavigate();
    const objLocation = useLocation();
    const objCurrentUser = getMockUser();
    const blnCanOpenProjectMonitoring = objCurrentUser?.role === ROLES.FOCAL;
    const strLockedProgram =
        objCurrentUser?.program === 'SETUP' || objCurrentUser?.program === 'GIA'
            ? objCurrentUser.program
            : objCurrentUser?.email?.toLowerCase().startsWith('gia.') ||
                objCurrentUser?.email?.toLowerCase().includes('gia') ||
                objCurrentUser?.name?.toUpperCase().includes('GIA') ||
                objCurrentUser?.name?.toUpperCase().includes('CEST')
                ? 'GIA'
                : objCurrentUser?.email?.toLowerCase().startsWith('setup.') ||
                    objCurrentUser?.email?.toLowerCase().includes('setup') ||
                    objCurrentUser?.name?.toUpperCase().includes('SETUP') ||
                    objCurrentUser?.name?.toUpperCase().includes('SSCP')
                    ? 'SETUP'
                    : null;

    const [strLifecycleTab, setStrLifecycleTab] = useState<
        'all' | 'review' | 'in_process' | 'for_approval' | 'approved' | 'disapproved'
    >(() =>
    {
        if (objLocation.pathname.endsWith('/application-review'))
        {
            return 'review';
        }
        if (objLocation.pathname.endsWith('/executive-approval'))
        {
            return 'for_approval';
        }
        return 'all';
    });
    const [objReview, setObjReview] = useState<{
        proposal: ProposalRecord;
        section: ReviewSection;
    } | null>(null);
    const [arrApplications, setArrApplications] = useState<ApplicationRecord[]>([]);
    const [strError, setStrError] = useState<string | null>(null);

    // Direct Row Action Modal (Disapprove / Return)
    const [objDirectActionModal, setObjDirectActionModal] = useState<{
        proposal: ProposalRecord;
        type: 'disapprove' | 'return_in_process';
    } | null>(null);
    const [txtDirectRemarks, setTxtDirectRemarks] = useState('');
    const [blnDirectSubmitting, setBlnDirectSubmitting] = useState(false);
    const [strDirectError, setStrDirectError] = useState<string | null>(null);

    /** Handle approve confirmation. */
    async function _handleApproveConfirmation(objProposal: ProposalRecord)
    {
        try
        {
            if (!objProposal.proposalId)
            {
                return;
            }

            const objResult = await Swal.fire({
                title: 'Approve Application?',
                text: `Are you sure you want to officially approve "${objProposal.title}" (${objProposal.id})? This will approve the project for grant allocation.`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#059669',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Yes, Approve',
                cancelButtonText: 'Cancel',
                reverseButtons: true,
            });

            if (objResult.isConfirmed)
            {
                try
                {
                    Swal.fire({
                        title: 'Approving application...',
                        allowOutsideClick: false,
                        didOpen: () =>
                        {
                            Swal.showLoading();
                        },
                    });

                    const strSavedStatus = await applyProposalDecision({
                        decision: 'approve',
                        proposalId: objProposal.proposalId,
                    });

                    setArrApplications((arrCurrent) =>
                        arrCurrent.map((objApp) =>
                            objApp.referenceNo === objProposal.id ||
                                String(objApp.proposalId) === String(objProposal.proposalId)
                                ? {
                                    ...objApp,
                                    status: strSavedStatus as ApplicationRecord['status'],
                                }
                                : objApp,
                        ),
                    );

                    await Swal.fire({
                        icon: 'success',
                        title: 'Application Approved!',
                        text: `Application "${objProposal.id}" has been officially approved.`,
                        timer: 2000,
                        showConfirmButton: false,
                    });
                } /* end try */ catch (errError)
                {
                    reportError(errError, 'ApprovalsPage: handle approve confirmation failed.');

                    reportError(errError, 'Failed to approve application:');
                    const txtServerMessage = (
                        errError as { response?: { data?: { message?: string; }; }; }
                    ).response?.data?.message;
                    await Swal.fire({
                        icon: 'error',
                        title: 'Approval Failed',
                        text:
                            txtServerMessage ||
                            'The application could not be approved. Please try again.',
                    });
                }
            } /* end if */
        } catch (errOperation)
        {
            /* end try */

            reportError(errOperation, 'ApprovalsPage: handle approve confirmation failed.');
            throw errOperation;
        }
    } /* end _handleApproveConfirmation */

    /** Handle direct decision. */
    async function _handleDirectDecision()
    {
        if (!objDirectActionModal)
        {
            return;
        }
        const { proposal: objProposal, type: strType } = objDirectActionModal;
        if (!txtDirectRemarks.trim())
        {
            setStrDirectError('Remarks are required for this action.');
            return;
        }

        if (!objProposal.proposalId)
        {
            setStrDirectError('Proposal ID is missing.');
            return;
        }

        setBlnDirectSubmitting(true);
        setStrDirectError(null);

        try
        {
            const strSavedStatus = await applyProposalDecision({
                decision: strType,
                proposalId: objProposal.proposalId,
                remarks: txtDirectRemarks.trim() || undefined,
            });

            // Update in applications state
            setArrApplications((arrCurrent) =>
                arrCurrent.map((objApp) =>
                    objApp.referenceNo === objProposal.id ||
                        String(objApp.proposalId) === String(objProposal.proposalId)
                        ? {
                            ...objApp,
                            status: strSavedStatus as ApplicationRecord['status'],
                            remarks: txtDirectRemarks.trim() || objApp.remarks,
                        }
                        : objApp,
                ),
            );

            const blnIsReturn = strType === 'return_in_process';
            setObjDirectActionModal(null);
            setTxtDirectRemarks('');

            await Swal.fire({
                icon: blnIsReturn ? 'info' : 'warning',
                title: blnIsReturn ? 'Returned for Re-assessment' : 'Application Disapproved',
                text: blnIsReturn
                    ? `Application "${objProposal.id}" returned to In Process for technical clarification.`
                    : `Application "${objProposal.id}" has been formally disapproved.`,
                timer: 2200,
                showConfirmButton: false,
            });
        } /* end try */ catch (errError)
        {
            reportError(errError, 'ApprovalsPage: handle direct decision failed.');

            reportError(errError, 'Failed to execute direct action:');
            const txtServerMessage = (errError as { response?: { data?: { message?: string; }; }; })
                .response?.data?.message;
            setStrDirectError(txtServerMessage || 'Failed to update application status.');
        } finally
        {
            setBlnDirectSubmitting(false);
        }
    } /* end _handleDirectDecision */

    useEffect(() =>
    {
        if (objLocation.pathname.endsWith('/application-review'))
        {
            setStrLifecycleTab('review');
        } else if (objLocation.pathname.endsWith('/executive-approval'))
        {
            setStrLifecycleTab('for_approval');
        } else
        {
            setStrLifecycleTab('all');
        }
    }, [objLocation.pathname]);

    useEffect(() =>
    {
        let blnCancelled = false;
        setStrError(null);
        getAllProposals()
            .then((arrData) =>
            {
                if (!blnCancelled)
                {
                    setArrApplications(arrData);
                }
            })
            .catch((errError) =>
            {
                reportError(errError, 'Failed to load proposals:');
                if (!blnCancelled)
                {
                    setStrError('Could not load applications. Please try again.');
                }
            });
        return () =>
        {
            blnCancelled = true;
        };
    }, []);

    const arrApplicationProposals: ProposalRecord[] = arrApplications.map(
        (objApp) =>
        {
            let intStage: 0 | 1 | 2 | 3 | 4 = 1;
            if (objApp.status === 'Submitted' || objApp.status === 'Draft Submitted')
            {
                intStage = 0;
            } else if (objApp.status === 'Under review')
            {
                intStage = 1;
            } else if (objApp.status === 'Technical evaluation' || objApp.status === 'In Process')
            {
                intStage = 2;
            } else if (objApp.status === 'Executive Approval')
            {
                intStage = 3;
            } else if (objApp.status === 'Approved')
            {
                intStage = 4;
            }

            let strStatus: ProposalRecord['status'] = 'Under review';
            if (objApp.status === 'Approved')
            {
                strStatus = 'Approved';
            } else if (objApp.status === 'Returned for Revision')
            {
                strStatus = 'Returned for Revision';
            } else if (objApp.status === 'Disapproved')
            {
                strStatus = 'Disapproved';
            } else if (objApp.status === 'In Process')
            {
                strStatus = 'In Process';
            } else if (objApp.status === 'Executive Approval')
            {
                strStatus = 'Executive Approval';
            } else if (intStage === 0)
            {
                strStatus = 'Pending';
            }

            return {
                id: objApp.referenceNo,
                proposalId: objApp.proposalId, // numeric backend id, needed by ProposalDocumentsSection
                organization: objApp.organizationName,
                organizationType:
                    objApp.program === 'GIA'
                        ? objApp.proponentCategory || 'HEI / SUC / LGU Proponent'
                        : objApp.businessType || 'MSME Enterprise',
                proponentName: objApp.applicantName || '—',
                proponentRole:
                    objApp.program === 'GIA'
                        ? 'Project Leader / Researcher'
                        : 'Business Owner / Enterprise Lead',
                program: objApp.program as 'SETUP' | 'GIA',
                reviewer: 'Unassigned',
                stage: intStage,
                status: strStatus,
                remarks: objApp.remarks,
                submitted: new Date(objApp.createdAt).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                }),
                title: objApp.projectTitle,
                industrySector: objApp.industrySector,
                enterpriseSize: objApp.enterpriseSize,
                businessType: objApp.businessType,
                location: objApp.location,
                proponentCategory: objApp.proponentCategory,
                researchCategory: objApp.researchCategory,
                contactNumber: objApp.contactNumber,
            };
        } /* end arrApplicationProposals */,
    );

    const arrProgramScopedProposals = strLockedProgram
        ? arrApplicationProposals.filter((objProposal) => objProposal.program === strLockedProgram)
        : arrApplicationProposals;

    const intNewCount = arrProgramScopedProposals.filter(
        (objItem) =>
            objItem.status === 'Pending' || objItem.status === 'Under review' || objItem.stage <= 1,
    ).length;
    const intInProcessCount = arrProgramScopedProposals.filter(
        (objItem) =>
            objItem.status === 'In Process' ||
            objItem.status === 'Returned for Revision' ||
            objItem.stage === 2,
    ).length;
    const intEndorsedCount = arrProgramScopedProposals.filter(
        (objItem) => objItem.status === 'Executive Approval' || objItem.stage === 3,
    ).length;
    const intApprovedCount = arrProgramScopedProposals.filter(
        (objItem) => objItem.status === 'Approved',
    ).length;
    const intDisapprovedCount = arrProgramScopedProposals.filter(
        (objItem) => objItem.status === 'Disapproved' || objItem.status === 'Rejected',
    ).length;
    const intAllCount = arrProgramScopedProposals.length;

    const arrFilteredProposals = arrProgramScopedProposals.filter((objProposal) =>
    {
        if (strLifecycleTab === 'review')
        {
            return (
                objProposal.status === 'Pending' ||
                objProposal.status === 'Under review' ||
                objProposal.stage <= 1
            );
        }
        if (strLifecycleTab === 'in_process')
        {
            return (
                objProposal.status === 'In Process' ||
                objProposal.status === 'Returned for Revision' ||
                objProposal.stage === 2
            );
        }
        if (strLifecycleTab === 'for_approval')
        {
            return objProposal.status === 'Executive Approval' || objProposal.stage === 3;
        }
        if (strLifecycleTab === 'approved')
        {
            return objProposal.status === 'Approved';
        }
        if (strLifecycleTab === 'disapproved')
        {
            return objProposal.status === 'Disapproved' || objProposal.status === 'Rejected';
        }
        return true;
    });

    /** Open review. */
    function _openReview(objProposal: ProposalRecord, strSection: ReviewSection)
    {
        setObjReview({ proposal: objProposal, section: strSection });
    }

    const arrColumns: DataColumn<ProposalRecord>[] = [
        {
            id: 'id',
            header: 'Reference',
            className: 'w-[13%] min-w-[140px]',
            sortValue: (objProposal) => objProposal.id,
            render: (objProposal) => (
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100/90 border border-slate-200/80 font-mono text-xs font-bold text-slate-700 whitespace-nowrap shadow-2xs">
                    {objProposal.id}
                </span>
            ),
        },
        {
            id: 'title',
            header: 'Project Title',
            className: 'w-[24%] min-w-[220px]',
            sortValue: (objProposal) => objProposal.title,
            render: (objProposal) => (
                <p className="font-bold leading-snug text-slate-900 text-sm line-clamp-2 hover:text-[#0f53b7] transition-colors">
                    {objProposal.title}
                </p>
            ),
        },
        {
            id: 'proponent',
            header: 'Proponent',
            className: 'w-[13%] min-w-[130px]',
            sortValue: (objProposal) => objProposal.proponentName ?? '',
            render: (objProposal) => (
                <p className="font-bold text-sm text-slate-900 leading-snug">
                    {objProposal.proponentName ?? 'Proponent'}
                </p>
            ),
        },
        {
            id: 'organization',
            header: 'Organization',
            className: 'w-[16%] min-w-[160px]',
            sortValue: (objProposal) => objProposal.organization,
            render: (objProposal) => (
                <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-slate-800 leading-snug">
                        {objProposal.organization || '—'}
                    </p>
                    {objProposal.organizationType ? (
                        <p className="text-[11px] text-slate-500 font-medium capitalize">
                            {objProposal.organizationType.toLowerCase().replaceAll('_', ' ')}
                        </p>
                    ) : null}
                </div>
            ),
        },
        {
            id: 'classification',
            header: 'Classification',
            className: 'w-[13%] min-w-[130px]',
            sortValue: (objProposal) =>
                objProposal.program === 'SETUP'
                    ? (objProposal.industrySector ?? '')
                    : (objProposal.researchCategory ?? ''),
            render: (objProposal) => (
                <div className="space-y-0.5">
                    {objProposal.program === 'SETUP' ? (
                        <>
                            {objProposal.industrySector ? (
                                <p className="text-xs font-semibold text-slate-800 leading-snug">
                                    {objProposal.industrySector}
                                </p>
                            ) : (
                                <span className="text-xs text-slate-400 font-medium">—</span>
                            )}
                            {objProposal.enterpriseSize ? (
                                <p className="text-[11px] font-medium text-slate-500 capitalize">
                                    {objProposal.enterpriseSize.toLowerCase()} Enterprise
                                </p>
                            ) : null}
                        </>
                    ) : objProposal.researchCategory ? (
                        <p className="text-xs font-semibold text-slate-800 leading-snug">
                            {objProposal.researchCategory}
                        </p>
                    ) : (
                        <span className="text-xs text-slate-400 font-medium">—</span>
                    )}
                </div>
            ),
        },
        {
            id: 'submitted',
            header: 'Submission Date',
            className: 'w-[10%] min-w-[110px]',
            sortValue: (objProposal) => objProposal.submitted,
            render: (objProposal) => (
                <span className="text-xs font-medium text-slate-600 whitespace-nowrap block">
                    {objProposal.submitted}
                </span>
            ),
        },
        {
            id: 'status',
            header: 'Status',
            className: 'w-[11%] min-w-[110px]',
            sortValue: (objProposal) => objProposal.status,
            render: (objProposal) =>
            {
                if (objProposal.status === 'Approved')
                {
                    return (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 whitespace-nowrap">
                            <Check className="size-3" />
                            Approved
                        </span>
                    );
                }

                let strToneClass = 'text-[#0f53b7]';
                if (objProposal.status === 'Rejected' || objProposal.status === 'Disapproved')
                {
                    strToneClass = 'text-rose-600';
                } else if (
                    objProposal.status === 'Pending' ||
                    objProposal.status === 'Returned for Revision'
                )
                {
                    strToneClass = 'text-amber-600';
                } else if (objProposal.status === 'Executive Approval')
                {
                    strToneClass = 'text-purple-600';
                }

                return (
                    <span className={cn('text-xs font-bold leading-snug', strToneClass)}>
                        {objProposal.status}
                    </span>
                );
            } /* end arrColumns */,
        },
        {
            id: 'action',
            header: 'Action',
            className: 'w-[10%] min-w-[100px] text-right',
            render: (objProposal) =>
            {
                if (objProposal.status === 'Approved')
                {
                    return (
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                            {objProposal.proposalId ? (
                                <button
                                    className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-xs hover:bg-slate-100 hover:text-[#0f53b7] transition shrink-0"
                                    onClick={(objEvent) =>
                                    {
                                        objEvent.stopPropagation();
                                        _navigate(
                                            `/dashboard/document-checklist?proposalId=${objProposal.proposalId}&program=${objProposal.program}`,
                                        );
                                    }}
                                    title="Open Document Checklist"
                                    type="button"
                                    aria-label="Open Document Checklist"
                                >
                                    <FileCheck2 className="size-4" />
                                </button>
                            ) : null}
                            {blnCanOpenProjectMonitoring ? (
                                <button
                                    className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-emerald-700 px-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-800"
                                    onClick={(objEvent) =>
                                    {
                                        objEvent.stopPropagation();
                                        _navigate(
                                            `/dashboard/project-monitoring?program=${objProposal.program}&view=projects`,
                                        );
                                    }}
                                    type="button"
                                    title="Open in Project Monitoring"
                                >
                                    <span>Monitor</span>
                                    <ArrowRight className="size-3.5" />
                                </button>
                            ) : null}
                            <button
                                className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-xs hover:bg-slate-100 hover:text-slate-900 transition shrink-0"
                                onClick={(objEvent) =>
                                {
                                    objEvent.stopPropagation();
                                    _openReview(objProposal, 'overview');
                                }}
                                title="View Intake Details (Read-Only)"
                                type="button"
                                aria-label="View Intake Details"
                            >
                                <Eye className="size-4" />
                            </button>
                        </div>
                    ); // end return
                } /* end if */

                const blnCanDecide =
                    objCurrentUser?.role === 'provincial_director' &&
                    (objProposal.status === 'Executive Approval' || objProposal.stage === 3);

                const blnCanReview =
                    objCurrentUser?.role === 'focal' &&
                    (objProposal.status === 'Pending' ||
                        objProposal.status === 'Under review' ||
                        objProposal.status === 'In Process');

                const strActionLabel = blnCanReview ? 'Review' : 'View';

                if (blnCanDecide)
                {
                    return (
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                            {objProposal.proposalId ? (
                                <button
                                    className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-xs hover:bg-slate-100 hover:text-[#0f53b7] transition"
                                    onClick={(objEvent) =>
                                    {
                                        objEvent.stopPropagation();
                                        _navigate(
                                            `/dashboard/document-checklist?proposalId=${objProposal.proposalId}&program=${objProposal.program}`,
                                        );
                                    }}
                                    title="Open Document Checklist"
                                    type="button"
                                >
                                    <FileCheck2 className="size-4" />
                                </button>
                            ) : null}
                            <button
                                className="inline-flex size-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 transition"
                                onClick={(objEvent) =>
                                {
                                    objEvent.stopPropagation();
                                    void _handleApproveConfirmation(objProposal);
                                }}
                                title="Approve Application"
                                type="button"
                            >
                                <Check className="size-4" />
                            </button>
                            <button
                                className="inline-flex size-8 items-center justify-center rounded-lg bg-rose-600 text-white shadow-xs hover:bg-rose-700 transition"
                                onClick={(objEvent) =>
                                {
                                    objEvent.stopPropagation();
                                    setTxtDirectRemarks('');
                                    setStrDirectError(null);
                                    setObjDirectActionModal({
                                        proposal: objProposal,
                                        type: 'disapprove',
                                    });
                                }}
                                title="Disapprove / Return for Technical Issue"
                                type="button"
                            >
                                <X className="size-4" />
                            </button>
                            <button
                                className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-xs hover:bg-slate-100 hover:text-slate-900 transition"
                                onClick={(objEvent) =>
                                {
                                    objEvent.stopPropagation();
                                    _openReview(objProposal, 'overview');
                                }}
                                title="View Full Proposal"
                                type="button"
                            >
                                <Eye className="size-4" />
                            </button>
                        </div>
                    ); // end return
                } /* end if */

                return (
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                        {objProposal.proposalId ? (
                            <button
                                className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-xs hover:bg-slate-100 hover:text-[#0f53b7] transition"
                                onClick={(objEvent) =>
                                {
                                    objEvent.stopPropagation();
                                    _navigate(
                                        `/dashboard/document-checklist?proposalId=${objProposal.proposalId}&program=${objProposal.program}`,
                                    );
                                }}
                                title="Open Document Checklist"
                                type="button"
                            >
                                <FileCheck2 className="size-4" />
                            </button>
                        ) : null}
                        <button
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0f53b7] px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0b3f8b] transition hover:shadow-md"
                            onClick={(objEvent) =>
                            {
                                objEvent.stopPropagation();
                                _openReview(objProposal, 'overview');
                            }}
                            type="button"
                        >
                            <Eye className="size-3.5" />
                            {strActionLabel}
                        </button>
                    </div>
                ); // end return
            } /* end arrColumns */,
        },
    ];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 font-sans">
                <div className="flex items-center gap-3">
                    <span className="h-9 sm:h-10 w-1.5 rounded-full bg-[#0f53b7]" />
                    <div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold leading-none text-slate-400">
                            <span>Applications</span>
                            <span>&gt;</span>
                            <span className="font-bold text-[#285497]">
                                {strLockedProgram ? `${strLockedProgram} Program` : 'All Programs'}
                            </span>
                        </div>
                        <h1 className="mt-1 text-2xl sm:text-3xl font-black leading-tight tracking-tight text-slate-900">
                            Applications
                        </h1>
                    </div>
                </div>
            </div>

            {/* Modern Segmented Lifecycle Tabs */}
            <div>
                <AnimatedTabs
                    strLayoutId="approvals-lifecycle-tabs"
                    strActiveTab={strLifecycleTab}
                    onChange={(strId) => setStrLifecycleTab(strId as any)}
                    arrTabs={[
                        { id: 'all', label: 'All', count: intAllCount },
                        { id: 'review', label: 'Under Review', count: intNewCount },
                        { id: 'in_process', label: 'In Process', count: intInProcessCount },
                        {
                            id: 'for_approval',
                            label: 'Executive Approval',
                            count: intEndorsedCount,
                        },
                        { id: 'approved', label: 'Approved', count: intApprovedCount },
                        { id: 'disapproved', label: 'Disapproved', count: intDisapprovedCount },
                    ]}
                />
            </div>

            <section className="overflow-hidden rounded-2xl border border-[#d8e1ee] bg-white shadow-[0_14px_36px_-32px_rgba(15,23,42,0.75)]">
                {strError ? (
                    <p
                        className="border-b border-red-100 bg-red-50 px-5 py-3 text-xs font-semibold text-red-700"
                        role="alert"
                    >
                        {strError}
                    </p>
                ) : null}
                <DataTable
                    arrColumns={arrColumns}
                    arrData={arrFilteredProposals}
                    txtEmptyDescription="No applications match the selected filter."
                    strEmptyTitle="No applications found"
                    getRowKey={(objProposal) => objProposal.id}
                    onRowClick={(objProposal) => _openReview(objProposal, 'overview')}
                    strSearchPlaceholder="Search applications..."
                    searchText={(objProposal) =>
                        `${objProposal.id} ${objProposal.title} ${objProposal.organization} ${objProposal.proponentName ?? ''} ${objProposal.organizationType ?? ''} ${objProposal.program}`
                    }
                />
            </section>

            {/* Direct Row Decision Confirmation Modal (Disapprove / Return for Technical Issue) */}
            {objDirectActionModal ? (
                <div
                    aria-labelledby="direct-decision-title"
                    aria-modal="true"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
                    role="dialog"
                >
                    <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-slate-200">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h4
                                    className="text-sm font-bold text-slate-900"
                                    id="direct-decision-title"
                                >
                                    {objDirectActionModal.type === 'return_in_process'
                                        ? 'Return for Technical Issue'
                                        : 'Confirm Application Disapproval'}
                                </h4>
                                <p className="mt-0.5 text-xs text-slate-500 truncate max-w-xs font-mono">
                                    {objDirectActionModal.proposal.title} (
                                    {objDirectActionModal.proposal.id})
                                </p>
                            </div>
                            <button
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                onClick={() => setObjDirectActionModal(null)}
                                type="button"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-100 p-1 border border-slate-200">
                            <button
                                className={cn(
                                    'flex-1 rounded-lg py-1.5 text-xs font-bold transition',
                                    objDirectActionModal.type === 'return_in_process'
                                        ? 'bg-amber-600 text-white shadow-2xs'
                                        : 'text-slate-600 hover:text-slate-900',
                                )}
                                onClick={() =>
                                    setObjDirectActionModal({
                                        ...objDirectActionModal,
                                        type: 'return_in_process',
                                    })
                                }
                                type="button"
                            >
                                Return for Technical Issue
                            </button>
                            <button
                                className={cn(
                                    'flex-1 rounded-lg py-1.5 text-xs font-bold transition',
                                    objDirectActionModal.type === 'disapprove'
                                        ? 'bg-rose-600 text-white shadow-2xs'
                                        : 'text-slate-600 hover:text-slate-900',
                                )}
                                onClick={() =>
                                    setObjDirectActionModal({
                                        ...objDirectActionModal,
                                        type: 'disapprove',
                                    })
                                }
                                type="button"
                            >
                                Disapprove
                            </button>
                        </div>

                        <div className="mt-4">
                            <label
                                className="block text-xs font-bold text-slate-700"
                                htmlFor="direct-remarks"
                            >
                                Remarks / Reason
                                <span className="text-rose-500"> *</span>
                            </label>
                            <textarea
                                className="mt-1.5 min-h-24 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs leading-5 text-slate-900 outline-none transition focus:border-[#0f53b7] focus:bg-white focus:ring-2 focus:ring-blue-100"
                                id="direct-remarks"
                                onChange={(objEvent) => setTxtDirectRemarks(objEvent.target.value)}
                                placeholder={
                                    objDirectActionModal.type === 'return_in_process'
                                        ? 'Specify technical or financial clarifications needed from focal person...'
                                        : 'State formal reason for disapproving this application...'
                                }
                                rows={3}
                                value={txtDirectRemarks}
                            />
                        </div>

                        {strDirectError ? (
                            <p className="mt-2 text-xs font-semibold text-rose-600">
                                {strDirectError}
                            </p>
                        ) : null}

                        <div className="mt-5 flex items-center justify-end gap-2">
                            <button
                                className="rounded-xl px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                                onClick={() => setObjDirectActionModal(null)}
                                type="button"
                            >
                                Cancel
                            </button>
                            <button
                                className={cn(
                                    'inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs transition disabled:opacity-50',
                                    objDirectActionModal.type === 'return_in_process'
                                        ? 'bg-amber-600 hover:bg-amber-700'
                                        : 'bg-rose-600 hover:bg-rose-700',
                                )}
                                disabled={blnDirectSubmitting || !txtDirectRemarks.trim()}
                                onClick={_handleDirectDecision}
                                type="button"
                            >
                                {blnDirectSubmitting ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                    <X className="size-3.5" />
                                )}
                                {objDirectActionModal.type === 'return_in_process'
                                    ? 'Return for Technical Issue'
                                    : 'Confirm Disapproval'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {objReview ? (
                <ProposalReviewModal
                    strInitialSection={objReview.section}
                    key={`${objReview.proposal.id}-${objReview.section}`}
                    onClose={() => setObjReview(null)}
                    onStatusChange={(strStatus, txtRemarks) =>
                    {
                        setArrApplications((arrCurrent) =>
                            arrCurrent.map((objApplication) =>
                                objApplication.referenceNo === objReview.proposal.id
                                    ? {
                                        ...objApplication,
                                        remarks: txtRemarks ?? objApplication.remarks,
                                        status: strStatus,
                                    }
                                    : objApplication,
                            ),
                        );
                        void getAllProposals()
                            .then(setArrApplications)
                            .catch((objRefreshError) =>
                            {
                                reportError(objRefreshError, 'Failed to refresh proposal status:');
                            });
                    }}
                    objProposal={objReview.proposal}
                />
            ) : null}
        </div>
    ); // end return
} /* end ApprovalsPage */
