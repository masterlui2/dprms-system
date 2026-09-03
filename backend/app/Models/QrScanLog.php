<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QrScanLog extends Model
{
    protected $fillable = [
        'qr_code_id',
        'scanned_by',
        'scan_purpose',
        'scan_result',
        'device_type',
        'browser',
        'ip_address',
        'location_lat',
        'location_lng',
        'action_taken',
        'scanned_at',
    ];

    protected function casts(): array
    {
        return ['scanned_at' => 'datetime'];
    }

    public function qrCode(): BelongsTo
    {
        return $this->belongsTo(EquipmentQrCode::class, 'qr_code_id');
    }

    public function scanner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'scanned_by');
    }
}
