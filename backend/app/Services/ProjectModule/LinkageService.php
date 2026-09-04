<?php

namespace App\Services\ProjectModule;

use App\Models\Linkage;
use App\Repositories\Contracts\ProjectModule\LinkageRepositoryInterface;
use App\Services\Contracts\ProjectModule\LinkageServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Override;

class LinkageService implements LinkageServiceInterface{
    public function __construct(protected LinkageRepositoryInterface $linkageRepository)
    {
    }

    #[Override]
    public function submit(int $quarterId, array $data): Linkage
    {
        return $this->linkageRepository->create([
            'quarter_id' => $quarterId,
            'name' => $data['name'],
            'type' => $data['type'],
            'male_quantity' => $data['male_quantity'],
            'female_quantity' => $data['female_quantity'],
        ]);
    }

    #[Override]
    public function getQuarterlyMetrics(int $quarterId): Collection
    {
        return $this->linkageRepository->findByQuarterMetrics($quarterId);
    }

    #[Override]
    public function update(int $id, array $data): Linkage
    {
        $updated = $this->linkageRepository->update($id,$data);
        if (! $updated) {
            abort(404,"Not Found");
        }
        return $this->linkageRepository->findById($id);
    }
}
