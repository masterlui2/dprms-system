import { getVisibleDocumentRequirements } from '../data/proposal'
import type { ProposalFormData, ProposalFormErrors } from '../types/proposal'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phonePattern = /^(?:\+63|0)\d{10}$/

function required(value: string, message: string): string | undefined {
  return value.trim() ? undefined : message
}

function positiveAmount(value: string, message: string): string | undefined {
  return (
    required(value, message) ??
    (Number(value) < 1 ? 'Enter an amount greater than zero.' : undefined)
  )
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
  const sharedErrors = {
    applicantFullName: required(
      data.applicantFullName,
      data.proposalType === 'GIA'
        ? 'Enter the project leader name.'
        : 'Enter the owner or representative name.',
    ),
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
        ? 'Enter the implementing agency.'
        : 'Enter the business name.',
    ),
    businessAddress: required(
      data.businessAddress,
      data.proposalType === 'GIA'
        ? 'Enter the office address.'
        : 'Enter the business address.',
    ),
  }

  if (data.proposalType === 'GIA') {
    return compactErrors({
      ...sharedErrors,
      headOfAgency: required(data.headOfAgency, 'Enter the head of implementing agency.'),
      authorizedRepresentative: required(
        data.authorizedRepresentative,
        'Enter the authorized representative.',
      ),
    })
  }

  return compactErrors({
    ...sharedErrors,
    municipality: required(data.municipality, 'Select a municipality.'),
    industryCategory: required(data.industryCategory, 'Select an industry sector.'),
    lineOfBusiness: required(data.lineOfBusiness, 'Enter the line of business.'),
    yearEstablished:
      required(data.yearEstablished, 'Enter years in operation.') ??
      (Number(data.yearEstablished) < 0 ? 'Enter a valid number of years.' : undefined),
    businessType: required(data.businessType, 'Select a business type.'),
    enterpriseSize: required(data.enterpriseSize, 'Select an enterprise size.'),
  })
}

export function validateProjectStep(data: ProposalFormData): ProposalFormErrors {
  if (data.proposalType === 'GIA') {
    return compactErrors({
      projectTitle: required(data.projectTitle, 'Project title is required.'),
      projectType: required(data.projectType, 'Please select R&D or Non-R&D.'),
      siteOfImplementation: required(
        data.siteOfImplementation,
        'Enter the site of implementation.',
      ),
      projectDuration: required(data.projectDuration, 'Enter the project duration.'),
      projectObjectives: required(data.projectObjectives, 'Please enter the project objectives.'),
      rationale: required(data.rationale, 'Please enter the rationale or justification.'),
      methodology: required(data.methodology, 'Please describe the methodology.'),
      expectedOutputs: required(data.expectedOutputs, 'Please describe the expected outputs.'),
      targetBeneficiary: required(data.targetBeneficiary, 'Please describe the target beneficiaries.'),
      sustainabilityPlan: required(data.sustainabilityPlan, 'Please provide a sustainability plan.'),
    })
  }

  return compactErrors({
    tnaStatus: required(data.tnaStatus, 'Please select the TNA status.'),
    currentOperationalProblem: required(
      data.currentOperationalProblem,
      'Please describe the current production problem.',
    ),
    existingEquipmentUsed: required(
      data.existingEquipmentUsed,
      'Please list existing equipment used.',
    ),
    processBottlenecks: required(data.processBottlenecks, 'Please describe process bottlenecks.'),
    productQualityConcerns: required(
      data.productQualityConcerns,
      'Please describe product quality concerns.',
    ),
    productivityConcerns: required(
      data.productivityConcerns,
      'Please describe productivity concerns.',
    ),
    targetImprovement: required(data.targetImprovement, 'Please describe the target improvement.'),
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

export function validateBudgetEquipmentStep(
  data: ProposalFormData,
): ProposalFormErrors {
  if (data.proposalType === 'GIA') {
    return compactErrors({
      totalProjectCost: positiveAmount(data.totalProjectCost, 'Enter the total project cost.'),
      requestedAmount: positiveAmount(data.requestedAmount, 'Enter the requested amount.'),
      budgetSummary: required(data.budgetSummary, 'Please provide a budget summary.'),
      workplanSummary: required(data.workplanSummary, 'Please provide a workplan summary.'),
      equipmentNeeds: required(data.equipmentNeeds, 'Describe equipment requirements or write N/A.'),
    })
  }

  return compactErrors({
    projectTitle: required(data.projectTitle, 'Proposed project title is required.'),
    scopeOfAssistance: required(data.scopeOfAssistance, 'Please describe the scope of assistance.'),
    projectObjectives: required(data.projectObjectives, 'Please enter project objectives.'),
    expectedOutputs: required(data.expectedOutputs, 'Please describe expected outcomes.'),
    proposedTechnologyAssistance: required(
      data.proposedTechnologyAssistance,
      'Please describe the equipment or technology requested.',
    ),
    equipmentPurpose: required(data.equipmentPurpose, 'Please describe the equipment purpose.'),
    supplierFabricator: required(data.supplierFabricator, 'Enter the supplier or fabricator.'),
    equipmentQuotationAmount: positiveAmount(
      data.equipmentQuotationAmount,
      'Enter the equipment quotation amount.',
    ),
    quotationCount:
      required(data.quotationCount, 'Enter the number of quotations uploaded.') ??
      (Number(data.quotationCount) < 0 ? 'Enter a valid quotation count.' : undefined),
    expectedBusinessImprovement: required(
      data.expectedBusinessImprovement,
      'Please describe the expected business improvement.',
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
