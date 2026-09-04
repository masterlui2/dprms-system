<?php

namespace App\Services\ProjectModule;

use App\Models\Narrative;
use App\Repositories\Contracts\ProjectModule\NarrativeRepositoryInterface;
use App\Services\Contracts\ProjectModule\NarrativeServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Override;

class NarrativeService implements NarrativeServiceInterface{
    public function __construct(protected NarrativeRepositoryInterface $narrativeRepository)
    {
    }

    #[Override]
    public function submit(int $quarterId, array $data): Narrative
    {
        return $this->narrativeRepository->create([
            'quarter_id' => $quarterId,
            'particular' => $data['particular'],
            'type' => $data['type'],
            'intervention' => $data['intervention'],
        ]);
    }

    #[Override]
    public function getQuarterlyMetrics(int $quarterId): Collection
    {
        return $this->narrativeRepository->findByQuarterMetrics($quarterId);
    }

    #[Override]
    public function update(int $id, array $data): Narrative
    {
        $updated = $this->narrativeRepository->update($id,$data);
        if (! $updated) {
            abort(404,"Not Found");
        }
        return $this->narrativeRepository->findById($id);
    }
}
