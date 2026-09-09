<?php

namespace App\Repositories\ProjectModule;

use App\Models\Product;
use App\Repositories\BaseRepository;
use App\Repositories\Contracts\ProjectModule\ProductRepositoryInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Collection;
use Override;

class ProductRepository extends BaseRepository implements ProductRepositoryInterface{
    #[Override]
    public function __construct(Product $model)
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
            $product =  $this->model->newQuery()->where('quarter_id',$quarterId)->find($id);
            if (! $product){
                abort(404,"Not Found");
            }

            $product->fill(collect($rows)->except('id')->toArray());
            $product->save();
            return $product;
        });
    }

    #[Override]
    public function deleteMany(int $quarterId, array $rows): int
    {
        return $this->model->newQuery()->where('quarter_id',$quarterId)->whereIn('id',$rows)->delete();
    }


}
