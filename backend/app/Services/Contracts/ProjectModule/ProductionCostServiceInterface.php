<?php

namespace App\Services\Contracts\ProjectModule;

use App\Models\ProductCost;
use Illuminate\Database\Eloquent\Collection;

interface ProductionCostServiceInterface{
    public function submit(int $quarterId,array $data): ProductCost;
    public function getByQuarterlyMetricsId(int $quarterId): Collection;
    public function update(int $id, array $data): ProductCost;
}
