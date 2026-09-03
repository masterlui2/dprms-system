<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GiaProgressReport extends Model
{
    protected $fillable = [
        'monitoring_record_id',
        'submitted_by',
        'report_type',
        'reporting_period',
        'reporting_year',
        'milestone_reference',
        'research_progress',
        'objectivves_achieved',
        'challenges_encountered',
        'next_period_plans',
        'budget_utilization',
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
            'budget_utilization' => 'decimal:2',
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
