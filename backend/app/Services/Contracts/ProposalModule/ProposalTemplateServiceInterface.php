<?php

namespace App\Services\Contracts\ProposalModule;

use App\Models\ProposalTemplate;
use Illuminate\Database\Eloquent\Collection;

interface ProposalTemplateServiceInterface{
    public function uploadTemplate(array $data): ProposalTemplate;
    public function updateTemplate(int $id,array $data): ProposalTemplate;
    public function deleteTemplate(int $id);
    public function getTemplatesByProgram(string $programType): Collection;
    public function getTemplatesByUploaded(int $uploadedBy): Collection;
}
