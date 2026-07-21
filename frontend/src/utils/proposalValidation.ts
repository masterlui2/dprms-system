import { getVisibleDocumentRequirements } from '../data/proposal'
import type { ProposalFormData, ProposalFormErrors } from '../types/proposal'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phonePattern = /^(?:\+63|0)\d{10}$/

function required(value: string, message: string): string | undefined {
  return value.trim() ? undefined : message
}

function compactErrors(
  errors: Record<string, string | undefined>,
): ProposalFormErrors {
  const compactedErrors: ProposalFormErrors = {}

  Object.entries(errors).forEach(([field, message]) => {
    if (message) {
      compactedErrors[field] = message
    }
  })

  return compactedErrors
}

export function validateProposalInformationStep(
  data: ProposalFormData,
): ProposalFormErrors {
  const sharedErrors = {
    applicantFullName: required(
      data.applicantFullName,
      data.proposalType === 'GIA'
        ? 'Enter the project leader or contact person.'
        : 'Enter the owner or authorized representative.',
    ),
    applicantPosition: required(data.applicantPosition, 'Enter the position or designation.'),
    emailAddress:
      required(data.emailAddress, 'Enter an email address.') ??
      (!emailPattern.test(data.emailAddress) ? 'Enter a valid email address.' : undefined),
    contactNumber:
      required(data.contactNumber, 'Enter a contact number.') ??
      (!phonePattern.test(data.contactNumber.replace(/[\s-]/g, ''))
        ? 'Use a valid Philippine number, such as 09171234567.'
        : undefined),
    organizationName: required(
      data.organizationName,
      data.proposalType === 'GIA'
        ? 'Enter the implementing agency or organization.'
        : 'Enter the business name.',
    ),
    businessAddress: required(
      data.businessAddress,
      data.proposalType === 'GIA'
        ? 'Enter the office address.'
        : 'Enter the business address.',
    ),
    municipality: required(data.municipality, 'Select a municipality or city.'),
    projectTitle: required(data.projectTitle, 'Enter the project title.'),
    siteOfImplementation: required(
      data.siteOfImplementation,
      'Enter the site of implementation.',
    ),
    projectObjectives: required(data.projectObjectives, 'Enter the project objectives.'),
    expectedOutputs: required(data.expectedOutputs, 'Enter the expected outputs or results.'),
  }

  if (data.proposalType === 'GIA') {
    return compactErrors({
      ...sharedErrors,
      organizationType: required(data.organizationType, 'Select the organization type.'),
      projectCategory: required(data.projectCategory, 'Select the project category.'),
      projectType: required(data.projectType, 'Select the project type.'),
      projectDescription: required(
        data.projectDescription,
        'Enter a brief project summary or need.',
      ),
      targetBeneficiary: required(data.targetBeneficiary, 'Select the target beneficiaries.'),
    })
  }

  return compactErrors({
    ...sharedErrors,
    businessType: required(data.businessType, 'Select a business type.'),
    lineOfBusiness: required(data.lineOfBusiness, 'Select the line of business.'),
    enterpriseSize: required(data.enterpriseSize, 'Select the enterprise size.'),
    industryCategory: required(data.industryCategory, 'Select an industry sector.'),
    yearEstablished:
      required(data.yearEstablished, 'Enter years in operation.') ??
      (!Number.isFinite(Number(data.yearEstablished)) || Number(data.yearEstablished) < 0
        ? 'Enter a valid number of years.'
        : undefined),
    scopeOfAssistance: required(data.scopeOfAssistance, 'Select the type of assistance needed.'),
    currentOperationalProblem: required(
      data.currentOperationalProblem,
      'Describe the business problem or need.',
    ),
    proposedTechnologyAssistance: required(
      data.proposedTechnologyAssistance,
      'Describe the technology or equipment requested.',
    ),
  })
}

export function validateDocumentsStep(data: ProposalFormData): ProposalFormErrors {
  const errors: ProposalFormErrors = {}

  getVisibleDocumentRequirements(data).forEach((document) => {
    if (!data.documents[document.key]) {
      errors[`documents.${document.key}`] = document.validationMessage
    }
  })

  return errors
}

export function validateReviewStep(data: ProposalFormData): ProposalFormErrors {
  return data.certified
    ? {}
    : { certified: 'Confirm that the information is true and complete before submitting.' }
}

export function validateProposalStep(
  step: number,
  data: ProposalFormData,
): ProposalFormErrors {
  if (step === 1) return validateProposalInformationStep(data)
  if (step === 2) return validateDocumentsStep(data)
  return validateReviewStep(data)
}

export function validateEntireProposal(data: ProposalFormData): {
  errors: ProposalFormErrors
  firstInvalidStep: number
} {
  for (let step = 1; step <= 3; step += 1) {
    const errors = validateProposalStep(step, data)

    if (Object.keys(errors).length > 0) {
      return { errors, firstInvalidStep: step }
    }
  }

  return { errors: {}, firstInvalidStep: 3 }
}
