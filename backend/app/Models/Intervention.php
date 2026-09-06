<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Intervention extends Model
{
    protected $fillable = [
        'quarter_id',
        'name',
        'type',
        'availed',
        'intervention',
        'date'
    ];

    public function quarter():BelongsTo{
        return $this->belongsTo(QuarterlyMetrics::class,'quarter_id');
    }
}
