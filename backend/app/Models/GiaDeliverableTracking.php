<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GiaDeliverableTracking extends Model
{
    protected $table = 'gia_deliverable_tracking';

    protected $fillable = [
        'monitoring_record_id',
        'deliverable_number',
        'deliverable_title',
        'deliverable_desription',
        'expected_completion',
        'actual_completion',
        'status',
        'completion_percentage',
        'supporting_doc_path',
        'updated_by',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'expected_completion' => 'date',
            'actual_completion' => 'date',
            'completion_percentage' => 'decimal:2',
        ];
    }

    public function monitoringRecord(): BelongsTo
    {
        return $this->belongsTo(ProjectMonitoringRecord::class, 'monitoring_record_id');
    }
}
