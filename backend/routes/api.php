<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\DocumentTypeController;
use App\Http\Controllers\ProposalController;
use App\Http\Controllers\ProposalTemplateController;
use App\Models\DocumentRequirement;
use App\Http\Controllers\GiaProposalController;
use App\Http\Controllers\SetupProposalController;
use App\Http\Controllers\SetupProposalSubmissionController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class,'register']);
Route::post('/login',[AuthController::class,'login']);

Route::middleware('auth:sanctum')->group(function(){
    Route::post('/logout',[AuthController::class,'logout']);
});

Route::middleware('auth:sanctum')->prefix('proposal-templates')->group(function () {

    Route::post('/', [ProposalTemplateController::class, 'uploadTemplate']);
    Route::put('/{template}', [ProposalTemplateController::class, 'updateTemplate']);
    Route::delete('/{id}', [ProposalTemplateController::class, 'deleteTemplate']);
    Route::get('/program/{programType}', [ProposalTemplateController::class, 'getTemplatesByProgram']);
    Route::get('/uploaded-by/{uploadedBy}', [ProposalTemplateController::class, 'getTemplatesByUploaded']);
});

Route::middleware('auth:sanctum')->prefix('proposal')->group(function (){
    Route::post('/setup', [SetupProposalSubmissionController::class, 'store']);
    Route::post('/submit',[ProposalController::class, 'submit']);
    Route::put('/advance-stage/{id}',[ProposalController::class,'advanceStage']);
    Route::put('/{id}/approve',[ProposalController::class,'approve']);
    Route::put('/{id}/disapprove',[ProposalController::class,'disapprove']);
    Route::get('/reference-number/{referenceNumber}',[ProposalController::class, 'getByReferenceNumber']);
    Route::get('/submitter/{userId}',[ProposalController::class, 'getSubmitterProposals']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('document-types', [DocumentTypeController::class, 'index']);

    Route::get('proposals/{proposalId}/documents', [DocumentController::class, 'index']);
    Route::post('documents', [DocumentController::class, 'store']);
    Route::delete('documents/{document}', [DocumentController::class, 'destroy']);
    Route::get('documents/{document}/download', [DocumentController::class, 'show']);
});

Route::middleware('auth:sanctum')->group(function (){
    Route::get('/gia/proposals',[GiaProposalController::class,'getGiaProposalDetials']);
    Route::post('/gia/proposals',[GiaProposalController::class,'createGiaProposal']);
    Route::post('gia/upload-document',[GiaProposalController::class,'uploadDocumnet']);
    Route::post('/gia/author', [GiaProposalController::class,'addCoAuthor']);
    Route::put('/{documentId}/verify-document',[GiaProposalController::class,'verifyDocument']);
});

Route::middleware('auth:sanctum')->group(function(){
    Route::post('/setup/proposals',[SetupProposalController::class, 'createSetupProposal']);
    Route::post('/setup/financials',[SetupProposalController::class, 'uploadFinancialDocument']);
    Route::post('/setup/equipments',[SetupProposalController::class, 'addEquipmentQuotation']);
    Route::put('/setup/{documentId}/financials',[SetupProposalController::class,'verifyFinancialDocuments']);
    Route::get('/setup/proposals',[SetupProposalController::class,'getSetupProposalDetails']);
    Route::get('/setup/financials',[SetupProposalController::class,'getFinancialDocuments']);
    Route::get('/setup/equipments',[SetupProposalController::class,'getEquipmentQuotations']);
});
