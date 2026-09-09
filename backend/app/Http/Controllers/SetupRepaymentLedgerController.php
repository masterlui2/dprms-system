<?php

namespace App\Http\Controllers;

use App\Http\Requests\IndexMySetupRepaymentProjectsRequest;
use App\Http\Requests\ShowSetupRepaymentLedgerRequest;
use App\Http\Requests\StoreSetupRepaymentPaymentRequest;
use App\Http\Requests\VerifySetupRepaymentPaymentRequest;
use App\Models\Project;
use App\Models\ProjectLedger;
use App\Models\RepaymentTransaction;
use App\Services\ProjectModule\SetupRepaymentLedgerService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SetupRepaymentLedgerController extends Controller
{
    public function __construct(private readonly SetupRepaymentLedgerService $service) {}

    public function mine(IndexMySetupRepaymentProjectsRequest $request): JsonResponse
    {
        return response()->json([
            'message' => 'SETUP repayment projects retrieved successfully.',
            'data' => $this->service->getProjectsForProponent($request->user()),
        ]);
    }

    public function show(ShowSetupRepaymentLedgerRequest $request, Project $project): JsonResponse
    {
        return response()->json([
            'message' => 'SETUP repayment ledger retrieved successfully.',
            'data' => $this->service->getLedger($request->user(), $project),
        ]);
    }

    public function storePayment(
        StoreSetupRepaymentPaymentRequest $request,
        Project $project,
        ProjectLedger $ledger,
    ): JsonResponse {
        return response()->json([
            'message' => 'Payment submitted for verification.',
            'data' => $this->service->submitPayment(
                $request->user(),
                $project,
                $ledger,
                $request->validated(),
            ),
        ], 201);
    }

    public function verifyPayment(
        VerifySetupRepaymentPaymentRequest $request,
        Project $project,
        ProjectLedger $ledger,
        RepaymentTransaction $transaction,
    ): JsonResponse {
        return response()->json([
            'message' => $request->validated('decision') === 'verified'
                ? 'Payment verified successfully.'
                : 'Payment rejected successfully.',
            'data' => $this->service->verifyPayment(
                $request->user(),
                $project,
                $ledger,
                $transaction,
                $request->validated(),
            ),
        ]);
    }

    public function showPaymentProof(
        ShowSetupRepaymentLedgerRequest $request,
        Project $project,
        ProjectLedger $ledger,
        RepaymentTransaction $transaction,
    ): StreamedResponse {
        return $this->service->getPaymentProof(
            $request->user(),
            $project,
            $ledger,
            $transaction,
        );
    }
}
