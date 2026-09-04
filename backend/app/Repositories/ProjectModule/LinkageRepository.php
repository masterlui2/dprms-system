<?php

namespace App\Repositories\ProjectModule;

use App\Models\Linkage;
use App\Repositories\BaseRepository;
use App\Repositories\Contracts\ProjectModule\LinkageRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

use Override;

class LinkageRepository extends BaseRepository implements LinkageRepositoryInterface{

    #[Override]
    public function __construct(Linkage $model)
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
