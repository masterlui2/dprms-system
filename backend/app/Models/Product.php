<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    protected $fillable = [
        'quarter_id',
        'product_name',
        'specifications',
        'unit',
        'price',
        'quantity',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'quantity' => 'integer',
        'gross_sales' => 'decimal:2'
    ];

    public function quarter(): BelongsTo{
        return $this->belongsTo(QuarterlyMetrics::class, 'quarter_id');
    }
}
