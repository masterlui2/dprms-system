<?php

namespace App\Services\Contracts\ProposalModule;

use App\Models\DocumentRequirement;
use Illuminate\Database\Eloquent\Collection;

interface DocumentRequirementServiceInterface{
    public function getRequirementsByProgram(string $programType): Collection;
    public function createRequirement(array $data): DocumentRequirement;
    public function updateRequirement(int $id, array $data): DocumentRequirement;
    public function deleteRequirement(int $id);
}
