<?php

namespace App\Services\Contracts\ProjectModule;

use App\Models\Output;
use Illuminate\Database\Eloquent\Collection;

interface OutputServiceInterface{
    public function submit(int $summaryId, array $data):Output;
    public function getSummary(int $summaryId):Collection;
    public function update(int $summaryId, array $data):Output;
    public function batch(int $summaryId, array $creates, array $updates, array $deletes):Collection;
}
