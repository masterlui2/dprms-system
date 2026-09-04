<?php

namespace App\Services\ProjectModule;

use App\Models\AssetCapital;
use App\Repositories\Contracts\ProjectModule\AssetCapitalRepositoryInterface;
use App\Services\Contracts\ProjectModule\AssetCapitalServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Override;

class AssetCapitalService implements AssetCapitalServiceInterface{
    public function __construct(protected AssetCapitalRepositoryInterface $assetCapitalRepository)
    {
    }

    #[Override]
    public function submit(int $quarterId, array $data): AssetCapital
    {
       return $this->assetCapitalRepository->create([
            'quarter_id' => $quarterId,
            'name' => $data['name'],
            'amount' => $data['amount'],
       ]);
    }

    #[Override]
    public function getQuarterlyMetrics(int $quarterId): Collection
    {
        return $this->assetCapitalRepository->findByQuarterMetrics($quarterId);
    }

    #[Override]
    public function update(int $id, array $data): AssetCapital
    {
        $updated = $this->assetCapitalRepository->update($id,$data);
        if (! $updated) {
            abort(404,"Not Found");
        }
        return $this->assetCapitalRepository->findById($id);
    }
}
