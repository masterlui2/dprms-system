/**
 * System: DPRMS
 * Purpose: Render documentary requirements page for the application pages.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import
{
    AlertTriangle,
    ArrowRight,
    Building2,
    Check,
    Download,
    Eye,
    FileCheck2,
    FileText,
    FileUp,
    Landmark,
    LoaderCircle,
    RefreshCw,
    Search,
    Trash2,
    UserRoundCheck,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { reportError } from '../../utils/error_reporting';

import Swal from 'sweetalert2';
import { InitialReviewStageCard } from '../../components/proponent/InitialReviewStageCard';
import { ProposalProgress } from '../../components/proponent/ProposalProgress';
import type { GiaProposalFormHandle } from '../../components/proposal/GiaProposalForm';
import { GiaProposalForm } from '../../components/proposal/GiaProposalForm';
import type { SetupProposalFormHandle } from '../../components/proposal/SetupProposalForm';
import { SetupProposalForm } from '../../components/proposal/SetupProposalForm';
import { getMockUser, setMockUser } from '../../lib/mock_auth';
import
{
    saveApplication,
    syncUserApplicationsFromBackend,
    updateApplicationStatus,
} from '../../services/application_store';
import
{
    deleteDocumentRecord,
    documentRecordToStoredDocument,
    fetchDocumentBlobUrl,
    fetchGiaDocumentaryRequirements,
    fetchProposalDocuments,
    fetchSetupDocumentaryRequirements,
    getDocuments,
    uploadDocument,
    type DocumentaryRequirement,
    type RequirementGroup,
    type StoredDocument,
    type VerificationStatus,
} from '../../services/document_store';
import { downloadFromUrl } from '../../services/download_manager';
import
{
    getGiaDraft,
    getGiaProposal,
    getGiaProposalId,
    submitGiaProposal,
} from '../../services/gia_proposal_store';
import { resubmitProposal } from '../../services/proposal_store';
import { getSetupProposalId, submitSetupProposal } from '../../services/setup_proposal_store';
import type { ApplicationRecord } from '../../types/application';
import type { GiaProposalData } from '../../types/gia_proposal';
import type { SetupProposalData } from '../../types/setup_proposal';
import { cn } from '../../utils/cn';

const BACKEND_MAX_FILE_SIZE = 10 * 1024 * 1024;
const BACKEND_ACCEPTED_EXTENSIONS = ['pdf'];
const GROUP_ORDER: RequirementGroup[] = [
    'Business Documents',
    'Corporation / Cooperative Documents',
    'Financial Documents',
    'GIA Core Documents',
    'Additional Documents',
];

const STATUS_CLASSES: Record<VerificationStatus, string> = {
    'Not Uploaded': 'text-slate-600',
    'Pending Upload': 'text-[#0f53b7]',
    Uploaded: 'text-[#0f53b7]',
    'Under Review': 'text-amber-700',
    Approved: 'text-emerald-700',
    'Needs Revision': 'text-red-700',
};

/** Format size. */
function _formatSize(intBytes: number)
{
    if (intBytes < 1024 * 1024)
    {
        return `${Math.ceil(intBytes / 1024)} KB`;
    }
    return `${(intBytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Extract upload error message. */
function _extractUploadErrorMessage(errError: unknown): string
{
    const objAxiosErr = errError as {
        response?: {
            status?: number;
            data?: { message?: string; errors?: Record<string, string[]>; };
        };
    };
    const objResponse = objAxiosErr?.response;
    if (objResponse?.status === 413)
    {
        return 'The uploaded files exceed the server upload size limit (413 Payload Too Large). Please ensure each PDF file is under 10MB.';
    }
    if (objResponse?.status === 404)
    {
        return 'The submission endpoint was not found (404 Not Found). Please ensure the backend server is running and your session is active.';
    }
    if (objResponse?.data?.errors)
    {
        const txtBackendMessage = Object.values(objResponse.data.errors).flat().join(' ');
        if (txtBackendMessage)
        {
            return txtBackendMessage;
        }
    }
    if (objResponse?.data?.message)
    {
        return objResponse.data.message;
    }
    return 'Could not submit application. Please check that all required fields and documents are uploaded.';
}

/** Render group icon and its available actions. */
function GroupIcon({ strGroup }: { strGroup: RequirementGroup; })
{
    if (strGroup === 'Business Documents')
    {
        return <Building2 className="size-5" />;
    }
    if (strGroup === 'Corporation / Cooperative Documents')
    {
        return <Landmark className="size-5" />;
    }
    if (strGroup === 'Financial Documents')
    {
        return <FileText className="size-5" />;
    }
    if (strGroup === 'GIA Core Documents')
    {
        return <FileCheck2 className="size-5" />;
    }
    return <UserRoundCheck className="size-5" />;
}

/** Render documentary requirements page and its available actions. */
export function DocumentaryRequirementsPage({ strProgram }: { strProgram?: 'SETUP' | 'GIA'; } = {})
{
    const objUser = getMockUser();
    const objLocation = useLocation();
    const [objSearchParams] = useSearchParams();

    const strActiveProgram: 'SETUP' | 'GIA' = useMemo(() =>
    {
        if (strProgram)
        {
            return strProgram;
        }
        if (objLocation.pathname.includes('/gia'))
        {
            return 'GIA';
        }
        if (objLocation.pathname.includes('/setup'))
        {
            return 'SETUP';
        }
        return (objUser?.program as 'SETUP' | 'GIA') || 'SETUP';
    }, [strProgram, objLocation.pathname, objUser?.program]);
    const [objDocuments, setObjDocuments] = useState<Record<string, StoredDocument>>({});
    const [strDraggingRequirement, setStrDraggingRequirement] = useState<string | null>(null);
    const [strUploadingRequirement, setStrUploadingRequirement] = useState<string | null>(null);
    const [txtMessage, setTxtMessage] = useState<string | null>(null);
    const [strQuery, setStrQuery] = useState('');
    const [intActiveProposalId, setIntActiveProposalId] = useState<number | null>(null);
    const [objPendingFiles, setObjPendingFiles] = useState<Record<string, File>>({});
    const objSetupFormRef = useRef<SetupProposalFormHandle>(null);
    const objGiaFormRef = useRef<GiaProposalFormHandle>(null);
    const [blnIsSubmittingApplication, setBlnIsSubmittingApplication] = useState(false);
    const [blnIsResubmittingRevision, setBlnIsResubmittingRevision] = useState(false);
    const [arrAllApplicationsList, setArrAllApplicationsList] = useState<ApplicationRecord[]>([]);
    const [blnShowApplicationForm, setBlnShowApplicationForm] = useState(false);

    /** Handle template download. */
    async function _handleTemplateDownload(objRequirement: DocumentaryRequirement)
    {
        if (!objUser || !objRequirement.templateUrl)
        {
            return;
        }
        const strUrlName = objRequirement.templateUrl.split('/').pop()?.split('?')[0];
        try
        {
            const objResult = await downloadFromUrl({
                fileName: strUrlName || `${objRequirement.title}.pdf`,
                program: strActiveProgram,
                url: objRequirement.templateUrl,
                user: objUser,
            });
            setTxtMessage(`Template saved to ${objResult.destination}.`);
        } catch (errError)
        {
            reportError(errError, 'DocumentaryRequirementsPage: handle template download failed.');

            if (!(errError instanceof DOMException && errError.name === 'AbortError'))
            {
                reportError(errError, 'Failed to download document template:');
                setTxtMessage('The template could not be downloaded. Please try again.');
            }
        }
    } /* end _handleTemplateDownload */

    useEffect(
        () =>
        {
            let blnCancelled = false;

            /** Refresh applications. */
            async function _refreshApplications()
            {
                try
                {
                    const objCurrentUser = getMockUser();
                    if (!objCurrentUser)
                    {
                        return;
                    }
                    const arrApps = await syncUserApplicationsFromBackend(objCurrentUser);
                    if (!blnCancelled)
                    {
                        setArrAllApplicationsList(arrApps);
                    }
                } catch (errOperation)
                {
                    reportError(
                        errOperation,
                        'DocumentaryRequirementsPage: refresh applications failed.',
                    );
                    throw errOperation;
                }
            }

            /** Handle visibility change. */
            function _handleVisibilityChange()
            {
                if (document.visibilityState === 'visible')
                {
                    void _refreshApplications();
                }
            }

            void _refreshApplications();
            window.addEventListener('focus', _refreshApplications);
            document.addEventListener('visibilitychange', _handleVisibilityChange);

            return () =>
            {
                blnCancelled = true;
                window.removeEventListener('focus', _refreshApplications);
                document.removeEventListener('visibilitychange', _handleVisibilityChange);
            };
        } /* end DocumentaryRequirementsPage */,
        [objUser?.id, objUser?.email, objUser?.applicationReference],
    );

    const arrApplications = useMemo(
        () =>
        {
            const arrOwnedApplications = arrAllApplicationsList.filter(
                (objApplication) =>
                    !objUser?.email ||
                    objApplication.contactEmail.toLowerCase() === objUser.email.toLowerCase(),
            );

            const arrProgramApplications = arrOwnedApplications.filter(
                (objApplication) => objApplication.program === strActiveProgram,
            );

            if (objUser?.applicationReference)
            {
                const objReferencedApplication = arrProgramApplications.find(
                    (objApplication) => objApplication.referenceNo === objUser.applicationReference,
                );
                if (objReferencedApplication)
                {
                    return [objReferencedApplication];
                }
            }

            // Do NOT fall back to all applications — a fresh user has no application
            // for this program and must not inherit another program's revision state.
            return arrProgramApplications;
        } /* end arrApplications */,
        [objUser?.applicationReference, objUser?.email, strActiveProgram, arrAllApplicationsList],
    );

    const strRequestedReference = objSearchParams.get('proposal');
    const objBaseApplication =
        arrApplications.find((objItem) => objItem.referenceNo === strRequestedReference) ??
        arrApplications[0];

    const objActiveApplication = useMemo(
        () => (objBaseApplication?.program === strActiveProgram ? objBaseApplication : null),
        [objBaseApplication, strActiveProgram],
    );
    const blnIsDraftMode = objActiveApplication?.status === 'Draft Submitted';
    const blnIsRevisionMode = objActiveApplication?.status === 'Returned for Revision';

    const [objLiveSetupProposal, setObjLiveSetupProposal] = useState<SetupProposalData | null>(
        null,
    );
    const [objLiveGiaProposal, setObjLiveGiaProposal] = useState<GiaProposalData | null>(null);

    useEffect(() =>
    {
        if (!objActiveApplication)
        {
            return;
        }
        if (objActiveApplication.program !== 'SETUP')
        {
            setObjLiveGiaProposal(
                getGiaDraft() ?? getGiaProposal(objActiveApplication.referenceNo),
            );
        }
        // SETUP's liveSetupProposal is populated by SetupProposalForm's onDraftChange.
    }, [objActiveApplication]);

    const [arrRequirements, setArrRequirements] = useState<DocumentaryRequirement[]>([]);
    // Tracks the params of the most recently *issued* requirements fetch
    // (SETUP or GIA), and a monotonically increasing id so we can ignore
    // stale/duplicate requests.
    const objRequirementsFetchRef = useRef<{ key: string; requestId: number; }>({
        key: '',
        requestId: 0,
    });

    useEffect(
        () =>
        {
            const blnIsFormOpen = blnShowApplicationForm && !objActiveApplication;
            if (!objActiveApplication && !blnIsFormOpen)
            {
                setArrRequirements([]);
                return;
            }
            const strProgram = objActiveApplication?.program ?? strActiveProgram;
            if (strProgram === 'SETUP')
            {
                const strKey = `SETUP|${objActiveApplication?.referenceNo ?? 'new'}|${objLiveSetupProposal?.organizationType ?? ''}|${objLiveSetupProposal?.businessSize ?? ''}`;
                if (objRequirementsFetchRef.current.key === strKey)
                {
                    return;
                }
                objRequirementsFetchRef.current.key = strKey;
                const intRequestId = ++objRequirementsFetchRef.current.requestId;

                fetchSetupDocumentaryRequirements(
                    objLiveSetupProposal?.organizationType,
                    objLiveSetupProposal?.businessSize,
                )
                    .then((arrRecords) =>
                    {
                        if (objRequirementsFetchRef.current.requestId === intRequestId)
                        {
                            setArrRequirements(arrRecords);
                        }
                    })
                    .catch(() =>
                    {
                        if (objRequirementsFetchRef.current.requestId === intRequestId)
                        {
                            setArrRequirements((arrCurrent) =>
                                arrCurrent.length ? arrCurrent : [],
                            );
                        }
                    });
                return;
            } /* end if */

            const strKey = `GIA|${objActiveApplication?.referenceNo ?? 'new'}|${objLiveGiaProposal?.proponentCategory ?? ''}`;
            if (objRequirementsFetchRef.current.key === strKey)
            {
                return;
            }
            objRequirementsFetchRef.current.key = strKey;
            const intRequestId = ++objRequirementsFetchRef.current.requestId;

            fetchGiaDocumentaryRequirements(objLiveGiaProposal?.proponentCategory)
                .then((arrRecords) =>
                {
                    if (objRequirementsFetchRef.current.requestId === intRequestId)
                    {
                        setArrRequirements(arrRecords);
                    }
                })
                .catch(() =>
                {
                    if (objRequirementsFetchRef.current.requestId === intRequestId)
                    {
                        setArrRequirements((arrCurrent) => (arrCurrent.length ? arrCurrent : []));
                    }
                });
        } /* end DocumentaryRequirementsPage */,
        [
            objActiveApplication,
            strActiveProgram,
            blnShowApplicationForm,
            objLiveGiaProposal?.proponentCategory,
            objLiveSetupProposal?.businessSize,
            objLiveSetupProposal?.organizationType,
        ],
    );

    useEffect(
        () =>
        {
            setTxtMessage(null);
            setStrQuery('');

            if (!objActiveApplication)
            {
                setObjDocuments({});
                setIntActiveProposalId(null);
                return;
            }

            let blnCancelled = false;
            setObjDocuments({});

            (
                async () =>
                {
                    try
                    {
                        // Only resolve proposal ID against backend if this is an actual submitted baseApplication
                        const blnIsDraft =
                            !objBaseApplication ||
                            objActiveApplication.referenceNo.endsWith('-DRAFT');
                        const intProposalId = blnIsDraft
                            ? null
                            : (objActiveApplication.proposalId ??
                                (objActiveApplication.program === 'SETUP'
                                    ? await getSetupProposalId(objActiveApplication.referenceNo)
                                    : await getGiaProposalId(objActiveApplication.referenceNo)));

                        if (blnCancelled)
                        {
                            return;
                        }

                        if (!intProposalId)
                        {
                            // This application only exists locally / hasn't synced with the
                            // backend (e.g. the synthetic fallback record built above when no
                            // matching submitted application is found, or a submission that
                            // fell back to local-only after a backend error). Fall back to
                            // whatever's cached in local storage instead of a real fetch.
                            setIntActiveProposalId(null);
                            setObjDocuments(getDocuments(objActiveApplication.referenceNo));
                            return;
                        }

                        setIntActiveProposalId(intProposalId);
                        try
                        {
                            const objRecords = await fetchProposalDocuments(intProposalId);
                            if (!blnCancelled)
                            {
                                setObjDocuments(objRecords);
                            }
                        } catch (errCaught)
                        {
                            reportError(
                                errCaught,
                                'DocumentaryRequirementsPage: documentary requirements page failed.',
                            );

                            if (!blnCancelled)
                            {
                                setTxtMessage(
                                    'Could not load your uploaded documents. Please refresh the page.',
                                );
                            }
                        }
                    } catch (errOperation)
                    {
                        /* end try */

                        reportError(
                            errOperation,
                            'DocumentaryRequirementsPage: documentary requirements page failed.',
                        );
                        throw errOperation;
                    }
                } /* end DocumentaryRequirementsPage */
            )();

            return () =>
            {
                blnCancelled = true;
            };
        } /* end DocumentaryRequirementsPage */,
        [objActiveApplication, objBaseApplication],
    );

    const arrRequiredRequirements = useMemo(
        () => arrRequirements.filter((objItem) => objItem.required),
        [arrRequirements],
    );
    const intCompletedRequiredCount = arrRequiredRequirements.filter(
        (objRequirement) => objDocuments[objRequirement.id] || objPendingFiles[objRequirement.id],
    ).length;

    const dblOverallProgressPercent = useMemo(
        () =>
        {
            if (!objActiveApplication)
            {
                return 0;
            }
            let intFormFilled = 0;
            let intFormTotal = 0;

            if (objActiveApplication.program === 'SETUP')
            {
                if (objLiveSetupProposal)
                {
                    const arrRequiredFields: (keyof SetupProposalData)[] = [
                        'projectTitle',
                        'generalObjective',
                        'specificObjectives',
                        'projectBackground',
                        'businessName',
                        'businessAddress',
                        'contactPerson',
                        'contactNumber',
                        'emailAddress',
                        'yearEstablished',
                        'organizationType',
                        'businessSize',
                        'numberOfEmployees',
                        'businessIndustry',
                        'productsServices',
                        'enterpriseBackground',
                    ];
                    intFormTotal = arrRequiredFields.length;
                    intFormFilled = arrRequiredFields.filter((strF) =>
                    {
                        const strValue = objLiveSetupProposal[strF];
                        return Array.isArray(strValue)
                            ? strValue.length > 0
                            : Boolean(String(strValue ?? '').trim());
                    }).length;
                }
            } else
            {
                if (objLiveGiaProposal)
                {
                    const arrRequiredFields: (keyof GiaProposalData)[] = [
                        'proponentCategory',
                        'organizationName',
                        'officeAddress',
                        'projectLeader',
                        'contactNumber',
                        'emailAddress',
                        'projectTitle',
                        'projectSummary',
                        'generalObjective',
                    ];
                    intFormTotal = arrRequiredFields.length;
                    intFormFilled = arrRequiredFields.filter((strF) =>
                        Boolean(String(objLiveGiaProposal[strF] ?? '').trim()),
                    ).length;
                }
            }

            const intDocsTotal = arrRequiredRequirements.length;
            const intDocsFilled = intCompletedRequiredCount;
            const intTotal = intFormTotal + intDocsTotal;

            if (intTotal === 0)
            {
                return 0;
            }
            return Math.min(100, Math.round(((intFormFilled + intDocsFilled) / intTotal) * 100));
        } /* end dblOverallProgressPercent */,
        [
            objActiveApplication,
            objLiveSetupProposal,
            objLiveGiaProposal,
            arrRequiredRequirements.length,
            intCompletedRequiredCount,
        ],
    );
    const blnRequiredComplete =
        arrRequiredRequirements.length > 0 &&
        intCompletedRequiredCount === arrRequiredRequirements.length;
    const strNormalizedQuery = strQuery.trim().toLowerCase();
    const arrRevisionDocuments = Object.entries(objDocuments).filter(
        ([, objDocument]) => objDocument.verificationStatus === 'Needs Revision',
    );
    const arrRevisionItems = arrRevisionDocuments.map(([strRequirementId, objDocument]) => ({
        document: objDocument,
        requirementId: strRequirementId,
        title:
            arrRequirements.find((objRequirement) => objRequirement.id === strRequirementId)
                ?.title ?? objDocument.fileName,
    }));
    const arrVisibleRequirements = arrRequirements.filter(
        (objRequirement) =>
            (!blnIsRevisionMode || Boolean(objDocuments[objRequirement.id])) &&
            (!strNormalizedQuery ||
                objRequirement.title.toLowerCase().includes(strNormalizedQuery) ||
                objRequirement.group.toLowerCase().includes(strNormalizedQuery) ||
                objRequirement.description.toLowerCase().includes(strNormalizedQuery)),
    );

    /** Handle file. */
    async function _handleFile(objRequirement: DocumentaryRequirement, objFile?: File)
    {
        if (!objFile)
        {
            return;
        }
        if (
            blnIsRevisionMode &&
            objDocuments[objRequirement.id]?.verificationStatus !== 'Needs Revision'
        )
        {
            setTxtMessage('Only documents marked Needs Revision can be replaced.');
            return;
        }
        const strExtension = objFile.name.split('.').pop()?.toLowerCase() ?? '';

        if (!BACKEND_ACCEPTED_EXTENSIONS.includes(strExtension))
        {
            setTxtMessage('Please upload a PDF file.');
            return;
        }
        if (objFile.size > BACKEND_MAX_FILE_SIZE)
        {
            setTxtMessage(
                `The selected file is larger than ${_formatSize(BACKEND_MAX_FILE_SIZE)}. Please upload a smaller file.`,
            );
            return;
        }

        setStrUploadingRequirement(objRequirement.id);
        try
        {
            let objNextDocuments: Record<string, StoredDocument>;

            if (!intActiveProposalId)
            {
                // Hold the file locally with visual loading transition,
                // to be uploaded when "Submit Application" is clicked.
                await new Promise((resolve) => setTimeout(resolve, 450));
                setObjPendingFiles((objCurrent) => ({
                    ...objCurrent,
                    [objRequirement.id]: objFile,
                }));
                setTxtMessage(
                    `${objFile.name} attached. It will be submitted with your application.`,
                );
                return;
            }
            // The backend replaces the existing proposal/document-type record
            // without deleting the reviewed file before the new upload succeeds.
            const objStored = await uploadDocument(intActiveProposalId, objRequirement.id, objFile);
            objNextDocuments = { ...objDocuments, [objRequirement.id]: objStored };
            setObjPendingFiles((objCurrent) =>
            {
                if (!(objRequirement.id in objCurrent))
                {
                    return objCurrent;
                }
                const objNext = { ...objCurrent };
                delete objNext[objRequirement.id];
                return objNext;
            });

            setObjDocuments(objNextDocuments);
            const blnAllRequiredUploaded =
                arrRequiredRequirements.length > 0 &&
                arrRequiredRequirements.every((objItem) => objNextDocuments[objItem.id]);

            if (blnIsRevisionMode)
            {
                setTxtMessage(
                    `${objFile.name} uploaded as the revised file. Resubmit when every flagged document has been replaced.`,
                );
            } else if (blnAllRequiredUploaded)
            {
                if (objActiveApplication)
                {
                    updateApplicationStatus(objActiveApplication.referenceNo, 'Under review');
                }
                setTxtMessage(
                    'All required documents are complete. Your application is ready for DOST initial review.',
                );
            } else
            {
                setTxtMessage(`${objFile.name} uploaded successfully.`);
            }
        } /* end try */ catch (errError)
        {
            reportError(errError, 'DocumentaryRequirementsPage: handle file failed.');

            setTxtMessage(_extractUploadErrorMessage(errError));
        } finally
        {
            setStrUploadingRequirement(null);
            setStrDraggingRequirement(null);
        }
    } /* end _handleFile */

    /** Remove. */
    async function _remove(objRequirement: DocumentaryRequirement)
    {
        if (!objActiveApplication)
        {
            return;
        }
        if (blnIsRevisionMode)
        {
            setTxtMessage('Returned applications only allow replacement of flagged documents.');
            return;
        }
        if (!window.confirm(`Delete the uploaded file for “${objRequirement.title}”?`))
        {
            return;
        }

        const objExisting = objDocuments[objRequirement.id];
        if (!objExisting?.backendId)
        {
            setObjPendingFiles((objCurrent) =>
            {
                if (!(objRequirement.id in objCurrent))
                {
                    return objCurrent;
                }
                const objNext = { ...objCurrent };
                delete objNext[objRequirement.id];
                return objNext;
            });
            if (objDocuments[objRequirement.id])
            {
                const objNext = { ...objDocuments };
                delete objNext[objRequirement.id];
                setObjDocuments(objNext);
            }
            setTxtMessage('File removed.');
            return;
        }
        try
        {
            await deleteDocumentRecord(objExisting.backendId);
            const objNext = { ...objDocuments };
            delete objNext[objRequirement.id];
            setObjDocuments(objNext);
            setTxtMessage('File deleted. You can upload a replacement at any time.');
        } catch (errCaught)
        {
            reportError(errCaught, 'DocumentaryRequirementsPage: remove failed.');

            setTxtMessage('Could not delete the file. Please try again.');
        }
    } /* end _remove */

    /** View pending file. */
    function _viewPendingFile(objFile: File)
    {
        const strBlobUrl = URL.createObjectURL(objFile);
        window.open(strBlobUrl, '_blank', 'noopener,noreferrer');
        // Best-effort cleanup — the new tab has already grabbed the resource
        // by the time this fires.
        window.setTimeout(() => URL.revokeObjectURL(strBlobUrl), 60_000);
    }

    /** View document. */
    async function _viewDocument(objStoredDocument: StoredDocument)
    {
        if (objStoredDocument.backendId)
        {
            try
            {
                const strBlobUrl = await fetchDocumentBlobUrl(objStoredDocument.backendId);
                window.open(strBlobUrl, '_blank', 'noopener,noreferrer');
            } catch (errCaught)
            {
                reportError(errCaught, 'DocumentaryRequirementsPage: view document failed.');

                setTxtMessage('Could not open the file. Please try again.');
            }
            return;
        }
        window.open(objStoredDocument.dataUrl, '_blank', 'noopener,noreferrer');
    }

    /** Show submitted dialog. */
    function _showSubmittedDialog(objApp: ApplicationRecord)
    {
        void Swal.fire({
            title: 'Application Submitted Successfully!',
            html: `
        <div style="font-family: sans-serif; text-align: center;" class="space-y-3">
          <p style="font-size: 13px; color: #475569; margin-top: 8px;">
            Your application (<strong style="font-family: monospace; color: #0f53b7;">${objApp.referenceNo}</strong>) has been officially submitted to DOST PSTO.
          </p>
          <div style="background-color: #eff6ff; border: 1px solid #dbeafe; border-radius: 16px; padding: 16px; text-align: left; margin-top: 14px;">
            <p style="font-size: 12px; font-weight: 700; color: #073b82; margin: 0 0 4px 0;">
              Stage 2 Active: DOST Initial Review
            </p>
            <p style="font-size: 11px; color: #475569; margin: 0; line-height: 1.5;">
              ${objApp.program === 'SETUP'
                    ? 'Your application is scheduled for a Technology Needs Assessment (TNA) site visit by DOST PSTO.'
                    : 'Your GIA proposal is currently under technical review by the DOST evaluation committee.'
                }
            </p>
          </div>
        </div>
      `,
            icon: 'success',
            showConfirmButton: false,
            timer: 1600,
            timerProgressBar: true,
        });
    } /* end _showSubmittedDialog */

    /** Scroll to missing requirement. */
    function _scrollToMissingRequirement(arrMissingRequiredDocs: DocumentaryRequirement[])
    {
        const objFirstMissing = arrMissingRequiredDocs[0];
        if (objFirstMissing)
        {
            const objTargetEl = document.getElementById(`requirement-${objFirstMissing.id}`);
            if (objTargetEl)
            {
                objTargetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    /** Handle submit application. */
    async function _handleSubmitApplication()
    {
        if (
            objActiveApplication &&
            objActiveApplication.status !== 'Draft Submitted' &&
            objActiveApplication.status !== 'Returned for Revision'
        )
        {
            setTxtMessage(
                'You already have an active application currently under review. Multiple submissions are not allowed.',
            );
            return;
        }
        const blnIsSetup = strActiveProgram === 'SETUP';

        const objProposalData = blnIsSetup
            ? objSetupFormRef.current?.validate()
            : objGiaFormRef.current?.validate();
        if (!objProposalData)
        {
            return;
        }

        const arrMissingRequiredDocs = arrRequiredRequirements.filter(
            (objRequest) => !objDocuments[objRequest.id] && !objPendingFiles[objRequest.id],
        );
        if (arrMissingRequiredDocs.length > 0)
        {
            const objFirstMissing = arrMissingRequiredDocs[0];
            setTxtMessage(
                `Upload ${arrMissingRequiredDocs.length} remaining required document${arrMissingRequiredDocs.length === 1 ? '' : 's'} before submitting.${objFirstMissing ? ` First required: ${objFirstMissing.title}.` : ''}`,
            );
            _scrollToMissingRequirement(arrMissingRequiredDocs);
            return;
        }

        setBlnIsSubmittingApplication(true);
        setTxtMessage(null);
        try
        {
            const objResult = blnIsSetup
                ? await submitSetupProposal(objProposalData as SetupProposalData, objPendingFiles)
                : await submitGiaProposal(objProposalData as GiaProposalData, objPendingFiles);
            const objApplication = objResult.application;
            const intProposalId = objApplication.proposalId ?? null;
            setIntActiveProposalId(intProposalId);

            if (!intProposalId)
            {
                setTxtMessage(
                    'Your proposal could not be created on the server. Please try submitting again.',
                );
                return;
            }

            const objNextDocuments: Record<string, StoredDocument> = {};
            if (objResult.documents && objResult.documents.length > 0)
            {
                for (const objRecord of objResult.documents)
                {
                    const objStored = documentRecordToStoredDocument(objRecord);
                    objNextDocuments[String(objRecord.document_type_id)] = objStored;
                }
            }
            setObjDocuments(objNextDocuments);
            setObjPendingFiles({});

            const objSubmittedApp: ApplicationRecord = {
                ...objApplication,
                status: 'Under review',
            };
            const objCurrentUser = getMockUser();
            if (objCurrentUser)
            {
                setMockUser({
                    ...objCurrentUser,
                    id: objCurrentUser.id || objApplication.proposalId,
                    applicationReference: objApplication.referenceNo,
                });
            }
            setArrAllApplicationsList((arrPrevious) => [
                objSubmittedApp,
                ...arrPrevious.filter(
                    (objLeft) => objLeft.referenceNo !== objSubmittedApp.referenceNo,
                ),
            ]);
            setBlnShowApplicationForm(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            _showSubmittedDialog(objSubmittedApp);
        } /* end try */ catch (errError)
        {
            reportError(errError, 'DocumentaryRequirementsPage: handle submit application failed.');

            setTxtMessage(_extractUploadErrorMessage(errError));
        } finally
        {
            setBlnIsSubmittingApplication(false);
        }
    } /* end _handleSubmitApplication */

    /** Handle resubmit revisions. */
    async function _handleResubmitRevisions()
    {
        if (!objActiveApplication || !intActiveProposalId || !blnIsRevisionMode)
        {
            return;
        }

        if (arrRevisionDocuments.length > 0)
        {
            const objFirstRequirement = arrRequirements.find(
                (objRequirement) => objRequirement.id === arrRevisionDocuments[0]?.[0],
            );
            if (objFirstRequirement)
            {
                _scrollToMissingRequirement([objFirstRequirement]);
            }
            setTxtMessage('Replace every document marked Needs Revision before resubmitting.');
            return;
        }

        setBlnIsResubmittingRevision(true);
        setTxtMessage(null);
        try
        {
            await resubmitProposal(intActiveProposalId);
            const objUpdatedApplication: ApplicationRecord = {
                ...objActiveApplication,
                remarks: null,
                status: 'In Process',
            };
            saveApplication(objUpdatedApplication);
            setArrAllApplicationsList((arrCurrent) =>
                arrCurrent.map((objApplication) =>
                    objApplication.referenceNo === objUpdatedApplication.referenceNo
                        ? objUpdatedApplication
                        : objApplication,
                ),
            );
            window.scrollTo({ top: 0, behavior: 'smooth' });
            await Swal.fire({
                confirmButtonColor: '#0f53b7',
                icon: 'success',
                text: 'Your revised documents are back in the DOST review queue.',
                title: 'Revisions Resubmitted',
            });
        } catch (errError)
        {
            reportError(errError, 'DocumentaryRequirementsPage: handle resubmit revisions failed.');

            setTxtMessage(_extractUploadErrorMessage(errError));
        } finally
        {
            setBlnIsResubmittingRevision(false);
        }
    } /* end _handleResubmitRevisions */

    /** Handle start application. */
    const _handleStartApplication = () =>
    {
        setBlnShowApplicationForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const blnNeedsApplication = !objActiveApplication && !blnShowApplicationForm;

    return (
        <div className="space-y-7 pb-4">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0f53b7]">
                        {strActiveProgram === 'GIA'
                            ? 'GIA Proposal Workspace'
                            : 'SETUP Application Workspace'}
                    </p>
                    <h1 className="mt-2 text-3xl font-black tracking-tight text-[#073b82] sm:text-4xl">
                        {strActiveProgram === 'GIA' ? 'My Proposal' : 'My Application'}
                    </h1>
                </div>
            </header>

            {blnNeedsApplication ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm sm:p-12">
                    <FileCheck2 className="mx-auto size-12 text-[#0f53b7]" />
                    <h2 className="mt-4 text-xl font-black text-slate-900">
                        No Active {strActiveProgram} Application
                    </h2>
                    <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-slate-500">
                        You do not have an active proposal application. Click below to start your
                        online proposal and document submission.
                    </p>
                    <div className="mt-6 flex items-center justify-center">
                        <button
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0f53b7] px-8 text-xs font-bold text-white shadow-sm transition hover:bg-[#0d479e]"
                            onClick={_handleStartApplication}
                            type="button"
                        >
                            {strActiveProgram === 'SETUP'
                                ? 'Submit SETUP Application'
                                : 'Submit GIA Proposal'}
                        </button>
                    </div>
                </div>
            ) : blnShowApplicationForm && !objActiveApplication ? (
                <>
                    <section className="space-y-6">
                        {strActiveProgram === 'GIA' ? (
                            <GiaProposalForm
                                ref={objGiaFormRef}
                                onDraftChange={setObjLiveGiaProposal}
                            />
                        ) : (
                            <SetupProposalForm
                                ref={objSetupFormRef}
                                onDraftChange={setObjLiveSetupProposal}
                            />
                        )}
                    </section>

                    {arrRequirements.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200 pt-6">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900">
                                        Attached Documentary Requirements
                                    </h3>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        Upload required supporting documents to accompany your
                                        proposal submission.
                                    </p>
                                </div>
                            </div>

                            {txtMessage ? (
                                <div
                                    className="flex items-start justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-[#073b82]"
                                    role="status"
                                >
                                    <span>{txtMessage}</span>
                                    <button
                                        aria-label="Dismiss message"
                                        className="shrink-0 text-lg leading-none"
                                        onClick={() => setTxtMessage(null)}
                                        type="button"
                                    >
                                        ×
                                    </button>
                                </div>
                            ) : null}

                            <div className="space-y-5">
                                {GROUP_ORDER.map(
                                    (strGroup) =>
                                    {
                                        const arrGroupRequirements = arrRequirements.filter(
                                            (objRecord) => objRecord.group === strGroup,
                                        );
                                        if (!arrGroupRequirements.length)
                                        {
                                            return null;
                                        }
                                        const intGroupUploaded = arrGroupRequirements.filter(
                                            (objRecord) => objPendingFiles[objRecord.id],
                                        ).length;
                                        return (
                                            <section
                                                className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/70"
                                                key={strGroup}
                                            >
                                                <div className="flex flex-col gap-3 bg-[#f8fbff] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                                                    <div className="flex items-center gap-3">
                                                        <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-[#0f53b7]">
                                                            <GroupIcon strGroup={strGroup} />
                                                        </span>
                                                        <div>
                                                            <h2 className="font-black text-slate-900">
                                                                {strGroup}
                                                            </h2>
                                                            <p className="mt-0.5 text-xs text-slate-500">
                                                                {intGroupUploaded} of{' '}
                                                                {arrGroupRequirements.length}{' '}
                                                                uploaded
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="divide-y divide-slate-100">
                                                    {arrGroupRequirements.map(
                                                        (objRequirement) =>
                                                        {
                                                            const objPendingFile =
                                                                objPendingFiles[objRequirement.id];
                                                            const blnIsUploading =
                                                                strUploadingRequirement ===
                                                                objRequirement.id;
                                                            const blnIsDragging =
                                                                strDraggingRequirement ===
                                                                objRequirement.id;
                                                            const blnHasFile =
                                                                Boolean(objPendingFile);
                                                            const blnIsMissingRequired =
                                                                !objPendingFile &&
                                                                objRequirement.required;
                                                            return (
                                                                <article
                                                                    className={cn(
                                                                        'grid gap-4 px-5 py-5 transition sm:px-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(310px,1fr)] lg:items-center lg:gap-5',
                                                                        blnIsDragging &&
                                                                        'bg-blue-50 ring-2 ring-inset ring-[#0f53b7]',
                                                                        blnIsMissingRequired &&
                                                                        'bg-red-50/40 border-l-4 border-l-red-500',
                                                                    )}
                                                                    id={`requirement-${objRequirement.id}`}
                                                                    key={objRequirement.id}
                                                                    onDragEnter={(objEvent) =>
                                                                    {
                                                                        objEvent.preventDefault();
                                                                        setStrDraggingRequirement(
                                                                            objRequirement.id,
                                                                        );
                                                                    }}
                                                                    onDragLeave={(objEvent) =>
                                                                    {
                                                                        if (
                                                                            !objEvent.currentTarget.contains(
                                                                                objEvent.relatedTarget as Node | null,
                                                                            )
                                                                        )
                                                                        {
                                                                            setStrDraggingRequirement(
                                                                                null,
                                                                            );
                                                                        }
                                                                    }}
                                                                    onDragOver={(objEvent) =>
                                                                        objEvent.preventDefault()
                                                                    }
                                                                    onDrop={(objEvent) =>
                                                                    {
                                                                        objEvent.preventDefault();
                                                                        void _handleFile(
                                                                            objRequirement,
                                                                            objEvent.dataTransfer
                                                                                .files[0],
                                                                        );
                                                                    }}
                                                                >
                                                                    <div className="flex min-w-0 items-start gap-3">
                                                                        <span
                                                                            className={cn(
                                                                                'mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border-2',
                                                                                blnHasFile
                                                                                    ? 'border-emerald-500 bg-emerald-500 text-white'
                                                                                    : blnIsMissingRequired
                                                                                        ? 'border-red-400 bg-red-50 text-red-500'
                                                                                        : 'border-slate-200 text-slate-300',
                                                                            )}
                                                                        >
                                                                            {blnHasFile ? (
                                                                                <Check
                                                                                    className="size-4"
                                                                                    strokeWidth={3}
                                                                                />
                                                                            ) : (
                                                                                <FileText className="size-3.5" />
                                                                            )}
                                                                        </span>
                                                                        <div className="min-w-0">
                                                                            <h3 className="font-bold leading-6 text-slate-900">
                                                                                {
                                                                                    objRequirement.title
                                                                                }
                                                                                {objRequirement.required ? (
                                                                                    <span
                                                                                        className="ml-1 font-extrabold text-red-600"
                                                                                        aria-label="required"
                                                                                    >
                                                                                        *
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="ml-2 text-xs font-semibold text-slate-400">
                                                                                        Optional
                                                                                    </span>
                                                                                )}
                                                                            </h3>
                                                                            {objRequirement.instructions ? (
                                                                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                                                                    {
                                                                                        objRequirement.instructions
                                                                                    }
                                                                                </p>
                                                                            ) : objRequirement.description ? (
                                                                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                                                                    {
                                                                                        objRequirement.description
                                                                                    }
                                                                                </p>
                                                                            ) : null}
                                                                            {objPendingFile ? (
                                                                                <p
                                                                                    className="mt-2 truncate text-xs font-semibold text-slate-600"
                                                                                    title={
                                                                                        objPendingFile.name
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        objPendingFile.name
                                                                                    }{' '}
                                                                                    ·{' '}
                                                                                    {_formatSize(
                                                                                        objPendingFile.size,
                                                                                    )}
                                                                                </p>
                                                                            ) : null}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        <label
                                                                            className={cn(
                                                                                'inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#0f53b7] px-3.5 text-xs font-bold text-white transition hover:bg-[#0b3f8b]',
                                                                                blnIsUploading &&
                                                                                'pointer-events-none opacity-70',
                                                                            )}
                                                                        >
                                                                            {blnIsUploading ? (
                                                                                <LoaderCircle className="size-3.5 animate-spin" />
                                                                            ) : blnHasFile ? (
                                                                                <RefreshCw className="size-3.5" />
                                                                            ) : (
                                                                                <FileUp className="size-3.5" />
                                                                            )}
                                                                            {blnIsUploading
                                                                                ? 'Processing'
                                                                                : blnHasFile
                                                                                    ? 'Replace File'
                                                                                    : 'Upload'}
                                                                            <input
                                                                                accept=".pdf"
                                                                                className="sr-only"
                                                                                disabled={
                                                                                    blnIsUploading
                                                                                }
                                                                                onChange={(
                                                                                    objEvent,
                                                                                ) =>
                                                                                {
                                                                                    void _handleFile(
                                                                                        objRequirement,
                                                                                        objEvent
                                                                                            .target
                                                                                            .files?.[0],
                                                                                    );
                                                                                    objEvent.target.value =
                                                                                        '';
                                                                                }}
                                                                                type="file"
                                                                            />
                                                                        </label>
                                                                        {objPendingFile ? (
                                                                            <>
                                                                                <button
                                                                                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                                                                                    onClick={() =>
                                                                                        _viewPendingFile(
                                                                                            objPendingFile,
                                                                                        )
                                                                                    }
                                                                                    type="button"
                                                                                >
                                                                                    <Eye className="size-3.5" />{' '}
                                                                                    View File
                                                                                </button>
                                                                                <button
                                                                                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-100 px-3 text-xs font-bold text-red-600 transition hover:bg-red-50"
                                                                                    onClick={() =>
                                                                                        setObjPendingFiles(
                                                                                            (
                                                                                                objItem,
                                                                                            ) =>
                                                                                            {
                                                                                                const objNumber =
                                                                                                {
                                                                                                    ...objItem,
                                                                                                };
                                                                                                delete objNumber[
                                                                                                    objRequirement
                                                                                                        .id
                                                                                                ];
                                                                                                return objNumber;
                                                                                            },
                                                                                        )
                                                                                    }
                                                                                    type="button"
                                                                                >
                                                                                    <Trash2 className="size-3.5" />{' '}
                                                                                    Delete File
                                                                                </button>
                                                                            </>
                                                                        ) : null}
                                                                    </div>
                                                                </article>
                                                            ); // end return
                                                        } /* end DocumentaryRequirementsPage */,
                                                    )}
                                                </div>
                                            </section>
                                        ); // end return
                                    } /* end DocumentaryRequirementsPage */,
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end pt-4 pb-8">
                        <button
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0f53b7] px-8 text-sm font-bold text-white shadow-md transition hover:bg-[#0d479e] hover:shadow-lg disabled:pointer-events-none disabled:opacity-70"
                            disabled={blnIsSubmittingApplication}
                            onClick={() => void _handleSubmitApplication()}
                            type="button"
                        >
                            {blnIsSubmittingApplication ? (
                                <LoaderCircle className="size-4 animate-spin" />
                            ) : null}
                            {blnIsSubmittingApplication
                                ? 'Submitting'
                                : strActiveProgram === 'GIA'
                                    ? 'Submit GIA Proposal'
                                    : 'Submit SETUP Application'}
                            {blnIsSubmittingApplication ? null : <ArrowRight className="size-4" />}
                        </button>
                    </div>
                </>
            ) : objActiveApplication ? (
                <>
                    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-7">
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
                            <div className="min-w-[280px] flex-1">
                                <div className="flex items-center justify-between gap-3 text-sm font-bold text-slate-800">
                                    <span className="text-base font-black text-[#073b82]">
                                        {objActiveApplication.program === 'SETUP' ? 'SETUP' : 'GIA'}{' '}
                                        Application —{' '}
                                        {blnIsDraftMode
                                            ? 'Stage 1: Proposal & Documents'
                                            : blnIsRevisionMode
                                                ? 'Revision Required'
                                                : objActiveApplication.status === 'Approved'
                                                    ? 'Stage 4: Approved'
                                                    : objActiveApplication.status ===
                                                        'Executive Approval'
                                                        ? 'Stage 3: For Executive Approval'
                                                        : objActiveApplication.status === 'In Process'
                                                            ? 'Stage 2: In Process (Assessment & TNA)'
                                                            : 'Stage 1: DOST Desk Review'}
                                    </span>
                                    {blnIsDraftMode ? (
                                        <span className="font-mono text-xs font-bold text-[#0f53b7]">
                                            {dblOverallProgressPercent}% Overall Progress
                                        </span>
                                    ) : blnIsRevisionMode ? (
                                        <span className="text-xs font-bold text-rose-700">
                                            Action Required
                                        </span>
                                    ) : objActiveApplication.status === 'Approved' ? (
                                        <span className="text-xs font-bold text-emerald-700">
                                            Approved
                                        </span>
                                    ) : (
                                        <span className="text-xs font-bold text-[#0f53b7]">
                                            {objActiveApplication.status}
                                        </span>
                                    )}
                                </div>
                                {blnIsDraftMode ? (
                                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/60">
                                        <div
                                            className="h-full rounded-full bg-[#0f53b7] transition-all duration-300"
                                            style={{ width: `${dblOverallProgressPercent}%` }}
                                        />
                                    </div>
                                ) : null}
                            </div>
                            {blnIsDraftMode ? (
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 shrink-0">
                                    <Check className="size-3.5 text-emerald-600" />
                                    <span>Draft saved</span>
                                </div>
                            ) : null}
                        </div>
                        <div className="pt-6">
                            <ProposalProgress
                                objApplication={objActiveApplication}
                                blnDocumentsComplete={blnRequiredComplete}
                                blnCompact
                            />
                        </div>
                    </section>

                    {/* Stage 2+ Review / DOST Initial Review Stage View */}
                    {!blnIsDraftMode && !blnIsRevisionMode ? (
                        <InitialReviewStageCard objApplication={objActiveApplication} />
                    ) : (
                        <>
                            {blnIsDraftMode ? (
                                <section className="space-y-6">
                                    {objActiveApplication!.program === 'GIA' ? (
                                        <GiaProposalForm
                                            ref={objGiaFormRef}
                                            onDraftChange={setObjLiveGiaProposal}
                                        />
                                    ) : (
                                        <SetupProposalForm
                                            ref={objSetupFormRef}
                                            onDraftChange={setObjLiveSetupProposal}
                                        />
                                    )}
                                </section>
                            ) : (
                                <section
                                    aria-labelledby="revision-required-title"
                                    className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-rose-200"
                                >
                                    <div className="border-l-4 border-rose-500 px-5 py-6 sm:px-7">
                                        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="flex min-w-0 items-start gap-4">
                                                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-600">
                                                    <AlertTriangle className="size-5" />
                                                </span>
                                                <div className="min-w-0">
                                                    <span className="text-[11px] font-black uppercase tracking-[0.14em] text-rose-600">
                                                        Action required
                                                    </span>
                                                    <h2
                                                        className="mt-1 text-xl font-black tracking-tight text-slate-900 sm:text-2xl"
                                                        id="revision-required-title"
                                                    >
                                                        Your proposal was returned for revision
                                                    </h2>
                                                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                                        Update only the documents listed below, then
                                                        resubmit your proposal to the DOST review
                                                        queue.
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="shrink-0 text-xs font-black text-rose-700">
                                                {arrRevisionItems.length
                                                    ? `${arrRevisionItems.length} file${arrRevisionItems.length === 1 ? '' : 's'} to revise`
                                                    : 'Ready to resubmit'}
                                            </span>
                                        </div>

                                        {objActiveApplication.remarks ? (
                                            <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3.5">
                                                <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                                                    Staff review summary
                                                </p>
                                                <p className="mt-1.5 text-sm leading-6 text-slate-700">
                                                    {objActiveApplication.remarks}
                                                </p>
                                            </div>
                                        ) : null}

                                        {arrRevisionItems.length ? (
                                            <div className="mt-5 divide-y divide-slate-100 rounded-2xl bg-rose-50/50 px-4 ring-1 ring-rose-100">
                                                {arrRevisionItems.map((objItem) => (
                                                    <div
                                                        className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                                                        key={objItem.requirementId}
                                                    >
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <FileText className="size-4 shrink-0 text-rose-500" />
                                                                <p className="truncate text-sm font-black text-slate-900">
                                                                    {objItem.title}
                                                                </p>
                                                            </div>
                                                            <p className="mt-1.5 pl-6 text-xs leading-5 text-slate-600">
                                                                {objItem.document.remarks ||
                                                                    'Replace this document with the corrected version requested by the evaluator.'}
                                                            </p>
                                                        </div>
                                                        <button
                                                            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold text-[#0f53b7] transition hover:bg-blue-50"
                                                            onClick={() =>
                                                            {
                                                                document
                                                                    .getElementById(
                                                                        `requirement-${objItem.requirementId}`,
                                                                    )
                                                                    ?.scrollIntoView({
                                                                        behavior: 'smooth',
                                                                        block: 'center',
                                                                    });
                                                            }}
                                                            type="button"
                                                        >
                                                            Replace file
                                                            <ArrowRight className="size-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="mt-5 flex items-start gap-3 rounded-2xl bg-emerald-50 px-4 py-3.5 text-emerald-800 ring-1 ring-emerald-100">
                                                <Check
                                                    className="mt-0.5 size-4 shrink-0"
                                                    strokeWidth={3}
                                                />
                                                <p className="text-sm font-semibold">
                                                    All requested files have been replaced. Use the
                                                    resubmit button below to send them back for
                                                    review.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}

                            {/* Attached Documents Section (Lower Page Divider) */}
                            {arrRequirements.length ? (
                                <div className="mt-8 space-y-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200 pt-6">
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900">
                                                {blnIsRevisionMode
                                                    ? 'Document Revision Checklist'
                                                    : 'Attached Documentary Requirements'}
                                            </h3>
                                            <p className="mt-0.5 text-xs text-slate-500">
                                                {blnIsRevisionMode
                                                    ? 'Only documents marked Needs Revision can be replaced. Other submitted files are locked.'
                                                    : blnIsDraftMode
                                                        ? 'Upload required supporting documents to accompany your proposal submission.'
                                                        : 'Submitted documentary requirements are currently under review by DOST evaluators.'}
                                            </p>
                                        </div>
                                        <label className="relative block w-full sm:w-72">
                                            <span className="sr-only">
                                                Search supporting document checklist
                                            </span>
                                            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                            <input
                                                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0f53b7] focus:bg-white focus:ring-4 focus:ring-blue-100"
                                                onChange={(objEvent) =>
                                                    setStrQuery(objEvent.target.value)
                                                }
                                                placeholder="Search required documents..."
                                                type="search"
                                                value={strQuery}
                                            />
                                        </label>
                                    </div>

                                    {txtMessage ? (
                                        <div
                                            className="flex items-start justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-[#073b82]"
                                            role="status"
                                        >
                                            <span>{txtMessage}</span>
                                            <button
                                                aria-label="Dismiss message"
                                                className="shrink-0 text-lg leading-none"
                                                onClick={() => setTxtMessage(null)}
                                                type="button"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : null}

                                    <div className="space-y-5">
                                        {GROUP_ORDER.map(
                                            (strGroup) =>
                                            {
                                                const arrGroupRequirements =
                                                    arrVisibleRequirements.filter(
                                                        (objRequirement) =>
                                                            objRequirement.group === strGroup,
                                                    );
                                                if (!arrGroupRequirements.length)
                                                {
                                                    return null;
                                                }
                                                const intGroupUploaded =
                                                    arrGroupRequirements.filter(
                                                        (objRequirement) =>
                                                            objDocuments[objRequirement.id],
                                                    ).length;

                                                const blnHasGiaAdditionalDocuments =
                                                    strGroup === 'Additional Documents' &&
                                                    strActiveProgram === 'GIA' &&
                                                    objLiveGiaProposal !== null &&
                                                    Boolean(objLiveGiaProposal.proponentCategory);

                                                return (
                                                    <section
                                                        className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/70"
                                                        key={strGroup}
                                                    >
                                                        <div className="flex flex-col gap-3 bg-[#f8fbff] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                                                            <div className="flex items-center gap-3">
                                                                <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-[#0f53b7]">
                                                                    <GroupIcon
                                                                        strGroup={strGroup}
                                                                    />
                                                                </span>
                                                                <div>
                                                                    <h2 className="font-black text-slate-900">
                                                                        {strGroup}
                                                                    </h2>
                                                                    <p className="mt-0.5 text-xs text-slate-500">
                                                                        {intGroupUploaded} of{' '}
                                                                        {
                                                                            arrGroupRequirements.length
                                                                        }{' '}
                                                                        uploaded
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {strGroup ===
                                                                'Corporation / Cooperative Documents' ? (
                                                                <span className="w-fit rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-bold text-indigo-700">
                                                                    Required for Corporations /
                                                                    Cooperatives
                                                                </span>
                                                            ) : null}
                                                            {blnHasGiaAdditionalDocuments ? (
                                                                <span className="w-fit rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700">
                                                                    Required for{' '}
                                                                    {
                                                                        objLiveGiaProposal.proponentCategory
                                                                    }
                                                                </span>
                                                            ) : null}
                                                        </div>

                                                        {strGroup === 'Financial Documents' ? (
                                                            <div className="border-t border-blue-100 bg-blue-50/70 px-5 py-3 text-xs leading-5 text-[#073b82] sm:px-6">
                                                                <span className="font-bold">
                                                                    Official Requirement Note:
                                                                </span>{' '}
                                                                Financial Statements for the past
                                                                three (3) years for Small and Medium
                                                                enterprises and at least one (1)
                                                                year for microenterprises together
                                                                with notarized Sworn Statement from
                                                                the proponent that all information
                                                                provided are correct and true.
                                                            </div>
                                                        ) : null}

                                                        <div className="divide-y divide-slate-100">
                                                            {arrGroupRequirements.map(
                                                                (objRequirement) =>
                                                                {
                                                                    const objStoredDocument =
                                                                        objDocuments[
                                                                        objRequirement.id
                                                                        ];
                                                                    const objPendingFile =
                                                                        objStoredDocument
                                                                            ? undefined
                                                                            : objPendingFiles[
                                                                            objRequirement.id
                                                                            ];
                                                                    const strStatus: VerificationStatus =
                                                                        objStoredDocument
                                                                            ? objStoredDocument.verificationStatus
                                                                            : objPendingFile
                                                                                ? 'Pending Upload'
                                                                                : 'Not Uploaded';
                                                                    const blnIsDragging =
                                                                        strDraggingRequirement ===
                                                                        objRequirement.id;
                                                                    const blnIsUploading =
                                                                        strUploadingRequirement ===
                                                                        objRequirement.id;
                                                                    const blnIsMissingRequired =
                                                                        !objStoredDocument &&
                                                                        !objPendingFile &&
                                                                        objRequirement.required;
                                                                    const blnHasFile = Boolean(
                                                                        objStoredDocument ||
                                                                        objPendingFile,
                                                                    );
                                                                    const blnNeedsRevision =
                                                                        strStatus ===
                                                                        'Needs Revision';
                                                                    const blnCanReplace =
                                                                        blnIsDraftMode ||
                                                                        blnNeedsRevision;

                                                                    const blnIsRequiredDocument =
                                                                        objRequirement.required ||
                                                                        objActiveApplication.program ===
                                                                        'SETUP';
                                                                    const blnHasReviewStatus =
                                                                        Boolean(
                                                                            strStatus !==
                                                                            'Not Uploaded' &&
                                                                            strStatus !==
                                                                            'Uploaded' &&
                                                                            strStatus !==
                                                                            'Pending Upload',
                                                                        );

                                                                    return (
                                                                        <article
                                                                            className={cn(
                                                                                'grid gap-4 px-5 py-5 transition sm:px-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(310px,1fr)] lg:items-center lg:gap-5',
                                                                                blnIsDragging &&
                                                                                'bg-blue-50 ring-2 ring-inset ring-[#0f53b7]',
                                                                                blnIsMissingRequired &&
                                                                                'bg-red-50/40 border-l-4 border-l-red-500',
                                                                                blnNeedsRevision &&
                                                                                'border-l-4 border-l-rose-500 bg-rose-50/60',
                                                                            )}
                                                                            id={`requirement-${objRequirement.id}`}
                                                                            key={objRequirement.id}
                                                                            onDragEnter={(
                                                                                objEvent,
                                                                            ) =>
                                                                            {
                                                                                if (
                                                                                    !blnCanReplace
                                                                                )
                                                                                {
                                                                                    return;
                                                                                }
                                                                                objEvent.preventDefault();
                                                                                setStrDraggingRequirement(
                                                                                    objRequirement.id,
                                                                                );
                                                                            }}
                                                                            onDragLeave={(
                                                                                objEvent,
                                                                            ) =>
                                                                            {
                                                                                if (
                                                                                    !objEvent.currentTarget.contains(
                                                                                        objEvent.relatedTarget as Node | null,
                                                                                    )
                                                                                )
                                                                                {
                                                                                    setStrDraggingRequirement(
                                                                                        null,
                                                                                    );
                                                                                }
                                                                            }}
                                                                            onDragOver={(
                                                                                objEvent,
                                                                            ) =>
                                                                            {
                                                                                if (blnCanReplace)
                                                                                {
                                                                                    objEvent.preventDefault();
                                                                                }
                                                                            }}
                                                                            onDrop={(objEvent) =>
                                                                            {
                                                                                if (
                                                                                    !blnCanReplace
                                                                                )
                                                                                {
                                                                                    return;
                                                                                }
                                                                                objEvent.preventDefault();
                                                                                void _handleFile(
                                                                                    objRequirement,
                                                                                    objEvent
                                                                                        .dataTransfer
                                                                                        .files[0],
                                                                                );
                                                                            }}
                                                                        >
                                                                            <div className="flex min-w-0 items-start gap-3">
                                                                                <span
                                                                                    className={cn(
                                                                                        'mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border-2',
                                                                                        blnNeedsRevision
                                                                                            ? 'border-rose-500 bg-rose-500 text-white'
                                                                                            : blnHasFile
                                                                                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                                                                                : blnIsMissingRequired
                                                                                                    ? 'border-red-400 bg-red-50 text-red-500'
                                                                                                    : 'border-slate-200 text-slate-300',
                                                                                    )}
                                                                                >
                                                                                    {blnNeedsRevision ? (
                                                                                        <AlertTriangle className="size-4" />
                                                                                    ) : blnHasFile ? (
                                                                                        <Check
                                                                                            className="size-4"
                                                                                            strokeWidth={
                                                                                                3
                                                                                            }
                                                                                        />
                                                                                    ) : (
                                                                                        <FileText className="size-3.5" />
                                                                                    )}
                                                                                </span>
                                                                                <div className="min-w-0">
                                                                                    <h3 className="font-bold leading-6 text-slate-900">
                                                                                        {
                                                                                            objRequirement.title
                                                                                        }
                                                                                        {blnIsRequiredDocument ? (
                                                                                            <span
                                                                                                className="ml-1 font-extrabold text-red-600"
                                                                                                aria-label="required"
                                                                                            >
                                                                                                *
                                                                                            </span>
                                                                                        ) : (
                                                                                            <span className="ml-2 text-xs font-semibold text-slate-400">
                                                                                                Optional
                                                                                            </span>
                                                                                        )}
                                                                                    </h3>
                                                                                    {objRequirement.instructions ? (
                                                                                        <p className="mt-1 text-xs leading-5 text-slate-500">
                                                                                            {
                                                                                                objRequirement.instructions
                                                                                            }
                                                                                        </p>
                                                                                    ) : objRequirement.description ? (
                                                                                        <p className="mt-1 text-xs leading-5 text-slate-500">
                                                                                            {
                                                                                                objRequirement.description
                                                                                            }
                                                                                        </p>
                                                                                    ) : null}
                                                                                    {objStoredDocument ? (
                                                                                        <p
                                                                                            className="mt-2 truncate text-xs font-semibold text-slate-600"
                                                                                            title={
                                                                                                objStoredDocument.fileName
                                                                                            }
                                                                                        >
                                                                                            {
                                                                                                objStoredDocument.fileName
                                                                                            }{' '}
                                                                                            ·{' '}
                                                                                            {_formatSize(
                                                                                                objStoredDocument.fileSize,
                                                                                            )}
                                                                                        </p>
                                                                                    ) : objPendingFile ? (
                                                                                        <p
                                                                                            className="mt-2 truncate text-xs font-semibold text-slate-600"
                                                                                            title={
                                                                                                objPendingFile.name
                                                                                            }
                                                                                        >
                                                                                            {
                                                                                                objPendingFile.name
                                                                                            }{' '}
                                                                                            ·{' '}
                                                                                            {_formatSize(
                                                                                                objPendingFile.size,
                                                                                            )}
                                                                                        </p>
                                                                                    ) : null}
                                                                                </div>
                                                                            </div>

                                                                            <div className="space-y-3">
                                                                                {blnHasReviewStatus ? (
                                                                                    <span
                                                                                        className={cn(
                                                                                            'inline-flex text-[11px] font-semibold',
                                                                                            STATUS_CLASSES[
                                                                                            strStatus
                                                                                            ],
                                                                                        )}
                                                                                    >
                                                                                        {strStatus}
                                                                                    </span>
                                                                                ) : null}
                                                                                <div className="flex flex-wrap gap-2">
                                                                                    {objRequirement.templateUrl ? (
                                                                                        <button
                                                                                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 text-xs font-bold text-[#0f53b7] transition hover:bg-blue-100"
                                                                                            onClick={() =>
                                                                                                void _handleTemplateDownload(
                                                                                                    objRequirement,
                                                                                                )
                                                                                            }
                                                                                            type="button"
                                                                                        >
                                                                                            <Download className="size-3.5" />
                                                                                            Download
                                                                                            Template
                                                                                        </button>
                                                                                    ) : null}
                                                                                    {blnCanReplace ? (
                                                                                        <label
                                                                                            className={cn(
                                                                                                'inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#0f53b7] px-3.5 text-xs font-bold text-white transition hover:bg-[#0b3f8b]',
                                                                                                blnIsUploading &&
                                                                                                'pointer-events-none opacity-70',
                                                                                            )}
                                                                                        >
                                                                                            {blnIsUploading ? (
                                                                                                <LoaderCircle className="size-3.5 animate-spin" />
                                                                                            ) : blnHasFile ? (
                                                                                                <RefreshCw className="size-3.5" />
                                                                                            ) : (
                                                                                                <FileUp className="size-3.5" />
                                                                                            )}
                                                                                            {blnIsUploading
                                                                                                ? 'Uploading'
                                                                                                : blnHasFile
                                                                                                    ? 'Replace File'
                                                                                                    : 'Upload'}
                                                                                            <input
                                                                                                accept=".pdf"
                                                                                                className="sr-only"
                                                                                                disabled={
                                                                                                    blnIsUploading
                                                                                                }
                                                                                                onChange={(
                                                                                                    objEvent,
                                                                                                ) =>
                                                                                                {
                                                                                                    void _handleFile(
                                                                                                        objRequirement,
                                                                                                        objEvent
                                                                                                            .target
                                                                                                            .files?.[0],
                                                                                                    );
                                                                                                    objEvent.target.value =
                                                                                                        '';
                                                                                                }}
                                                                                                type="file"
                                                                                            />
                                                                                        </label>
                                                                                    ) : null}
                                                                                    {blnHasFile ? (
                                                                                        <>
                                                                                            <button
                                                                                                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                                                                                                onClick={() =>
                                                                                                    objStoredDocument
                                                                                                        ? void _viewDocument(
                                                                                                            objStoredDocument,
                                                                                                        )
                                                                                                        : objPendingFile
                                                                                                            ? _viewPendingFile(
                                                                                                                objPendingFile,
                                                                                                            )
                                                                                                            : undefined
                                                                                                }
                                                                                                type="button"
                                                                                            >
                                                                                                <Eye className="size-3.5" />
                                                                                                View
                                                                                                File
                                                                                            </button>
                                                                                            {blnIsDraftMode ? (
                                                                                                <button
                                                                                                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-100 px-3 text-xs font-bold text-red-600 transition hover:bg-red-50"
                                                                                                    onClick={() =>
                                                                                                        void _remove(
                                                                                                            objRequirement,
                                                                                                        )
                                                                                                    }
                                                                                                    type="button"
                                                                                                >
                                                                                                    <Trash2 className="size-3.5" />
                                                                                                    Delete
                                                                                                    File
                                                                                                </button>
                                                                                            ) : null}
                                                                                        </>
                                                                                    ) : null}
                                                                                </div>
                                                                            </div>
                                                                        </article>
                                                                    ); // end return
                                                                } /* end DocumentaryRequirementsPage */,
                                                            )}
                                                        </div>
                                                    </section>
                                                ); // end return
                                            } /* end DocumentaryRequirementsPage */,
                                        )}

                                        {!arrVisibleRequirements.length ? (
                                            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                                                <Search className="mx-auto size-8 text-slate-300" />
                                                <p className="mt-3 font-bold text-slate-700">
                                                    No documents match “{strQuery}”
                                                </p>
                                                <button
                                                    className="mt-3 text-sm font-bold text-[#0f53b7]"
                                                    onClick={() => setStrQuery('')}
                                                    type="button"
                                                >
                                                    Clear search
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>

                                    {(blnIsDraftMode || blnIsRevisionMode) && (
                                        <div className="flex justify-end pt-4 pb-8">
                                            <button
                                                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0f53b7] px-8 text-sm font-bold text-white shadow-md transition hover:bg-[#0d479e] hover:shadow-lg disabled:pointer-events-none disabled:opacity-70"
                                                disabled={
                                                    blnIsRevisionMode
                                                        ? blnIsResubmittingRevision ||
                                                        arrRevisionDocuments.length > 0
                                                        : blnIsSubmittingApplication
                                                }
                                                onClick={() =>
                                                {
                                                    if (!objActiveApplication)
                                                    {
                                                        return;
                                                    }
                                                    if (blnIsRevisionMode)
                                                    {
                                                        void _handleResubmitRevisions();
                                                    } else
                                                    {
                                                        void _handleSubmitApplication();
                                                    }
                                                }}
                                                type="button"
                                            >
                                                {blnIsSubmittingApplication ||
                                                    blnIsResubmittingRevision ? (
                                                    <LoaderCircle className="size-4 animate-spin" />
                                                ) : null}
                                                {blnIsRevisionMode
                                                    ? blnIsResubmittingRevision
                                                        ? 'Resubmitting'
                                                        : arrRevisionDocuments.length
                                                            ? `${arrRevisionDocuments.length} Revision${arrRevisionDocuments.length === 1 ? '' : 's'} Remaining`
                                                            : 'Resubmit Revised Documents'
                                                    : blnIsSubmittingApplication
                                                        ? 'Submitting'
                                                        : objActiveApplication.program === 'GIA'
                                                            ? 'Submit GIA Proposal'
                                                            : 'Submit SETUP Application'}
                                                {blnIsSubmittingApplication ||
                                                    blnIsResubmittingRevision ? null : (
                                                    <ArrowRight className="size-4" />
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </>
                    )}
                </>
            ) : null}
        </div>
    ); // end return
} /* end DocumentaryRequirementsPage */
