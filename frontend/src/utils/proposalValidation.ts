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
  const sharedErrors = {
    proposalType: required(data.proposalType, 'Please select a program.'),
    projectTitle: required(data.projectTitle, 'Project title is required.'),
    projectCategory: required(
      data.projectCategory,
      data.proposalType === 'SETUP'
        ? 'Please select an industry sector.'
        : 'Please select a project category.',
    ),
    projectType: required(data.projectType, 'Please select a project type.'),
    targetBeneficiary: required(
      data.targetBeneficiary,
      data.proposalType === 'SETUP'
        ? 'Please select the business size or entity type.'
        : 'Please select the target beneficiaries.',
    ),
  }

  if (data.proposalType === 'GIA') {
    return compactErrors({
      ...sharedErrors,
      cooperatingAgency: required(data.cooperatingAgency, 'Enter the cooperating agency.'),
      siteOfImplementation: required(
        data.siteOfImplementation,
        'Enter the site of implementation.',
      ),
      projectDuration: required(data.projectDuration, 'Enter the project duration.'),
      projectObjectives: required(
        data.projectObjectives,
        'Please enter the project objectives.',
      ),
      methodology: required(data.methodology, 'Please describe the methodology.'),
      expectedOutputs: required(
        data.expectedOutputs,
        'Please describe the expected outputs or 6Ps.',
      ),
      workplanSummary: required(
        data.workplanSummary,
        'Please provide a workplan summary.',
      ),
      personnelInvolved: required(
        data.personnelInvolved,
        'Please list personnel involved.',
      ),
    })
  }

  return compactErrors({
    ...sharedErrors,
    projectDescription: required(
      data.projectDescription,
      'Please enter the business background.',
    ),
    currentOperationalProblem: required(
      data.currentOperationalProblem,
      'Please describe the current operational problem.',
    ),
    proposedTechnologyAssistance: required(
      data.proposedTechnologyAssistance,
      'Please describe the proposed technology assistance.',
    ),
    expectedBusinessImprovement: required(
      data.expectedBusinessImprovement,
      'Please describe the expected business improvement.',
    ),
  })
}

export function validateDocumentsStep(data: ProposalFormData): ProposalFormErrors {
  const errors: ProposalFormErrors = {}

  getDocumentRequirements(data.proposalType).forEach((document) => {
    if (document.required && !data.documents[document.key]) {
      errors[`documents.${document.key}`] = document.validationMessage
    }
  })

  return errors
}

export function validateBudgetEquipmentStep(
  data: ProposalFormData,
): ProposalFormErrors {
  return compactErrors({
    totalBusinessAssets:
      required(
        data.totalBusinessAssets,
        data.proposalType === 'SETUP'
          ? 'Enter the project cost or assistance amount.'
          : 'Enter the budget summary amount.',
      ) ??
      (Number(data.totalBusinessAssets) < 1
        ? 'Enter an amount greater than zero.'
        : undefined),
    annualNetProfit:
      required(
        data.annualNetProfit,
        data.proposalType === 'SETUP'
          ? 'Enter the counterpart fund or annual net profit.'
          : 'Enter the counterpart fund amount, or 0 if not applicable.',
      ) ??
      (Number(data.annualNetProfit) < 0
        ? 'Enter a valid amount.'
        : undefined),
    equipmentNeeds: required(
      data.equipmentNeeds,
      data.proposalType === 'SETUP'
        ? 'Describe the requested equipment and expected business improvement.'
        : 'Describe the equipment or resource requirements.',
    ),
  })
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
  if (step === 3) return validateBudgetEquipmentStep(data)
  if (step === 4) return validateDocumentsStep(data)
  return validateReviewStep(data)
}

export function validateEntireProposal(data: ProposalFormData): {
  errors: ProposalFormErrors
  firstInvalidStep: number
} {
  for (let step = 1; step <= 5; step += 1) {
    const errors = validateProposalStep(step, data)

    if (Object.keys(errors).length > 0) {
      return { errors, firstInvalidStep: step }
    }
  }

  return { errors: {}, firstInvalidStep: 5 }
}
