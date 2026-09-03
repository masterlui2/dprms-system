<?php

namespace App\Repositories\ProjectModule;

use App\Models\Employee;
use App\Repositories\BaseRepository;
use App\Repositories\Contracts\ProjectModule\EmployeeRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Override;

class EmployeeRepository extends BaseRepository implements EmployeeRepositoryInterface{
    #[Override]
    public function __construct(Employee $model)
    {
        parent::__construct($model);
    }

    #[Override]
    public function findByQuarterMetrics(int $quarterId): Collection
    {
        return $this->model->newQuery()->where('quarter_id',$quarterId)->get();
    }

    #[Override]
    public function update(int $id, array $data): bool
    {
        $employee = $this->model->newQuery()->find($id);
        if(! $employee){
            return false;
        }

        $employee->fill($data);
        return $employee->save();
    }
}
