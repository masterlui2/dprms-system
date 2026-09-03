<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProjectMonitoringRecord extends Model
{
    protected $fillable = [
        'proposal_id',
        'assigned_monitor',
        'program_type',
        'implementation_status',
        'start_date',
        'expected_end_date',
        'actual_end_date',
        'overall_compliance',
        'last_monitored_at',
        'monitoring_notes',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'expected_end_date' => 'date',
            'actual_end_date' => 'date',
            'overall_compliance' => 'decimal:2',
            'last_monitored_at' => 'datetime',
        ];
    }

    public function proposal(): BelongsTo
    {
        return $this->belongsTo(Proposal::class);
    }

    public function monitor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_monitor');
    }

    public function setupProgressReports(): HasMany
    {
        return $this->hasMany(SetupProgressReport::class, 'monitoring_record_id');
    }

    public function giaProgressReports(): HasMany
    {
        return $this->hasMany(GiaProgressReport::class, 'monitoring_record_id');
    }

    public function giaDeliverables(): HasMany
    {
        return $this->hasMany(GiaDeliverableTracking::class, 'monitoring_record_id');
    }
}
