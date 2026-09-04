<?php

namespace App\Services\Contracts\ProjectModule;

use App\Models\Narrative;
use Illuminate\Database\Eloquent\Collection;

interface NarrativeServiceInterface{
    public function submit(int $quarterId, array $data):Narrative;
    public function getQuarterlyMetrics(int $quarterId):Collection;
    public function update(int $quarterId, array $data):Narrative;
}
