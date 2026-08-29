import { ArrowLeft, ArrowRight, CheckCircle2, MailCheck, Send } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useProposalForm } from '../../hooks/useProposalForm'
import type { ProposalType } from '../../types/proposal'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { ConfirmationDialog } from './ConfirmationDialog'
import { NotificationToast } from './NotificationToast'
import { ProposalStepper } from './ProposalStepper'
import { DocumentsStep } from './steps/DocumentsStep'
import { ProposalInformationStep } from './steps/ProposalInformationStep'
import { ReviewStep } from './steps/ReviewStep'
import { SetupProposalForm } from './SetupProposalForm'

export function ProposalForm({
  program,
}: {
  program: Exclude<ProposalType, ''>
}) {
  if (program === 'SETUP') {
    return <SetupProposalForm />
  }

  return <GiaProposalForm program={program} />
}

function GiaProposalForm({ program }: { program: Exclude<ProposalType, ''> }) {
  const {
    confirmSubmission,
    continueToNextStep,
    currentStep,
    dismissNotification,
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
  } = useProposalForm(program)

  if (isSubmitted) {
    return (
      <>
        <Card className="rounded-lg border-emerald-200">
          <CardContent className="px-6 py-12 text-center sm:px-10 sm:py-16">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="size-8" />
            </div>
            <h2 className="mt-5 text-2xl font-black text-[#073b82]">
              Application Successfully Submitted
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
              Your {formData.proposalType || 'DOST'} application has been received by DOST.
              Activate your Beneficiary Portal account to track status updates, remarks, and
              document requirements.
            </p>
            <div className="mx-auto mt-6 max-w-md rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-4">
              <p className="text-xs font-bold uppercase text-emerald-800">
                Reference Number
              </p>
              <p className="mt-1 break-all font-mono text-lg font-black text-emerald-950">
                {submittedApplication?.referenceNo ?? 'Generating reference...'}
              </p>
            </div>
            <div className="mx-auto mt-6 flex max-w-md items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-5 py-4 text-left">
              <MailCheck className="mt-0.5 size-5 shrink-0 text-[#0f53b7]" />
              <div>
                <p className="text-xs font-bold uppercase text-[#073b82]">
                  Email Notification
                </p>
                <p className="mt-1 break-all text-sm font-semibold text-slate-700">
                  {formData.emailAddress}
                </p>
              </div>
            </div>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                className="inline-flex h-12 items-center justify-center rounded-lg bg-[#0f53b7] px-5 text-sm font-bold text-white transition hover:bg-[#0b3f8b] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                to={
                  submittedApplication
                    ? `/activate/${submittedApplication.referenceNo}`
                    : '/login'
                }
              >
                Activate Beneficiary Portal Account
              </Link>
              <Link
                className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-bold text-[#073b82] transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                to="/"
              >
                Return to Home
              </Link>
            </div>
          </CardContent>
        </Card>
        <NotificationToast notification={notification} onDismiss={dismissNotification} />
      </>
    )
  }

  return (
    <>
      <div className="mb-7">
        <ProposalStepper
          currentStep={currentStep}
          onStepChange={moveToStep}
        />
      </div>

      <Card className="overflow-hidden rounded-2xl">
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault()

            if (currentStep < 3) {
              continueToNextStep()
            } else {
              requestSubmission()
            }
          }}
        >
          <CardContent className="p-5 sm:p-8 lg:p-10">
            {Object.keys(errors).length > 0 ? (
              <div
                className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
                role="alert"
              >
                Please correct the highlighted fields before continuing.
              </div>
            ) : null}

            {currentStep === 1 ? (
              <ProposalInformationStep
                data={formData}
                errors={errors}
                onFieldChange={updateField}
              />
            ) : null}
            {currentStep === 2 ? (
              <DocumentsStep
                data={formData}
                errors={errors}
                onDocumentChange={updateDocument}
              />
            ) : null}
            {currentStep === 3 ? (
              <ReviewStep
                data={formData}
                errors={errors}
                onEditSection={moveToStep}
                onFieldChange={updateField}
              />
            ) : null}
          </CardContent>

          <div className="flex flex-col-reverse items-stretch justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:px-8">
            <Button
              className="h-11"
              disabled={currentStep === 1}
              onClick={() => moveToStep(currentStep - 1)}
              type="button"
              variant="outline"
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>

            <p className="text-center text-xs font-bold text-slate-500">
              Step {currentStep} of 3
            </p>

            {currentStep < 3 ? (
              <Button
                className="h-11"
                type="submit"
              >
                {currentStep === 1 ? 'Continue to Documents' : 'Review Submission'}
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button className="h-11" type="submit" variant="secondary">
                <Send className="size-4" />
                {program === 'GIA' ? 'Submit GIA Proposal' : 'Submit SETUP Request'}
              </Button>
            )}
          </div>
        </form>
      </Card>

      <ConfirmationDialog
        isOpen={isConfirmationOpen}
        isSubmitting={isSubmitting}
        onCancel={() => setIsConfirmationOpen(false)}
        onConfirm={confirmSubmission}
      />
      <NotificationToast notification={notification} onDismiss={dismissNotification} />
    </>
  )
}
