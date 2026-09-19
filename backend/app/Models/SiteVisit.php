<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class SiteVisit extends Model
{
    protected $fillable = [
        'project_id',
        'monitoring_record_id',
        'scheduled_by',
        'assigned_personnel',
        'visit_type',
        'purpose',
        'scheduled_date',
        'start_time',
        'end_time',
        'facility_location',
        'proponent_instructions',
        'visibility',
        'actual_visit_date',
        'status',
        'notification_sent',
        'notification_sent_at',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_date' => 'date',
            'actual_visit_date' => 'date',
            'notification_sent' => 'boolean',
            'notification_sent_at' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function monitoringRecord(): BelongsTo
    {
        return $this->belongsTo(ProjectMonitoringRecord::class, 'monitoring_record_id');
    }

    public function scheduler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'scheduled_by');
    }

    public function assignees(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'site_visit_assignees')->withTimestamps();
    }
}
