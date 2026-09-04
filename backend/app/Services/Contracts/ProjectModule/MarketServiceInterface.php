<?php

namespace App\Services\Contracts\ProjectModule;

use App\Models\Market;
use Illuminate\Database\Eloquent\Collection;

interface MarketServiceInterface{
    public function submit(int $quarterId,array $data):Market;
    public function getQuarterlyMetrics(int $quarterId):Collection;
    public function update(int $quarterId, array $data):Market;
}
