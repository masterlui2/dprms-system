<?php

namespace App\Services\Contracts\ProjectModule;

use App\Models\Product;
use Illuminate\Database\Eloquent\Collection;

interface ProductServiceInterface{
    public function submit(int $quarterId,array $data): Product;
    public function getByQuarterlyMetricsId(int $quarterId): Collection;
    public function update(int $id, array $data): Product;
}
