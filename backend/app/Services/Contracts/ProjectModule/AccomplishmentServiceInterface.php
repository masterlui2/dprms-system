<?php

namespace App\Services\Contracts\ProjectModule;

use App\Models\Accomplishment;
use Illuminate\Database\Eloquent\Collection;

interface AccomplishmentServiceInterface{
    public function submit(int $summaryId, array $data):Accomplishment;
    public function getSummary(int $summaryId):Collection;
    public function update(int $summaryId, array $data):Accomplishment;
    public function batch(int $summaryId, array $creates, array $updates, array $deletes):Collection;
}
