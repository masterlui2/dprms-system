<?php

namespace App\Observers;

use App\Models\Employee;

class EmployeeObserver
{
    public function saved(Employee $employee): void{
        $employee->quarter()->update([
            'employee_count' => $employee->quarter->employees()->count(),
        ]);
    }

    public function deleted(Employee $employee): void{
        $this->saved($employee);
    }
}
