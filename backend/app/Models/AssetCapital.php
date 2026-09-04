<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssetCapital extends Model
{
    protected $fillable = [
        'quarter_id',
        'name',
        'amount'
    ];

    public function quarter():BelongsTo{
        return $this->belongsTo(QuarterlyMetrics::class,'quarter_id');
    }
}
