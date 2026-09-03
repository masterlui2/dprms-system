<?php

namespace App\Services\ProjectModule;

use App\Models\Employee;
use App\Repositories\Contracts\ProjectModule\EmployeeRepositoryInterface;
use App\Services\Contracts\ProjectModule\EmployeeServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Override;

class EmployeeService implements EmployeeServiceInterface{
    public function __construct(protected EmployeeRepositoryInterface $employeeRepository)
    {
    }

    #[Override]
    public function submit(int $quarterId,array $data): Employee
    {
        return $this->employeeRepository->create([
            'quarter_id' => $quarterId,
            'employee_name' => $data['employee_name'],
            'age' => $data['age'],
            'status' => $data['status'],
            'gender' => $data['gender'],
            'sectoral_group' => $data['sectoral_group'],
            'days_of_attendance' => $data['days_of_attendance'],
            'salary_rate' => $data['salary_rate'],
        ]);
    }

    #[Override]
    public function getByQuarterlyMetricsId(int $quarterId): Collection
    {
        return $this->employeeRepository->findByQuarterMetrics($quarterId);
    }

    #[Override]
    public function update(int $id, array $data): Employee
    {
        $updated = $this->employeeRepository->update($id,$data);
        if (! $updated) {
            abort(404,"Not Found");
        }
        return $this->employeeRepository->findById($id);
    }
}
