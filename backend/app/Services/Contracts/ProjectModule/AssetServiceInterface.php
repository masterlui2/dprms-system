<?php

namespace App\Services\Contracts\ProjectModule;

use App\Models\Asset;
use Illuminate\Database\Eloquent\Collection;

interface AssetServiceInterface{
    public function submit(int $quarterId,array $data):Asset;
    public function getQuarterlyMetrics(int $quarterId):Collection;
    public function update(int $quarterId,array $data):Asset;
}
