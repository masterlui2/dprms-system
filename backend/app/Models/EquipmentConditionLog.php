<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EquipmentConditionLog extends Model
{
    protected $fillable = [
        'equipment_id',
        'uploaded_by',
        'qr_code_id',
        'previous_condition',
        'new_condition',
        'update_reason',
        'remarks',
        'recommendations',
        'photos_path',
        'scanned_at',
    ];

    protected function casts(): array
    {
        return [
            'photos_path' => 'array',
            'scanned_at' => 'datetime',
        ];
    }

    public function equipment(): BelongsTo
    {
        return $this->belongsTo(EquipmentRegistry::class, 'equipment_id');
    }

    public function inspector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function qrCode(): BelongsTo
    {
        return $this->belongsTo(EquipmentQrCode::class, 'qr_code_id');
    }
}
