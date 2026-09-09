<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Asset extends Model
{
    protected $fillable = [
        'quarter_id',
        'asset_name',
        'type',
        'lifespan',
        'year_acquired',
        'cost',
    ];

    public function quarter(): BelongsTo{
        return $this->belongsTo(QuarterlyMetrics::class,'quarter_id');
    }

    protected function bookValue(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->cost - (now()->year - $this->year_acquired) * $this->depreciation,
        );
    }
}
