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
        'full_release_date',
        'amortization_start_date',
        'repayment_term_months',
        'budget_ceiling',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'total_amount' => 'decimal:2',
            'budget_ceiling' => 'decimal:2',
            'full_release_date' => 'date',
            'amortization_start_date' => 'date',
            'repayment_term_months' => 'integer',
        ];
    }

    public function proposal(): BelongsTo
    {
        return $this->belongsTo(Proposal::class);
    }
}
