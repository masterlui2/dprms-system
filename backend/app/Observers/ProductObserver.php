<?php

namespace App\Observers;

use App\Models\Product;

class ProductObserver
{
    public function saved(Product $product): void{
        $product->quarter()->update([
            'gross_sales' => $product->quarter->products()->sum('gross_sales'),
            'production_volume' => $product->quarter->products()->sum('quantity')
        ]);
    }

    public function deleted(Product $product): void{
        $this->saved($product);
    }
}
