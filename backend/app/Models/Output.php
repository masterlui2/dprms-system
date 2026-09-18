<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Output extends Model
{
    protected $table = "outputs_tbl";
    protected $fillable = [
        'executive_summary_id',
        'expected_output',
        'target',
        'actual',
        'description'
    ];

    public function executive_summary():BelongsTo{
        return $this->belongsTo(ExecutiveSummary::class);
    }
}
