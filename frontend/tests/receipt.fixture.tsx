import { createRoot } from 'react-dom/client'
import { VerifyPaymentModal } from '../src/components/admin/VerifyPaymentModal'
import '../src/index.css'

createRoot(document.getElementById('root')!).render(
  <VerifyPaymentModal
    blnCanVerify={false}
    objInstallment={{ id: 12, amount: 100, amountPaid: 100, dueDate: '2026-09-01', period: 'September 2026', remainingAmount: 0, status: 'paid', transactions: [] }}
    onClose={() => {}}
    onReviewed={() => {}}
    intProjectId={34}
    objTransaction={{ id: 56, amountPaid: 100, bankBranch: 'Test branch', checkDate: null, checkNumber: '', hasProof: true, orNumber: 'OR-56', paymentDate: '2026-09-01', proofMimeType: 'image/png', proofName: 'payment-proof.png', recordedBy: 'Test Staff', remarks: null, reviewedAt: null, reviewedBy: null, status: 'verified', submittedAt: null }}
  />,
)
