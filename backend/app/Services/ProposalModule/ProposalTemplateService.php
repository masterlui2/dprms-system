<?php

namespace App\Services\ProposalModule;

use App\Models\ProposalTemplate;
use App\Repositories\Contracts\ProposalModule\ProposalTemplateRepositoryInterface;
use App\Services\Contracts\ProposalModule\ProposalTemplateServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Override;

class ProposalTemplateService implements ProposalTemplateServiceInterface{
    public function __construct(protected ProposalTemplateRepositoryInterface $proposalTemplateRepository)
    {
    }

    #[Override]
    public function updateTemplate(int $id, array $data): ProposalTemplate
    {
        $template = $this->proposalTemplateRepository->findById($id);

        if(! $template){
            abort(404,"Template not Found");
        }

        $template->update($data);

        return $template->fresh();
    }

    #[Override]
    public function uploadTemplate(array $data): ProposalTemplate
    {
        return $this->proposalTemplateRepository->create($data);
    }

    #[Override]
    public function getTemplatesByProgram(string $programType): Collection
    {
        return $this->proposalTemplateRepository->findByProgramType($programType);
    }

    #[Override]
    public function deleteTemplate(int $id)
    {
        return $this->proposalTemplateRepository->delete($id);
    }

    #[Override]
    public function getTemplatesByUploaded(int $uploadedBy): Collection
    {
        return $this->proposalTemplateRepository->findByUploader($uploadedBy);
    }
}
