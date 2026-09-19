/**
 * System: DPRMS
 * Purpose: Coordinate proposal form state and interactions.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { useState } from 'react';
import { reportError } from '../utils/error_reporting';

import { INITIAL_PROPOSAL_FORM_DATA } from '../data/proposal';
import { submitProposal } from '../services/proposal_store';
import type { ApplicationRecord } from '../types/application';
import type {
    ProposalDocumentKey,
    ProposalFieldName,
    ProposalFormData,
    ProposalFormErrors,
    ProposalNotification,
    ProposalType,
} from '../types/proposal';
import { validateEntireProposal, validateProposalStep } from '../utils/proposal_validation';

const FINAL_STEP = 3;

/** Coordinate proposal form state and effects. */
export function useProposalForm(strProgram: Exclude<ProposalType, ''>)
{
    const [intCurrentStep, setIntCurrentStep] = useState(1);
    const [objFormData, setObjFormData] = useState<ProposalFormData>(() => ({
        ...INITIAL_PROPOSAL_FORM_DATA,
        proposalType: strProgram,
    }));
    const [objErrors, setObjErrors] = useState<ProposalFormErrors>({});
    const [blnIsConfirmationOpen, setBlnIsConfirmationOpen] = useState(false);
    const [blnIsSubmitting, setBlnIsSubmitting] = useState(false);
    const [objNotification, setObjNotification] = useState<ProposalNotification | null>(null);
    const [blnIsSubmitted, setBlnIsSubmitted] = useState(false);
    const [objSubmittedApplication, setObjSubmittedApplication] =
        useState<ApplicationRecord | null>(null);

    /** Update field. */
    function _updateField<K extends ProposalFieldName>(udtField: K, objValue: ProposalFormData[K])
    {
        setObjFormData((objCurrent) =>
        {
            return { ...objCurrent, [udtField]: objValue };
        });
        setObjErrors((objCurrent) =>
        {
            const objNext = { ...objCurrent };
            delete objNext[udtField];

            return objNext;
        });
    }

    /** Update document. */
    function _updateDocument(strDocumentKey: ProposalDocumentKey, objFile: File | null)
    {
        setObjFormData((objCurrent) => ({
            ...objCurrent,
            documents: {
                ...objCurrent.documents,
                [strDocumentKey]: objFile,
            },
        }));
        setObjErrors((objCurrent) =>
        {
            const objNext = { ...objCurrent };
            delete objNext[`documents.${strDocumentKey}`];
            return objNext;
        });
    }

    /** Move to step. */
    function _moveToStep(intTargetStep: number)
    {
        setObjErrors({});
        setIntCurrentStep(Math.min(FINAL_STEP, Math.max(1, intTargetStep)));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /** Continue to next step. */
    function _continueToNextStep()
    {
        const objNextErrors = validateProposalStep(intCurrentStep, objFormData);

        if (Object.keys(objNextErrors).length > 0)
        {
            setObjErrors(objNextErrors);
            setObjNotification({
                type: 'error',
                title: 'Please review this step',
                message: 'Complete the highlighted information before continuing.',
            });
            return;
        }

        _moveToStep(intCurrentStep + 1);
    }

    /** Request submission. */
    function _requestSubmission()
    {
        const objResult = validateEntireProposal(objFormData);

        if (Object.keys(objResult.errors).length > 0)
        {
            setObjErrors(objResult.errors);
            setIntCurrentStep(objResult.firstInvalidStep);
            setObjNotification({
                type: 'error',
                title: 'Proposal is not ready',
                message: 'Review the highlighted information before submitting.',
            });
            return;
        }

        setBlnIsConfirmationOpen(true);
    }

    /** Confirm submission. */
    async function _confirmSubmission()
    {
        setBlnIsSubmitting(true);

        try
        {
            const objApplication = await submitProposal(objFormData);
            setObjSubmittedApplication(objApplication);
            setBlnIsSubmitted(true);
            setBlnIsConfirmationOpen(false);
            setObjNotification({
                type: 'success',
                title: 'Proposal submitted',
                message: `Reference ${objApplication.referenceNo} was created for ${objFormData.emailAddress}.`,
            });
        } catch (errCaught)
        {
            reportError(errCaught, 'use_proposal_form: confirm submission failed.');

            setBlnIsConfirmationOpen(false);
            setObjNotification({
                type: 'error',
                title: 'Submission failed',
                message: 'Your proposal was not submitted. Please try again.',
            });
        } finally
        {
            setBlnIsSubmitting(false);
        }
    } /* end _confirmSubmission */

    return {
        confirmSubmission: _confirmSubmission,
        continueToNextStep: _continueToNextStep,
        currentStep: intCurrentStep,
        dismissNotification: () => setObjNotification(null),
        errors: objErrors,
        formData: objFormData,
        isConfirmationOpen: blnIsConfirmationOpen,
        isSubmitted: blnIsSubmitted,
        isSubmitting: blnIsSubmitting,
        moveToStep: _moveToStep,
        notification: objNotification,
        requestSubmission: _requestSubmission,
        setIsConfirmationOpen: setBlnIsConfirmationOpen,
        submittedApplication: objSubmittedApplication,
        updateDocument: _updateDocument,
        updateField: _updateField,
    };
} /* end useProposalForm */
