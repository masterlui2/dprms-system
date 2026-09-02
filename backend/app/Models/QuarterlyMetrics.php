<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Override;

class QuarterlyMetrics extends Model
{
    protected $fillable = [
        'project_id',
        'submitted_by',
        'quarter',
        'year',
        'gross_sales',
        'production_volume',
        'employee_count',
        'total_cost',
        'submitted_at'
    ];

    #[Override]
    public function casts()
    {
        return [
            'submitted_at' => 'datetime'
        ];
    }

    public function products():HasMany{
        return $this->hasMany(Product::class, 'quarter_id');
    }

    public function employees():HasMany{
        return $this->hasMany(Employee::class, 'quarter_id');
    }

    public function product_cost():HasMany{
        return $this->hasMany(ProductCost::class, 'quarter_id');
    }
}
