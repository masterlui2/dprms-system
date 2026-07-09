<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProposalTemplateRequest;
use App\Http\Requests\UpdateProposalTemplateRequest;
use App\Models\ProposalTemplate;
use App\Services\Contracts\ProposalModule\ProposalTemplateServiceInterface;
use Illuminate\Http\Request;

class ProposalTemplateController extends Controller
{
    public function __construct(protected ProposalTemplateServiceInterface $proposalTemplateService)
    {
    }

    public function uploadTemplate(StoreProposalTemplateRequest $request){
        $template = $this->proposalTemplateService->uploadTemplate($request->validated());

        return response()->json([
            'message' => 'template uploaded',
            'data' => $template,
        ],201);
    }

    public function updateTemplate(UpdateProposalTemplateRequest $request,ProposalTemplate $template){
        $updated = $this->proposalTemplateService->updateTemplate($template->id,$request->validated());

        return response()->json([
            'message' => 'template updated',
            'data' => $updated,
        ],200);
    }

    public function deleteTemplate(int $id){
        $this->proposalTemplateService->deleteTemplate($id);
        return response()->json([
            'message' => 'template deleted',
        ],200);
    }

    public function getTemplatesByProgram(string $programType){
        $templates = $this->proposalTemplateService->getTemplatesByProgram($programType);
        return response()->json([
            'data' => $templates
        ], 200);
    }
    public function getTemplatesByUploaded(int $userId){
        $templates = $this->proposalTemplateService->getTemplatesByUploaded($userId);
        return response()->json([
            'data' => $templates,
        ],200);
    }


}
