/**
 * System: DPRMS
 * Purpose: Render application status page for the application pages.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { ClipboardCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { ProposalProgress } from '../../components/proponent/ProposalProgress';
import { getMockUser } from '../../lib/mock_auth';
import { getApplications, syncUserApplicationsFromBackend } from '../../services/application_store';
import
{
    fetchGiaDocumentaryRequirements,
    fetchSetupDocumentaryRequirements,
    getDocuments,
    type DocumentaryRequirement,
} from '../../services/document_store';
import { getGiaProposal } from '../../services/gia_proposal_store';
import type { ApplicationRecord } from '../../types/application';

/** Render application status page and its available actions. */
export function ApplicationStatusPage()
{
    const objUser = getMockUser();
    const objLocation = useLocation();
    const strActiveProgram: ApplicationRecord['program'] = objLocation.pathname.startsWith('/gia')
        ? 'GIA'
        : objLocation.pathname.startsWith('/setup')
            ? 'SETUP'
            : (objUser?.program ?? 'SETUP');

    const [arrAllApplications, setArrAllApplications] = useState<ApplicationRecord[]>(() =>
        getApplications(),
    );

    useEffect(() =>
    {
        let blnCancelled = false;
        const objCurrentUser = getMockUser();
        if (!objCurrentUser)
        {
            return;
        }

        void syncUserApplicationsFromBackend(objCurrentUser).then((arrApps) =>
        {
            if (!blnCancelled)
            {
                setArrAllApplications(arrApps);
            }
        });

        return () =>
        {
            blnCancelled = true;
        };
    }, [objUser?.id, objUser?.email, objUser?.applicationReference]);

    const arrApplications = arrAllApplications.filter(
        (objItem) =>
            objItem.program === strActiveProgram &&
            (!objUser?.email || objItem.contactEmail.toLowerCase() === objUser.email.toLowerCase()),
    );
    const objApplication =
        arrApplications.find((objItem) => objItem.referenceNo === objUser?.applicationReference) ??
        arrApplications[0];
    const strApplicationProgram = objApplication?.program;
    const strApplicationReferenceNo = objApplication?.referenceNo;
    const objDocuments = strApplicationReferenceNo ? getDocuments(strApplicationReferenceNo) : {};
    const objGiaProposal =
        strApplicationProgram === 'GIA' && strApplicationReferenceNo
            ? getGiaProposal(strApplicationReferenceNo)
            : null;

    const [arrRequirements, setArrRequirements] = useState<DocumentaryRequirement[]>([]);

    useEffect(
        () =>
        {
            if (!strApplicationProgram)
            {
                setArrRequirements([]);
                return;
            }
            let blnCancelled = false;
            if (strApplicationProgram === 'SETUP')
            {
                // Note: no organizationType/businessSize filter available here yet, so this
                // returns the unfiltered SETUP checklist. Wire this up to a real proposal
                // lookup once one exists.
                fetchSetupDocumentaryRequirements()
                    .then((arrRecords) =>
                    {
                        if (!blnCancelled)
                        {
                            setArrRequirements(arrRecords);
                        }
                    })
                    .catch(() =>
                    {
                        if (!blnCancelled)
                        {
                            setArrRequirements([]);
                        }
                    });
            } else
            {
                fetchGiaDocumentaryRequirements(objGiaProposal?.proponentCategory)
                    .then((arrRecords) =>
                    {
                        if (!blnCancelled)
                        {
                            setArrRequirements(arrRecords);
                        }
                    })
                    .catch(() =>
                    {
                        if (!blnCancelled)
                        {
                            setArrRequirements([]);
                        }
                    });
            }
            return () =>
            {
                blnCancelled = true;
            };
        } /* end ApplicationStatusPage */,
        [strApplicationReferenceNo, strApplicationProgram, objGiaProposal?.proponentCategory],
    );

    const arrRequiredRequirements = arrRequirements.filter((objItem) => objItem.required);
    const blnComplete =
        arrRequiredRequirements.length > 0 &&
        arrRequiredRequirements.every((objItem) => objDocuments[objItem.id]);

    return (
        <div className="space-y-7">
            <AdminPageHeader
                txtDescription="Follow your proposal from submission through DOST evaluation."
                strEyebrow="Application Workflow"
                title="Application Status"
            />
            {objApplication ? (
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <div className="mb-8 flex items-start gap-4 border-b border-slate-100 pb-6">
                        <span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-[#0f53b7]">
                            <ClipboardCheck className="size-5" />
                        </span>
                        <div>
                            <p className="font-mono text-xs font-bold text-[#0f53b7]">
                                {objApplication.referenceNo}
                            </p>
                            <h2 className="mt-1 text-xl font-black text-slate-900">
                                {objApplication.projectTitle}
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                {objApplication.organizationName}
                            </p>
                        </div>
                    </div>
                    <ProposalProgress
                        objApplication={objApplication}
                        blnDocumentsComplete={blnComplete}
                    />
                    <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50 px-4 py-4 text-sm leading-6 text-[#073b82]">
                        {blnComplete
                            ? 'Your required files are complete. The proposal is ready for DOST initial review.'
                            : 'Your proposal was submitted. Complete the final document upload to proceed to initial review.'}
                    </div>
                </section>
            ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                    <p className="font-bold text-slate-700">
                        No submitted proposal is available yet.
                    </p>
                </div>
            )}
        </div>
    );
} /* end ApplicationStatusPage */
