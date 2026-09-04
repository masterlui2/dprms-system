<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Override;

class Project extends Model
{
    protected $fillable = [
        'proposal_id',
        'created_by',
        'approved_by',
        'program_type',
        'status',
        'start_date',
        'expected_end_date',
        'actual_end_date',
        'notes',
        'approved_at'
    ];

    #[Override]
    protected function casts()
    {
        return [
            'approved_at' => 'datetime',
            'start_date' => 'date',
            'expected_end_date' => 'date',
            'actual_end_date' => 'date',
        ];
    }

    public function proposal():BelongsTo{
        return $this->belongsTo(Proposal::class);
    }

    public function user():BelongsTo{
        return $this->belongsTo(User::class,'created_by');
    }

    public function approved_by():BelongsTo{
        return $this->belongsTo(User::class,'approved_by');
    }
}
