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
}
