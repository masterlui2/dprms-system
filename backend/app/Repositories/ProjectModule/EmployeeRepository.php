<?php

namespace App\Repositories\ProjectModule;

use App\Models\Employee;
use App\Repositories\BaseRepository;
use App\Repositories\Contracts\ProjectModule\EmployeeRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Override;

class EmployeeRepository extends BaseRepository implements EmployeeRepositoryInterface{
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

    #[Override]
    public function createMany(array $rows): Collection
    {
        return Collection::make($rows)->map(function (array $rows){
            return $this->model->newQuery()->create($rows);
        });
    }

    #[Override]
    public function updateMany(int $quarterId, array $rows): Collection
    {
        return Collection::make($rows)->map(function (array $rows) use ($quarterId) {
            $id = $rows['id'];
            $employee =  $this->model->newQuery()->where('quarter_id',$quarterId)->find($id);
            if (! $employee){
                abort(404,"Not Found");
            }

            $employee->fill(collect($rows)->except('id')->toArray());
            $employee->save();
            return $employee;
        });
    }

    #[Override]
    public function deleteMany(int $quarterId, array $rows): int
    {
        return $this->model->newQuery()->where('quarter_id',$quarterId)->whereIn('id',$rows)->delete();
    }
}
