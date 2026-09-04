<?php

namespace App\Services\Contracts\ProjectModule;

use App\Models\ProductionMaterial;
use Illuminate\Database\Eloquent\Collection;

interface ProductionMaterialsServiceInterface{
    public function submit(int $quarterId, array $data):ProductionMaterial;
    public function getQuarterlyMetrics(int $quarterId):Collection;
    public function update(int $quarterId, array $data):ProductionMaterial;
}
