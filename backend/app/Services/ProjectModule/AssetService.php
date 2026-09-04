<?php

namespace App\Services\ProjectModule;

use App\Models\Asset;
use App\Repositories\Contracts\ProjectModule\AssetRepositoryInterface;
use App\Services\Contracts\ProjectModule\AssetServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Override;

class AssetService implements AssetServiceInterface{
    public function __construct(protected AssetRepositoryInterface $assetRepository)
    {
    }

    #[Override]
    public function submit(int $quarterId, array $data): Asset
    {
        return $this->assetRepository->create([
            'quarter_id' => $quarterId,
            'asset_name' => $data['asset_name'],
            'type' => $data['type'],
            'lifespan' => $data['lifespan'],
            'year_acquired' => $data['year_acquired'],
            'cost' => $data['cost'],
        ]);
    }

    #[Override]
    public function getQuarterlyMetrics(int $quarterId): Collection
    {
        return $this->assetRepository->findByQuarterMetrics($quarterId);
    }

    #[Override]
    public function update(int $id, array $data): Asset
    {
        $updated = $this->assetRepository->update($id,$data);
        if (! $updated) {
            abort(404,"Not Found");
        }
        return $this->assetRepository->findById($id);
    }
}
