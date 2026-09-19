/**
 * System: DPRMS
 * Purpose: Provide proposal validation utilities.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { getVisibleDocumentRequirements } from '../data/proposal';
import type { ProposalFormData, ProposalFormErrors } from '../types/proposal';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^(?:\+63|0)\d{10}$/;

/** Required. */
function _required(strValue: string, txtMessage: string): string | undefined
{
    return strValue.trim() ? undefined : txtMessage;
}

/** Compact errors. */
function _compactErrors(objErrors: Record<string, string | undefined>): ProposalFormErrors
{
    const objCompactedErrors: ProposalFormErrors = {};

    Object.entries(objErrors).forEach(([strField, txtMessage]) =>
    {
        if (txtMessage)
        {
            objCompactedErrors[strField] = txtMessage;
        }
    });

    return objCompactedErrors;
}

/** Validate proposal information step. */
export function validateProposalInformationStep(objData: ProposalFormData): ProposalFormErrors
{
    const objSharedErrors = {
        applicantFullName: _required(
            objData.applicantFullName,
            objData.proposalType === 'GIA'
                ? 'Enter the project leader or contact person.'
                : 'Enter the owner or authorized representative.',
        ),
        applicantPosition: _required(
            objData.applicantPosition,
            'Enter the position or designation.',
        ),
        emailAddress:
            _required(objData.emailAddress, 'Enter an email address.') ??
            (!EMAIL_PATTERN.test(objData.emailAddress)
                ? 'Enter a valid email address.'
                : undefined),
        contactNumber:
            _required(objData.contactNumber, 'Enter a contact number.') ??
            (!PHONE_PATTERN.test(objData.contactNumber.replace(/[\s-]/g, ''))
                ? 'Use a valid Philippine number, such as 09171234567.'
                : undefined),
        organizationName: _required(
            objData.organizationName,
            objData.proposalType === 'GIA'
                ? 'Enter the implementing agency or organization.'
                : 'Enter the business name.',
        ),
        businessAddress: _required(
            objData.businessAddress,
            objData.proposalType === 'GIA'
                ? 'Enter the office address.'
                : 'Enter the business address.',
        ),
        municipality: _required(objData.municipality, 'Select a municipality or city.'),
        projectTitle: _required(objData.projectTitle, 'Enter the project title.'),
        siteOfImplementation: _required(
            objData.siteOfImplementation,
            'Enter the site of implementation.',
        ),
        projectObjectives: _required(objData.projectObjectives, 'Enter the project objectives.'),
        expectedOutputs: _required(
            objData.expectedOutputs,
            'Enter the expected outputs or results.',
        ),
    };

    if (objData.proposalType === 'GIA')
    {
        return _compactErrors({
            ...objSharedErrors,
            organizationType: _required(objData.organizationType, 'Select the organization type.'),
            projectCategory: _required(objData.projectCategory, 'Select the project category.'),
            projectType: _required(objData.projectType, 'Select the project type.'),
            projectDescription: _required(
                objData.projectDescription,
                'Enter a brief project summary or need.',
            ),
            targetBeneficiary: _required(
                objData.targetBeneficiary,
                'Select the target beneficiaries.',
            ),
        });
    }

    return _compactErrors({
        ...objSharedErrors,
        businessType: _required(objData.businessType, 'Select a business type.'),
        lineOfBusiness: _required(objData.lineOfBusiness, 'Select the line of business.'),
        enterpriseSize: _required(objData.enterpriseSize, 'Select the enterprise size.'),
        industryCategory: _required(objData.industryCategory, 'Select an industry sector.'),
        yearEstablished:
            _required(objData.yearEstablished, 'Enter years in operation.') ??
            (!Number.isFinite(Number(objData.yearEstablished)) ||
                Number(objData.yearEstablished) < 0
                ? 'Enter a valid number of years.'
                : undefined),
        scopeOfAssistance: _required(
            objData.scopeOfAssistance,
            'Select the type of assistance needed.',
        ),
        currentOperationalProblem: _required(
            objData.currentOperationalProblem,
            'Describe the business problem or need.',
        ),
        proposedTechnologyAssistance: _required(
            objData.proposedTechnologyAssistance,
            'Describe the technology or equipment requested.',
        ),
    });
} /* end validateProposalInformationStep */

/** Validate documents step. */
export function validateDocumentsStep(objData: ProposalFormData): ProposalFormErrors
{
    const objErrors: ProposalFormErrors = {};

    getVisibleDocumentRequirements(objData).forEach((objDocument) =>
    {
        if (!objData.documents[objDocument.key])
        {
            objErrors[`documents.${objDocument.key}`] = objDocument.validationMessage;
        }
    });

    return objErrors;
}

/** Validate review step. */
export function validateReviewStep(objData: ProposalFormData): ProposalFormErrors
{
    return objData.certified
        ? {}
        : { certified: 'Confirm that the information is true and complete before submitting.' };
}

/** Validate proposal step. */
export function validateProposalStep(
    intStep: number,
    objData: ProposalFormData,
): ProposalFormErrors
{
    if (intStep === 1)
    {
        return validateProposalInformationStep(objData);
    }
    if (intStep === 2)
    {
        return validateDocumentsStep(objData);
    }
    return validateReviewStep(objData);
}

/** Validate entire proposal. */
export function validateEntireProposal(objData: ProposalFormData):
    {
        errors: ProposalFormErrors;
        firstInvalidStep: number;
    }
{
    let intStep = 1;
    for (; intStep <= 3; intStep += 1)
    {
        const objErrors = validateProposalStep(intStep, objData);

        if (Object.keys(objErrors).length > 0)
        {
            return { errors: objErrors, firstInvalidStep: intStep };
        }
    }

    return { errors: {}, firstInvalidStep: 3 };
}
