<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SetupProgressReport extends Model
{
    protected $fillable = [
        'monitoring_record_id',
        'submitted_by',
        'report_type',
        'reporting_period',
        'reporting_quarter',
        'reporting_year',
        'income_generated',
        'employment_generated',
        'production_output',
        'market_expansion',
        'challenges_encountered',
        'actions_taken',
        'status',
        'submitted_at',
        'due_date',
        'is_late',
        'days_late',
        'reviewed_by',
        'reviewed_at',
        'review_remarks',
    ];

    protected function casts(): array
    {
        return [
            'income_generated' => 'decimal:2',
            'submitted_at' => 'datetime',
            'due_date' => 'date',
            'is_late' => 'boolean',
            'reviewed_at' => 'datetime',
        ];
    }

    public function monitoringRecord(): BelongsTo
    {
        return $this->belongsTo(ProjectMonitoringRecord::class, 'monitoring_record_id');
    }
}
