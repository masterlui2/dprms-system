<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductCost extends Model
{
    protected $table = 'production_costs';
    protected $fillable = [
        'quarter_id',
        'particulars',
        'month_1',
        'month_2',
        'month_3',
    ];

    public function quarter(): BelongsTo{
        return $this->belongsTo(QuarterlyMetrics::class,'quarter_id');
    }
}
