<?php

namespace App\Services\ProjectModule;

use App\Models\Market;
use App\Repositories\Contracts\ProjectModule\MarketRepositoryInterface;
use App\Services\Contracts\ProjectModule\MarketServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Override;

class MarketService implements MarketServiceInterface{
    public function __construct(protected MarketRepositoryInterface $marketRepository)
    {
    }

    #[Override]
    public function submit(int $quarterId, array $data): Market
    {
        return $this->marketRepository->create([
            'quarter_id' => $quarterId,
            'market_name' => $data['market_name'],
            'address' => $data['address'],
            'condition' => $data['condition'],
            'effective_date' => $data['effective_date'],
            'contact_person' => $data['contact_person'],
            'service' => $data['service'],
            'volume' => $data['volume'],
        ]);
    }

    #[Override]
    public function getQuarterlyMetrics(int $quarterId): Collection
    {
        return $this->marketRepository->findByQuarterMetrics($quarterId);
    }

    #[Override]
    public function update(int $id, array $data): Market
    {
        $updated = $this->marketRepository->update($id,$data);
        if (! $updated) {
            abort(404,"Not Found");
        }
        return $this->marketRepository->findById($id);
    }
}
