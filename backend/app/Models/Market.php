<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Market extends Model
{
    protected $fillable = [
        'quarter_id',
        'market_name',
        'address',
        'condition',
        'effective_date',
        'contact_person',
        'service',
        'volume'
    ];

    public function quarter(): BelongsTo{
        return $this->belongsTo(QuarterlyMetrics::class,'quarter_id');
    }
}
