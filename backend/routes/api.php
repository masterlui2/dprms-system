<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\DocumentTypeController;
use App\Http\Controllers\GiaProposalController;
use App\Http\Controllers\GiaProposalSubmissionController;
use App\Http\Controllers\ProposalController;
use App\Http\Controllers\ProposalTemplateController;
use App\Http\Controllers\ProposalAuditController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\SetupProposalController;

use App\Http\Controllers\SetupProposalSubmissionController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
});

Route::middleware('auth:sanctum')->prefix('proposal-templates')->group(function () {

    Route::post('/', [ProposalTemplateController::class, 'uploadTemplate']);
    Route::put('/{template}', [ProposalTemplateController::class, 'updateTemplate']);
    Route::delete('/{id}', [ProposalTemplateController::class, 'deleteTemplate']);
    Route::get('/program/{programType}', [ProposalTemplateController::class, 'getTemplatesByProgram']);
    Route::get('/uploaded-by/{uploadedBy}', [ProposalTemplateController::class, 'getTemplatesByUploaded']);
});

Route::middleware('auth:sanctum')->prefix('proposal')->group(function () {
    Route::post('/setup', [SetupProposalSubmissionController::class, 'store']);
    Route::post('/gia', [GiaProposalSubmissionController::class, 'store']);
    Route::post('/submit', [ProposalController::class, 'submit']);
    Route::put('/advance-stage/{id}', [ProposalController::class, 'advanceStage'])
        ->middleware('role:PROJECT_STAFF,FOCAL');
    Route::put('/{id}/approve', [ProposalController::class, 'approve'])
        ->middleware('role:PROVINCIAL_DIRECTOR');
    Route::put('/{id}/disapprove', [ProposalController::class, 'disapprove'])
        ->middleware('role:PROVINCIAL_DIRECTOR');
    Route::get('/reference-number/{referenceNumber}', [ProposalController::class, 'getByReferenceNumber']);
    Route::get('/submitter/{userId}', [ProposalController::class, 'getSubmitterProposals']);
    Route::put('/{proposal}/resubmit', [ProposalController::class, 'resubmit']);
    Route::put('/{proposal}/return-for-revision', [ProposalController::class, 'returnForRevision'])
        ->middleware('role:FOCAL');
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('document-types', [DocumentTypeController::class, 'index']);
    Route::post('documents', [DocumentController::class, 'store']);
    Route::delete('documents/{document}', [DocumentController::class, 'destroy']);
    Route::get('documents/{document}/download', [DocumentController::class, 'show']);
    Route::get('documents/{proposalId}/', [DocumentController::class, 'indexForOwner']);
    Route::get('documents/{documentId}/view', [DocumentController::class, 'showForOwner']);
});

Route::middleware(['auth:sanctum', 'role:PROJECT_STAFF,FOCAL,PROVINCIAL_DIRECTOR'])->prefix('documents')->group(function () {
    Route::get('/{proposalId}/proposal-documents', [DocumentController::class, 'index']);
    Route::get('/{documentId}/view-staff', [DocumentController::class, 'showForStaff']);
    Route::patch('/{document}/review', [DocumentController::class, 'review'])
        ->middleware('role:FOCAL');
    Route::get('/{proposalId}/forms', [DocumentController::class, 'showForm']);
});

Route::middleware(['auth:sanctum', 'role:PROJECT_STAFF,FOCAL,PROVINCIAL_DIRECTOR'])->prefix('proposal')->group(function () {
    Route::get('/', [ProposalController::class, 'index']);
    Route::patch('/{proposalId}/assign-staff',[ProposalController::class,'assignProjectStaff']);
    Route::patch('/{proposalId}/assign-officer', [ProposalController::class, 'assignOfficer']);
    Route::patch('/{proposalId}/update',[ProposalController::class, 'update']);
    Route::post('/{proposalId}/reviews/decision', [ProposalController::class, 'reviewDecision']);
});

Route::middleware(['auth:sanctum', 'role:PROJECT_STAFF,FOCAL,PROVINCIAL_DIRECTOR'])->group(function () {
    Route::post('v1/proposals/{proposalId}/reviews/decision', [ProposalController::class, 'reviewDecision']);
    Route::patch('v1/proposals/{proposalId}/assign-officer', [ProposalController::class, 'assignOfficer']);
    Route::get('v1/proposals/{proposalId}/reviews', [ProposalAuditController::class, 'index']);
    Route::get('v1/proposals/{proposalId}/review-logs', [ProposalAuditController::class, 'index']);
    Route::get('v1/projects', [ProjectController::class, 'index']);
    Route::post('proposals/{proposalId}/reviews/decision', [ProposalController::class, 'reviewDecision']);
    Route::patch('proposals/{proposalId}/assign-officer', [ProposalController::class, 'assignOfficer']);
    Route::get('proposals/{proposalId}/reviews', [ProposalAuditController::class, 'index']);
    Route::get('projects', [ProjectController::class, 'index']);
});



Route::middleware(['auth:sanctum','role:PROJECT_STAFF,FOCAL,PROVINCIAL_DIRECTOR'])->prefix('proposal-audit')->group(function (){
    Route::get('/{proposalId}/list',[ProposalAuditController::class,'index']);
});


Route::middleware('auth:sanctum')->prefix('gia')->group(function () {
    Route::get('/gia/proposals', [GiaProposalController::class, 'getGiaProposalDetials']);
    Route::post('/gia/proposals', [GiaProposalController::class, 'createGiaProposal']);
    Route::post('gia/upload-document', [GiaProposalController::class, 'uploadDocumnet']);
    Route::post('/gia/author', [GiaProposalController::class, 'addCoAuthor']);
    Route::put('/{documentId}/verify-document', [GiaProposalController::class, 'verifyDocument']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/setup/proposals', [SetupProposalController::class, 'createSetupProposal']);
    Route::post('/setup/financials', [SetupProposalController::class, 'uploadFinancialDocument']);
    Route::post('/setup/equipments', [SetupProposalController::class, 'addEquipmentQuotation']);
    Route::put('/setup/{documentId}/financials', [SetupProposalController::class, 'verifyFinancialDocuments']);
    Route::get('/setup/proposals', [SetupProposalController::class, 'getSetupProposalDetails']);
    Route::get('/setup/financials', [SetupProposalController::class, 'getFinancialDocuments']);
    Route::get('/setup/equipments',[SetupProposalController::class, 'getEquipmentQuotations']);
});
