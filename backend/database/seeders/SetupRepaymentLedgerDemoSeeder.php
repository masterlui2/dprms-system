<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\ProjectBudget;
use App\Models\ProjectLedger;
use App\Models\RepaymentTransaction;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class SetupRepaymentLedgerDemoSeeder extends Seeder
{
    private const INSTALLMENT_COUNT = 12;

    private const DEMO_TOTAL_AMOUNT = 120000;

    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            $this->command?->warn('SETUP repayment demo data was skipped outside local/testing.');

            return;
        }

        $project = Project::query()
            ->where('program_type', 'SETUP')
            ->where('status', 'active')
            ->with('proposal')
            ->orderBy('id')
            ->first();

        if (! $project?->proposal) {
            $this->command?->warn('No active SETUP project is available for repayment demo data.');

            return;
        }

        $focal = User::query()
            ->where('program_type', 'SETUP')
            ->whereHas('role', fn ($query) => $query->whereIn('code', [
                'FOCAL',
                'SSCP_FOCAL',
                'SETUP_FOCAL',
            ]))
            ->first();
        $recordedBy = $focal?->id ?? $project->created_by;

        DB::transaction(function () use ($project, $recordedBy) {
            $budget = ProjectBudget::query()->firstOrCreate(
                ['proposal_id' => $project->proposal_id],
                [
                    'created_by' => $recordedBy,
                    'program_type' => 'SETUP',
                    'total_amount' => self::DEMO_TOTAL_AMOUNT,
                    'currency' => 'PHP',
                    'fiscal_year' => today()->year,
                    'budget_ceiling' => self::DEMO_TOTAL_AMOUNT,
                    'status' => 'ACTIVE',
                    'notes' => 'Local development repayment demo.',
                ],
            );

            $totalAmount = max(0, (float) $budget->total_amount);
            if ($totalAmount === 0.0) {
                $totalAmount = self::DEMO_TOTAL_AMOUNT;
                $budget->update(['total_amount' => $totalAmount]);
            }

            $totalCents = (int) round($totalAmount * 100);
            $baseInstallmentCents = intdiv($totalCents, self::INSTALLMENT_COUNT);
            $firstDueDate = today()->startOfMonth()->subMonths(2)->day(15);
            $installments = collect();

            for ($index = 0; $index < self::INSTALLMENT_COUNT; $index++) {
                $amountCents = $index === self::INSTALLMENT_COUNT - 1
                    ? $totalCents - ($baseInstallmentCents * (self::INSTALLMENT_COUNT - 1))
                    : $baseInstallmentCents;
                $dueDate = $firstDueDate->copy()->addMonths($index);

                $installments->push(ProjectLedger::query()->updateOrCreate(
                    [
                        'project_id' => $project->id,
                        'program_type' => 'SETUP',
                        'ledger_type' => 'repayment',
                        'period_label' => sprintf('Month %02d', $index + 1),
                    ],
                    [
                        'amount' => $amountCents / 100,
                        'due_date' => $dueDate,
                        'status' => $index === 0
                            ? 'paid'
                            : ($dueDate->isBefore(today()) ? 'overdue' : 'pending'),
                        'notes' => 'Local development installment.',
                    ],
                ));
            }

            $this->createVerifiedExample(
                $installments->get(0),
                $recordedBy,
                $project->id,
            );
            $this->createPendingExample(
                $installments->get(3),
                $recordedBy,
                $project->id,
            );
        });

        $this->command?->info(
            "Created 12 SETUP repayment installments for project #{$project->id}.",
        );
    }

    private function createVerifiedExample(
        ProjectLedger $ledger,
        int $recordedBy,
        int $projectId,
    ): void {
        $paymentDate = Carbon::parse($ledger->due_date)->subDays(2);
        $orNumber = $this->demoOrNumber($projectId, 1);

        RepaymentTransaction::query()
            ->where('or_number', "DEV-SETUP-{$projectId}-PAID")
            ->update(['or_number' => $orNumber]);

        RepaymentTransaction::query()->firstOrCreate(
            ['or_number' => $orNumber],
            [
                'project_ledger_id' => $ledger->id,
                'uploaded_by' => $recordedBy,
                'verified_by' => $recordedBy,
                'amount_paid' => $ledger->amount,
                'payment_due' => $ledger->due_date,
                'bank_branch' => 'Land Bank - DOST Provincial Office',
                'check_number' => "DEV-CHK-{$projectId}-001",
                'check_date' => $paymentDate,
                'payment_date' => $paymentDate,
                'status' => 'verified',
                'verified_at' => $paymentDate,
                'remarks' => 'Verified development payment.',
            ],
        );
    }

    private function createPendingExample(
        ProjectLedger $ledger,
        int $recordedBy,
        int $projectId,
    ): void {
        $paymentDate = today();
        $orNumber = $this->demoOrNumber($projectId, 2);

        RepaymentTransaction::query()
            ->where('or_number', "DEV-SETUP-{$projectId}-REVIEW")
            ->update(['or_number' => $orNumber]);

        $transaction = RepaymentTransaction::query()->firstOrCreate(
            ['or_number' => $orNumber],
            [
                'project_ledger_id' => $ledger->id,
                'uploaded_by' => $recordedBy,
                'verified_by' => null,
                'amount_paid' => $ledger->amount,
                'payment_due' => $ledger->due_date,
                'bank_branch' => 'Development Bank - Mati Branch',
                'check_number' => "DEV-CHK-{$projectId}-002",
                'check_date' => $paymentDate,
                'payment_date' => $paymentDate,
                'status' => 'pending',
            ],
        );

        $proofPath = "repayment-proofs/{$projectId}/demo-official-receipt.svg";
        Storage::disk('local')->put($proofPath, $this->demoReceipt($orNumber, $ledger));

        $transaction->update([
            'proof_path' => $proofPath,
            'proof_original_name' => 'demo-official-receipt.svg',
            'proof_mime_type' => 'image/svg+xml',
        ]);
    }

    private function demoOrNumber(int $projectId, int $sequence): string
    {
        return sprintf('%d%06d%02d', today()->year, $projectId, $sequence);
    }

    private function demoReceipt(string $orNumber, ProjectLedger $ledger): string
    {
        $amount = number_format((float) $ledger->amount, 2);

        return <<<SVG
            <svg xmlns="http://www.w3.org/2000/svg" width="700" height="900" viewBox="0 0 700 900">
              <rect width="700" height="900" fill="#f8fafc"/>
              <rect x="45" y="45" width="610" height="810" rx="18" fill="#ffffff" stroke="#cbd5e1" stroke-width="3"/>
              <text x="350" y="120" text-anchor="middle" font-family="Arial, sans-serif" font-size="23" font-weight="700" fill="#073b82">DOST SETUP</text>
              <text x="350" y="158" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#0f172a">OFFICIAL RECEIPT</text>
              <line x1="85" y1="195" x2="615" y2="195" stroke="#dbe5f0" stroke-width="2"/>
              <text x="90" y="255" font-family="Arial, sans-serif" font-size="18" fill="#64748b">OR NUMBER</text>
              <text x="90" y="292" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#0f172a">{$orNumber}</text>
              <text x="90" y="365" font-family="Arial, sans-serif" font-size="18" fill="#64748b">AMOUNT PAID</text>
              <text x="90" y="415" font-family="Arial, sans-serif" font-size="42" font-weight="700" fill="#073b82">PHP {$amount}</text>
              <text x="90" y="500" font-family="Arial, sans-serif" font-size="18" fill="#64748b">BANK</text>
              <text x="90" y="535" font-family="Arial, sans-serif" font-size="22" font-weight="600" fill="#0f172a">Development Bank - Mati Branch</text>
              <text x="90" y="610" font-family="Arial, sans-serif" font-size="18" fill="#64748b">PAYMENT FOR</text>
              <text x="90" y="645" font-family="Arial, sans-serif" font-size="22" font-weight="600" fill="#0f172a">{$ledger->period_label}</text>
              <line x1="85" y1="710" x2="615" y2="710" stroke="#dbe5f0" stroke-width="2"/>
              <text x="350" y="765" text-anchor="middle" font-family="Arial, sans-serif" font-size="17" fill="#64748b">Development preview only</text>
            </svg>
            SVG;
    }
}
