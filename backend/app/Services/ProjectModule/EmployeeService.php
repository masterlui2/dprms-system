<?php

namespace App\Services\ProjectModule;

use App\Models\Employee;
use App\Repositories\Contracts\ProjectModule\EmployeeRepositoryInterface;
use App\Services\Contracts\ProjectModule\EmployeeServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
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

    #[Override]
    public function batch(int $quarterId, array $creates, array $updates, array $deletes): Collection
    {
        return DB::transaction(function () use ($quarterId,$creates,$updates,$deletes):Collection{
            $createdRows = Collection::make($creates)->map(fn(array $item) => [
                'quarter_id' => $quarterId,
                'employee_name' => $item['employee_name'],
                'age' => $item['age'],
                'status' => $item['status'],
                'gender' => $item['gender'],
                'sectoral_group' => $item['sectoral_group'],
                'days_of_attendance' => $item['days_of_attendance'],
                'salary_rate' => $item['salary_rate'],
            ])->all();

            $created = $this->employeeRepository->createMany($createdRows);

            foreach($created as $i => $model){
                if(isset($creates[$i]['temp_id'])){
                    $model->setAttribute('temp_id',$creates[$i]['temp_id']);
                }
            }

            $updated = empty($updates) ? Collection::make() : $this->employeeRepository->updateMany($quarterId,$updates);

            if(! empty($deletes)){
                $this->employeeRepository->deleteMany($quarterId,$deletes);
            }

            return Collection::make($created->concat($updated)->values());
        });
    }
}
