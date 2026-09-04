<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Linkage extends Model
{
    protected $fillable = [
        'quarter_id',
        'name',
        'type',
        'male_quantity',
        'female_quantity',
    ];

    public function quarter():BelongsTo{
        return $this->belongsTo(QuarterlyMetrics::class,'quarter_id');
    }
}
