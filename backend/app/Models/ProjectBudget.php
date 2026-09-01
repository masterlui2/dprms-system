<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectBudget extends Model
{
    protected $fillable = [
        'proposal_id',
        'created_by',
        'program_type',
        'total_amount',
        'currency',
        'fiscal_year',
        'budget_ceiling',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'total_amount' => 'decimal:2',
            'budget_ceiling' => 'decimal:2',
        ];
    }

    public function proposal(): BelongsTo
    {
        return $this->belongsTo(Proposal::class);
    }
}
