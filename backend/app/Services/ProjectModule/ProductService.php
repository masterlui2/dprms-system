<?php

namespace App\Services\ProjectModule;

use App\Models\Product;
use App\Repositories\Contracts\ProjectModule\ProductRepositoryInterface;
use App\Services\Contracts\ProjectModule\ProductServiceInterface;
use Illuminate\Database\Eloquent\Collection;
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
}
