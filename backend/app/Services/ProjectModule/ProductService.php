<?php

namespace App\Services\ProjectModule;

use App\Models\Product;
use App\Repositories\Contracts\ProjectModule\ProductRepositoryInterface;
use App\Services\Contracts\ProjectModule\ProductServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Override;

class ProductService implements ProductServiceInterface{
    public function __construct(protected ProductRepositoryInterface $productRepository)
    {
    }

    #[Override]
    public function submit(int $quarterId,array $data): Product
    {
        return $this->productRepository->create([
            'quarter_id'=> $quarterId,
            'product_name' => $data['product_name'],
            'specifications' => $data['specifications'],
            'unit' => $data['unit'],
            'price'=> $data['price'],
            'quantity' => $data['quantity']
        ]);
    }

    #[Override]
    public function getByQuarterlyMetricsId(int $quarterId): Collection
    {
        return $this->productRepository->findByQuarterMetrics($quarterId);
    }

    #[Override]
    public function update(int $id, array $data): Product
    {
        $updated = $this->productRepository->update($id,$data);
        if (! $updated) {
            abort(404,"Not Found");
        }
        return $this->productRepository->findById($id);
    }

    #[Override]
    public function batch(int $quarterId, array $creates, array $updates, array $deletes): Collection
    {
        return DB::transaction(function () use ($quarterId,$creates,$updates,$deletes):Collection{
            $createdRows = Collection::make($creates)->map(fn(array $item) => [
                'quarter_id' => $quarterId,
                'product_name' => $item['product_name'],
                'specifications' => $item['specifications'],
                'unit' => $item['unit'],
                'price'=> $item['price'],
                'quantity' => $item['quantity']
            ])->all();

            $created = $this->productRepository->createMany($createdRows);

            foreach($created as $i => $model){
                if(isset($creates[$i]['temp_id'])){
                    $model->setAttribute('temp_id',$creates[$i]['temp_id']);
                }
            }

            $updated = empty($updates) ? Collection::make() : $this->productRepository->updateMany($quarterId,$updates);

            if(! empty($deletes)){
                $this->productRepository->deleteMany($quarterId,$deletes);
            }

            return Collection::make($created->concat($updated)->values());
        });
    }
}
