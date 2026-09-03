<?php

namespace App\Providers;

use App\Models\Employee;
use App\Models\Product;
use App\Models\ProductCost;
use App\Observers\EmployeeObserver;
use App\Observers\ProductCostObserver;
use App\Observers\ProductObserver;
use Illuminate\Support\ServiceProvider;

class ObserverServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        Product::observe(ProductObserver::class);
        ProductCost::observe(ProductCostObserver::class);
        Employee::observe(EmployeeObserver::class);
    }
}
