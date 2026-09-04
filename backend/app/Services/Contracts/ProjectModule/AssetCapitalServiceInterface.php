<?php

namespace App\Services\Contracts\ProjectModule;

use App\Models\AssetCapital;
use Illuminate\Database\Eloquent\Collection;

interface AssetCapitalServiceInterface{
    public function submit(int $quarterId, array $data):AssetCapital;
    public function getQuarterlyMetrics(int $quarterId):Collection;
    public function update(int $quarterId, array $data):AssetCapital;
}
