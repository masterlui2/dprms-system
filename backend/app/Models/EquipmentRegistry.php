<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class EquipmentRegistry extends Model
{
    protected $table = 'equipment_registries';

    protected $fillable = [
        'proposal_id',
        'category_id',
        'added_by',
        'program_type',
        'equipment_name',
        'brand',
        'model',
        'serial_number',
        'acquisition_cost',
        'acquisition_date',
        'supplier_name',
        'specifications',
        'status',
        'current_condition',
        'last_checked_at',
        'approved_by',
        'approved_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'acquisition_cost' => 'decimal:2',
            'acquisition_date' => 'date',
            'approved_at' => 'datetime',
            'last_checked_at' => 'datetime',
        ];
    }

    public function proposal(): BelongsTo
    {
        return $this->belongsTo(Proposal::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(EquipmentCategory::class, 'category_id');
    }

    public function qrCode(): HasOne
    {
        return $this->hasOne(EquipmentQrCode::class, 'equipment_id');
    }

    public function conditionLogs(): HasMany
    {
        return $this->hasMany(EquipmentConditionLog::class, 'equipment_id');
    }
}
