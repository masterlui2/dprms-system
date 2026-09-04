<?php

namespace App\Services\ProjectModule;

use App\Models\Intervention;
use App\Repositories\Contracts\ProjectModule\InterventionRepositoryInterface;
use App\Services\Contracts\ProjectModule\InterventionServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Override;

class InterventionService implements InterventionServiceInterface{
    public function __construct(protected InterventionRepositoryInterface $interventionRepository)
    {
    }

    #[Override]
    public function submit(int $quarterId, array $data): Intervention
    {
        return $this->interventionRepository->create([
            'quarter_id' => $quarterId,
            'name' => $data['name'],
            'type' => $data['type'],
            'availed' => $data['availed'],
            'intervention' => $data['intervention'],
            'date' => $data['date'],
        ]);
    }

    #[Override]
    public function getQuarterlyMetrics(int $quarterId): Collection
    {
        return $this->interventionRepository->findByQuarterMetrics($quarterId);
    }

    #[Override]
    public function update(int $id, array $data): Intervention
    {
        $updated = $this->interventionRepository->update($id,$data);
        if (! $updated) {
            abort(404,"Not Found");
        }
        return $this->interventionRepository->findById($id);
    }
}
