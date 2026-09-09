<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\ProjectBudget;
use App\Models\ProjectLedger;
use App\Models\Proposal;
use App\Models\RepaymentTransaction;
use App\Models\Role;
use App\Models\SetupProposal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SetupRepaymentLedgerTest extends TestCase
{
    use RefreshDatabase;

    private User $focal;

    private User $director;

    private User $proponent;

    private Role $proponentRole;

    private Project $project;

    private ProjectLedger $paidInstallment;

    private ProjectLedger $overdueInstallment;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow('2026-09-04 10:00:00');
        Storage::fake('local');

        $focalRole = Role::create([
            'name' => 'SETUP Focal',
            'code' => 'FOCAL',
            'program_type' => 'SETUP',
        ]);
        $directorRole = Role::create([
            'name' => 'Provincial Director',
            'code' => 'PROVINCIAL_DIRECTOR',
            'program_type' => 'BOTH',
        ]);
        $this->proponentRole = Role::create([
            'name' => 'MSME Proponent',
            'code' => 'MSME_PROPONENT',
            'program_type' => 'SETUP',
        ]);

        $this->focal = User::factory()->create(['program_type' => 'SETUP']);
        $this->focal->role()->attach($focalRole->id, ['assigned_at' => now()]);
        $this->director = User::factory()->create(['program_type' => 'BOTH']);
        $this->director->role()->attach($directorRole->id, ['assigned_at' => now()]);

        $this->proponent = User::factory()->create(['program_type' => 'SETUP']);
        $this->proponent->role()->attach($this->proponentRole->id, ['assigned_at' => now()]);
        $proposal = Proposal::create([
            'submitted_by' => $this->proponent->id,
            'program_type' => 'SETUP',
            'reference_number' => 'SETUP-LEDGER-001',
            'title' => 'Food Processing Modernization',
            'status' => 'APPROVED',
            'submitted_at' => now()->subMonths(3),
            'approved_at' => now()->subMonths(2),
        ]);
        SetupProposal::create([
            'proposal_id' => $proposal->id,
            'business_name' => 'Mati Food Works',
            'business_type' => 'SOLE-PROPRIETORSHIP',
            'industry_sector' => 'Food Processing',
            'enterprise_size' => 'MICRO',
            'years_in_operation' => 3,
            'business_address' => 'Mati City, Davao Oriental',
            'region' => 'Region XI',
            'province' => 'Davao Oriental',
            'city_municipality' => 'Mati City',
            'form_snapshot' => [
                'contactNumber' => '09171234567',
                'fullRelease' => '15 Jun 2026',
            ],
        ]);
        ProjectBudget::create([
            'proposal_id' => $proposal->id,
            'created_by' => $this->focal->id,
            'program_type' => 'SETUP',
            'total_amount' => 1200,
            'currency' => 'PHP',
            'fiscal_year' => 2026,
            'status' => 'ACTIVE',
        ]);
        $this->project = Project::create([
            'proposal_id' => $proposal->id,
            'created_by' => $this->proponent->id,
            'approved_by' => $this->director->id,
            'program_type' => 'SETUP',
            'status' => 'active',
            'approved_at' => now()->subMonths(2),
        ]);

        $this->paidInstallment = $this->createInstallment('Month 1', '2026-07-15', 'paid');
        $this->overdueInstallment = $this->createInstallment('Month 2', '2026-08-15', 'pending');
        $this->createInstallment('Month 3', '2026-10-15', 'pending');

        RepaymentTransaction::create([
            'project_ledger_id' => $this->paidInstallment->id,
            'uploaded_by' => $this->focal->id,
            'verified_by' => $this->focal->id,
            'amount_paid' => 400,
            'payment_due' => '2026-07-15',
            'bank_branch' => 'DOST Cashier',
            'check_number' => 'CHK-001',
            'check_date' => '2026-07-10',
            'payment_date' => '2026-07-10',
            'or_number' => '100001',
            'status' => 'verified',
            'verified_at' => '2026-07-10 09:00:00',
        ]);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_setup_focal_receives_live_summary_and_installment_statuses(): void
    {
        Sanctum::actingAs($this->focal);

        $this->getJson("/api/setup/projects/{$this->project->id}/ledger")
            ->assertOk()
            ->assertJsonPath('data.project.reference_number', 'SETUP-LEDGER-001')
            ->assertJsonPath('data.project.cooperator', 'Mati Food Works')
            ->assertJsonPath('data.project.contact_number', '09171234567')
            ->assertJsonPath('data.project.full_release', '15 Jun 2026')
            ->assertJsonPath('data.summary.total_project_cost', 1200)
            ->assertJsonPath('data.summary.amount_paid', 400)
            ->assertJsonPath('data.summary.outstanding_balance', 800)
            ->assertJsonPath('data.summary.overdue_installments', 1)
            ->assertJsonPath('data.installments.0.status', 'paid')
            ->assertJsonPath('data.installments.1.status', 'overdue')
            ->assertJsonPath('data.installments.2.status', 'pending')
            ->assertJsonPath('data.permissions.can_record_payment', false)
            ->assertJsonPath('data.permissions.can_verify_payment', true)
            ->assertJsonPath('data.permissions.read_only', false);
    }

    public function test_provincial_director_receives_read_only_ledger_access(): void
    {
        Sanctum::actingAs($this->director);

        $this->getJson('/api/setup/monitoring/projects')->assertOk();

        $this->getJson("/api/setup/projects/{$this->project->id}/ledger")
            ->assertOk()
            ->assertJsonPath('data.permissions.can_record_payment', false)
            ->assertJsonPath('data.permissions.can_verify_payment', false)
            ->assertJsonPath('data.permissions.read_only', true);

        $this->post(
            "/api/setup/projects/{$this->project->id}/ledger/{$this->overdueInstallment->id}/payments",
            $this->paymentPayload('900001'),
            ['Accept' => 'application/json'],
        )->assertForbidden();

        Sanctum::actingAs($this->proponent);
        $submission = $this->post(
            "/api/setup/projects/{$this->project->id}/ledger/{$this->overdueInstallment->id}/payments",
            $this->paymentPayload('900002'),
            ['Accept' => 'application/json'],
        )->assertCreated();
        $transactionId = $submission->json('data.installments.1.transactions.0.id');

        Sanctum::actingAs($this->director);
        $this->patchJson(
            "/api/setup/projects/{$this->project->id}/ledger/{$this->overdueInstallment->id}/payments/{$transactionId}",
            ['decision' => 'verified'],
        )->assertForbidden();
    }

    public function test_gia_focal_cannot_access_a_setup_repayment_ledger(): void
    {
        $giaFocal = User::factory()->create(['program_type' => 'GIA']);
        $giaFocal->role()->attach($this->focal->role()->firstOrFail()->id, ['assigned_at' => now()]);
        Sanctum::actingAs($giaFocal);

        $this->getJson("/api/setup/projects/{$this->project->id}/ledger")->assertForbidden();
    }

    public function test_setup_proponent_can_submit_payment_for_verification(): void
    {
        Sanctum::actingAs($this->proponent);

        $response = $this->post(
            "/api/setup/projects/{$this->project->id}/ledger/{$this->overdueInstallment->id}/payments",
            $this->paymentPayload('100002'),
            ['Accept' => 'application/json'],
        )
            ->assertCreated()
            ->assertJsonPath('data.summary.amount_paid', 400)
            ->assertJsonPath('data.summary.outstanding_balance', 800)
            ->assertJsonPath('data.installments.1.status', 'overdue')
            ->assertJsonPath('data.installments.1.transactions.0.status', 'pending')
            ->assertJsonPath('data.installments.1.transactions.0.bank_branch', 'Land Bank - Mati')
            ->assertJsonPath('data.installments.1.transactions.0.check_number', 'CHK-002')
            ->assertJsonPath('data.installments.1.transactions.0.has_proof', true)
            ->assertJsonPath('data.installments.1.transactions.0.proof_name', 'official-receipt.jpg');

        $transaction = RepaymentTransaction::findOrFail(
            $response->json('data.installments.1.transactions.0.id'),
        );
        Storage::disk('local')->assertExists($transaction->proof_path);

        $this->assertDatabaseHas('repayment_transactions', [
            'project_ledger_id' => $this->overdueInstallment->id,
            'amount_paid' => 400,
            'or_number' => '100002',
            'bank_branch' => 'Land Bank - Mati',
            'check_number' => 'CHK-002',
            'payment_date' => '2026-09-04 00:00:00',
            'status' => 'pending',
            'verified_by' => null,
        ]);
    }

    public function test_setup_focal_cannot_submit_a_payment(): void
    {
        Sanctum::actingAs($this->focal);

        $this->post(
            "/api/setup/projects/{$this->project->id}/ledger/{$this->overdueInstallment->id}/payments",
            $this->paymentPayload('900003'),
            ['Accept' => 'application/json'],
        )->assertForbidden();
    }

    public function test_setup_focal_can_verify_payment_and_mark_installment_paid(): void
    {
        Sanctum::actingAs($this->proponent);

        $submission = $this->post(
            "/api/setup/projects/{$this->project->id}/ledger/{$this->overdueInstallment->id}/payments",
            $this->paymentPayload('100003'),
            ['Accept' => 'application/json'],
        )->assertCreated();
        $transactionId = $submission->json('data.installments.1.transactions.0.id');

        Sanctum::actingAs($this->focal);
        $this->get(
            "/api/setup/projects/{$this->project->id}/ledger/{$this->overdueInstallment->id}/payments/{$transactionId}/proof",
            ['Accept' => 'image/jpeg'],
        )
            ->assertOk()
            ->assertHeader('content-type', 'image/jpeg');

        $this->patchJson(
            "/api/setup/projects/{$this->project->id}/ledger/{$this->overdueInstallment->id}/payments/{$transactionId}",
            ['decision' => 'verified', 'remarks' => 'Matched with the deposit record.'],
        )
            ->assertOk()
            ->assertJsonPath('data.summary.amount_paid', 800)
            ->assertJsonPath('data.summary.outstanding_balance', 400)
            ->assertJsonPath('data.installments.1.status', 'paid')
            ->assertJsonPath('data.installments.1.transactions.0.status', 'verified');

        $this->assertDatabaseHas('repayment_transactions', [
            'id' => $transactionId,
            'status' => 'verified',
            'verified_by' => $this->focal->id,
            'remarks' => 'Matched with the deposit record.',
        ]);
    }

    public function test_rejecting_payment_requires_remarks_and_keeps_balance_unpaid(): void
    {
        Sanctum::actingAs($this->proponent);

        $submission = $this->post(
            "/api/setup/projects/{$this->project->id}/ledger/{$this->overdueInstallment->id}/payments",
            $this->paymentPayload('100004'),
            ['Accept' => 'application/json'],
        )->assertCreated();
        $transactionId = $submission->json('data.installments.1.transactions.0.id');
        $endpoint = "/api/setup/projects/{$this->project->id}/ledger/{$this->overdueInstallment->id}/payments/{$transactionId}";

        Sanctum::actingAs($this->focal);
        $this->patchJson($endpoint, ['decision' => 'rejected'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('remarks');

        $this->patchJson($endpoint, [
            'decision' => 'rejected',
            'remarks' => 'The OR number does not match the payment record.',
        ])
            ->assertOk()
            ->assertJsonPath('data.summary.amount_paid', 400)
            ->assertJsonPath('data.installments.1.status', 'overdue')
            ->assertJsonPath('data.installments.1.transactions.0.status', 'rejected');

        $this->assertDatabaseHas('repayment_transactions', [
            'id' => $transactionId,
            'status' => 'rejected',
            'verified_by' => $this->focal->id,
            'remarks' => 'The OR number does not match the payment record.',
        ]);
    }

    public function test_payment_submission_validates_required_financial_fields(): void
    {
        Sanctum::actingAs($this->proponent);

        $this->postJson(
            "/api/setup/projects/{$this->project->id}/ledger/{$this->overdueInstallment->id}/payments",
            [],
        )
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'amount_paid',
                'or_number',
                'bank_branch',
                'check_number',
                'check_date',
                'payment_date',
                'payment_proof',
            ]);
    }

    public function test_payment_submission_requires_a_numeric_or_number(): void
    {
        Sanctum::actingAs($this->proponent);

        $this->post(
            "/api/setup/projects/{$this->project->id}/ledger/{$this->overdueInstallment->id}/payments",
            $this->paymentPayload('DEV-SETUP-6-PAID'),
            ['Accept' => 'application/json'],
        )
            ->assertUnprocessable()
            ->assertJsonValidationErrors('or_number');
    }

    public function test_payment_cannot_exceed_the_installment_balance(): void
    {
        Sanctum::actingAs($this->proponent);

        $this->post(
            "/api/setup/projects/{$this->project->id}/ledger/{$this->overdueInstallment->id}/payments",
            $this->paymentPayload('100005', 401),
            ['Accept' => 'application/json'],
        )
            ->assertUnprocessable()
            ->assertJsonValidationErrors('amount_paid');
    }

    public function test_setup_proponent_can_list_and_open_only_their_own_repayment_project(): void
    {
        Sanctum::actingAs($this->proponent);

        $this->getJson('/api/setup/repayment/projects')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $this->project->id);

        $this->getJson("/api/setup/projects/{$this->project->id}/ledger")
            ->assertOk()
            ->assertJsonPath('data.permissions.can_record_payment', true)
            ->assertJsonPath('data.permissions.can_verify_payment', false)
            ->assertJsonPath('data.permissions.read_only', false);

        $otherProponent = User::factory()->create(['program_type' => 'SETUP']);
        $otherProponent->role()->attach($this->proponentRole->id, ['assigned_at' => now()]);
        Sanctum::actingAs($otherProponent);

        $this->getJson('/api/setup/repayment/projects')
            ->assertOk()
            ->assertJsonCount(0, 'data');
        $this->getJson("/api/setup/projects/{$this->project->id}/ledger")
            ->assertForbidden();
    }

    public function test_setup_proponent_cannot_verify_a_payment(): void
    {
        Sanctum::actingAs($this->proponent);

        $submission = $this->post(
            "/api/setup/projects/{$this->project->id}/ledger/{$this->overdueInstallment->id}/payments",
            $this->paymentPayload('100006'),
            ['Accept' => 'application/json'],
        )->assertCreated();
        $transactionId = $submission->json('data.installments.1.transactions.0.id');

        $this->patchJson(
            "/api/setup/projects/{$this->project->id}/ledger/{$this->overdueInstallment->id}/payments/{$transactionId}",
            ['decision' => 'verified'],
        )->assertForbidden();
    }

    private function paymentPayload(string $orNumber, float $amount = 400): array
    {
        return [
            'amount_paid' => $amount,
            'or_number' => $orNumber,
            'bank_branch' => 'Land Bank - Mati',
            'check_number' => 'CHK-002',
            'check_date' => '2026-09-03',
            'payment_date' => '2026-09-04',
            'payment_proof' => UploadedFile::fake()->image('official-receipt.jpg'),
        ];
    }

    private function createInstallment(string $period, string $dueDate, string $status): ProjectLedger
    {
        return ProjectLedger::create([
            'project_id' => $this->project->id,
            'program_type' => 'SETUP',
            'ledger_type' => 'repayment',
            'period_label' => $period,
            'amount' => 400,
            'due_date' => $dueDate,
            'status' => $status,
        ]);
    }
}
