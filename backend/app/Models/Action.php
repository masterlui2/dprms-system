<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Action extends Model
{
    protected $table = "actions_tbl";
    protected $fillable = [
        'executive_summary_id',
        'cooperating_agency',
        'plan',
        'solutions',
        'concern'
    ];

    public function executive_summary():BelongsTo{
        return $this->belongsTo(ExecutiveSummary::class);
    }
}
