<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Accomplishment extends Model
{
    protected $table = "accomplishment_tbl";
    protected $fillable = [
        'executive_summary_id',
        'objectives',
        'activities',
        'target_milestones',
        'weight',
        'actual_accomplishment',
        'actual'
    ];

    public function executive_summary():BelongsTo{
        return $this->belongsTo(ExecutiveSummary::class);
    }
}
