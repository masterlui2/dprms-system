<?php

namespace App\Services\Contracts\ProjectModule;

use App\Models\Linkage;
use Illuminate\Database\Eloquent\Collection;

interface LinkageServiceInterface{
    public function submit(int $quarterId, array $data):Linkage;
    public function getQuarterlyMetrics(int $quarterId):Collection;
    public function update(int $quarterId, array $data):Linkage;
}
