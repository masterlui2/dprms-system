<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProposalAudit extends Model
{
    protected $fillable = [
        'proposal_id',
        'reviewed_by',
        'action',
        'previous_status',
        'new_status',
        'remarks',
        'findings',
        'assigned_evaluator_id'
    ];

    public function proposal(): BelongsTo{
        return $this->belongsTo(Proposal::class);
    }

    public function reviewer(): BelongsTo{
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function assigned_evaluator(): BelongsTo{
        return $this->belongsTo(User::class, 'assigned_evaluator_id');
    }
}
