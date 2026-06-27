import { getDocumentRequirements } from '../data/proposal'
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

export function validateApplicantStep(data: ProposalFormData): ProposalFormErrors {
  return compactErrors({
    applicantFullName: required(data.applicantFullName, 'Enter the applicant or representative name.'),
    applicantPosition: required(data.applicantPosition, 'Enter the applicant position.'),
    emailAddress:
      required(data.emailAddress, 'Enter an email address.') ??
      (!emailPattern.test(data.emailAddress) ? 'Enter a valid email address.' : undefined),
    contactNumber:
      required(data.contactNumber, 'Enter a contact number.') ??
      (!phonePattern.test(data.contactNumber.replace(/[\s-]/g, ''))
        ? 'Use a valid Philippine number, such as 09171234567.'
        : undefined),
    organizationName: required(data.organizationName, 'Enter the registered organization name.'),
    organizationType: required(data.organizationType, 'Select an organization type.'),
    industryCategory: required(data.industryCategory, 'Select an industry category.'),
    yearEstablished:
      required(data.yearEstablished, 'Enter the year established.') ??
      (Number(data.yearEstablished) < 1900 ||
      Number(data.yearEstablished) > new Date().getFullYear()
        ? 'Enter a valid four-digit year.'
        : undefined),
    employeeCount:
      required(data.employeeCount, 'Enter the number of employees.') ??
      (Number(data.employeeCount) < 1 ? 'Enter at least one employee.' : undefined),
    municipality: required(data.municipality, 'Select a municipality.'),
    businessAddress: required(data.businessAddress, 'Enter the complete business address.'),
  })
}

export function validateProjectStep(data: ProposalFormData): ProposalFormErrors {
  return compactErrors({
    proposalType: required(data.proposalType, 'Please select a program.'),
    projectTitle: required(data.projectTitle, 'Project title is required.'),
    projectCategory: required(
      data.projectCategory,
      'Please select a project category.',
    ),
    projectType: required(data.projectType, 'Please select a project type.'),
    technologyInnovation: required(
      data.technologyInnovation,
      'Please specify the technology or innovation.',
    ),
    targetBeneficiary: required(
      data.targetBeneficiary,
      'Please select the target beneficiaries.',
    ),
    equipmentNeeds: required(
      data.equipmentNeeds,
      'Please describe the equipment or technology needed.',
    ),
    totalBusinessAssets:
      required(data.totalBusinessAssets, 'Please enter the total business assets.') ??
      (Number(data.totalBusinessAssets) <= 0
        ? 'Total business assets must be greater than zero.'
        : undefined),
    annualNetProfit:
      required(data.annualNetProfit, 'Please enter the estimated annual net profit.') ??
      (Number(data.annualNetProfit) < 0
        ? 'Annual net profit cannot be negative.'
        : undefined),
  })
}

export function validateDocumentsStep(data: ProposalFormData): ProposalFormErrors {
  const errors: ProposalFormErrors = {}

  getDocumentRequirements(data.proposalType).forEach((document) => {
    if (document.required && !data.documents[document.key]) {
      errors[`documents.${document.key}`] = `Upload the required ${document.label.toLowerCase()}.`
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
  if (step === 1) return validateApplicantStep(data)
  if (step === 2) return validateProjectStep(data)
  if (step === 3) return validateDocumentsStep(data)
  return validateReviewStep(data)
}

export function validateEntireProposal(data: ProposalFormData): {
  errors: ProposalFormErrors
  firstInvalidStep: number
} {
  for (let step = 1; step <= 4; step += 1) {
    const errors = validateProposalStep(step, data)

    if (Object.keys(errors).length > 0) {
      return { errors, firstInvalidStep: step }
    }
  }

  return { errors: {}, firstInvalidStep: 4 }
}
