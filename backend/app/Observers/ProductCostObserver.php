<?php

namespace App\Observers;

use App\Models\ProductCost;

class ProductCostObserver
{
    public function saved(ProductCost $productCost): void{
        $productCost->quarter()->update([
            'total_cost' => $productCost->quarter->product_cost()->sum('total'),
        ]);
    }

    public function deleted(ProductCost $productCost): void{
        $this->saved($productCost);
    }
}
