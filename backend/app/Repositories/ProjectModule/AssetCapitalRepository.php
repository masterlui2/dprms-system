<?php

namespace App\Repositories\ProjectModule;

use App\Models\AssetCapital;
use App\Repositories\BaseRepository;
use App\Repositories\Contracts\ProjectModule\AssetCapitalRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Override;

class AssetCapitalRepository extends BaseRepository implements AssetCapitalRepositoryInterface{
    #[Override]
    public function __construct(AssetCapital $model)
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
        $product = $this->model->newQuery()->find($id);
        if(! $product){
            return false;
        }

        $product->fill($data);
        return $product->save();
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
