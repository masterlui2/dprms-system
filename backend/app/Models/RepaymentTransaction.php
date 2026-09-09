<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RepaymentTransaction extends Model
{
    protected $fillable = [
        'project_ledger_id',
        'uploaded_by',
        'verified_by',
        'amount_paid',
        'payment_due',
        'bank_branch',
        'check_number',
        'check_date',
        'payment_date',
        'proof_path',
        'proof_original_name',
        'proof_mime_type',
        'or_number',
        'status',
        'verified_at',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'amount_paid' => 'decimal:2',
            'payment_due' => 'date',
            'check_date' => 'date',
            'payment_date' => 'date',
            'verified_at' => 'datetime',
        ];
    }

    public function projectLedger(): BelongsTo
    {
        return $this->belongsTo(ProjectLedger::class);
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
