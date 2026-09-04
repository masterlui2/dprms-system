<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductionMaterial extends Model
{
    protected $fillable = [
        'quarter_id',
        'materials',
        'unit',
        'quantity',
        'cost',
    ];

    public function quarter(): BelongsTo{
        return $this->belongsTo(QuarterlyMetrics::class,'quarter_id');
    }
}
