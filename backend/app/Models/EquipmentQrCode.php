<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EquipmentQrCode extends Model
{
    protected $fillable = [
        'equipment_id',
        'qr_code_reference',
        'qr_code_data',
        'qr_code_image_path',
        'version',
        'is_active',
        'generated_at',
        'generated_by',
        'deactivated_at',
        'deactivated_by',
        'deactivation_reason',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'generated_at' => 'datetime',
            'deactivated_at' => 'datetime',
        ];
    }

    public function equipment(): BelongsTo
    {
        return $this->belongsTo(EquipmentRegistry::class, 'equipment_id');
    }

    public function scanLogs(): HasMany
    {
        return $this->hasMany(QrScanLog::class, 'qr_code_id');
    }
}
