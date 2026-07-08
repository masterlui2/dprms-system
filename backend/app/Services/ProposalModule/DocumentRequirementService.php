<?php

namespace App\Services\ProposalModule;

use App\Models\DocumentRequirement;
use App\Repositories\Contracts\ProposalModule\DocumentRequirementRepositoryInterface;
use App\Services\Contracts\ProposalModule\DocumentRequirementServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Override;

class DocumentRequirementService implements DocumentRequirementServiceInterface{
    public function __construct(protected DocumentRequirementRepositoryInterface $documentRequirementRepository)
    {
    }

    #[Override]
    public function getRequirementsByProgram(string $programType): Collection
    {
        return $this->documentRequirementRepository->findByProgramType($programType);
    }

    #[Override]
    public function createRequirement(array $data): DocumentRequirement
    {
        return $this->documentRequirementRepository->create($data);
    }

    #[Override]
    public function updateRequirement(int $id, array $data): DocumentRequirement
    {
        $requirement = $this->documentRequirementRepository->findById($id);

        if(! $requirement){
            abort(404,'Requirement not Found');
        }

        $requirement->update($data);
        return $requirement->fresh();
    }

    #[Override]
    public function deleteRequirement(int $id)
    {
        return $this->documentRequirementRepository->delete($id);
    }
}
