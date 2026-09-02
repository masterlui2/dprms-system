<?php

namespace App\Services\Contracts\ProjectModule;

use App\Models\Employee;
use Illuminate\Database\Eloquent\Collection;

interface EmployeeServiceInterface{
    public function submit(int $quarterId,array $data): Employee;
    public function getByQuarterlyMetricsId(int $quarterId): Collection;
    public function update(int $id, array $data): Employee;
}
