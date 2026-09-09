<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProjectLedger extends Model
{
    protected $fillable = [
        'project_id',
        'program_type',
        'ledger_type',
        'period_label',
        'amount',
        'due_date',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'due_date' => 'date',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function repaymentTransactions(): HasMany
    {
        return $this->hasMany(RepaymentTransaction::class);
    }
}
