<?php

namespace App\Services\Contracts\ProjectModule;

use App\Models\Action;
use Illuminate\Database\Eloquent\Collection;

interface ActionServiceInterface{
    public function submit(int $summaryId, array $data):Action;
    public function getSummary(int $summaryId):Collection;
    public function update(int $summaryId, array $data):Action;
    public function batch(int $summaryId, array $creates, array $updates, array $deletes):Collection;
}
