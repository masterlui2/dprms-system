import { useState } from 'react'

import { initialProposalFormData } from '../data/proposal'
import { submitProposal } from '../services/proposalService'
import type { ApplicationRecord } from '../types/application'
import type {
  ProposalDocumentKey,
  ProposalFieldName,
  ProposalFormData,
  ProposalFormErrors,
  ProposalNotification,
  ProposalType,
} from '../types/proposal'
import { validateEntireProposal } from '../utils/proposalValidation'

const finalStep = 5

export function useProposalForm(program: Exclude<ProposalType, ''>) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<ProposalFormData>(() => ({
    ...initialProposalFormData,
    proposalType: program,
  }))
  const [errors, setErrors] = useState<ProposalFormErrors>({})
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notification, setNotification] = useState<ProposalNotification | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submittedApplication, setSubmittedApplication] =
    useState<ApplicationRecord | null>(null)

  function updateField<K extends ProposalFieldName>(
    field: K,
    value: ProposalFormData[K],
  ) {
    setFormData((current) => {
      return { ...current, [field]: value }
    })
    setErrors((current) => {
      const next = { ...current }
      delete next[field]

      return next
    })
  }

  function updateDocument(documentKey: ProposalDocumentKey, file: File | null) {
    setFormData((current) => ({
      ...current,
      documents: {
        ...current.documents,
        [documentKey]: file,
      },
    }))
    setErrors((current) => {
      const next = { ...current }
      delete next[`documents.${documentKey}`]
      return next
    })
  }

  function moveToStep(targetStep: number) {
    setErrors({})
    setCurrentStep(Math.min(finalStep, Math.max(1, targetStep)))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function requestSubmission() {
    const result = validateEntireProposal(formData)

    if (Object.keys(result.errors).length > 0) {
      setErrors(result.errors)
      setCurrentStep(result.firstInvalidStep)
      setNotification({
        type: 'error',
        title: 'Proposal is not ready',
        message: 'Review the highlighted information before submitting.',
      })
      return
    }

    setIsConfirmationOpen(true)
  }

  async function confirmSubmission() {
    setIsSubmitting(true)

    try {
      const application = await submitProposal(formData)
      setSubmittedApplication(application)
      setIsSubmitted(true)
      setIsConfirmationOpen(false)
      setNotification({
        type: 'success',
        title: 'Proposal submitted',
        message: `Reference ${application.referenceNo} was created for ${formData.emailAddress}.`,
      })
    } catch {
      setIsConfirmationOpen(false)
      setNotification({
        type: 'error',
        title: 'Submission failed',
        message: 'Your proposal was not submitted. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    confirmSubmission,
    currentStep,
    dismissNotification: () => setNotification(null),
    errors,
    formData,
    isConfirmationOpen,
    isSubmitted,
    isSubmitting,
    moveToStep,
    notification,
    requestSubmission,
    setIsConfirmationOpen,
    submittedApplication,
    updateDocument,
    updateField,
  }
}
