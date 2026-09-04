<?php

namespace App\Services\Contracts\ProjectModule;

use App\Models\Intervention;
use Illuminate\Database\Eloquent\Collection;

interface InterventionServiceInterface{
    public function submit(int $quarterId, array $data):Intervention;
    public function getQuarterlyMetrics(int $quarterId):Collection;
    public function update(int $quarterId, array $data):Intervention;
}
