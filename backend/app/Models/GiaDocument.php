<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GiaDocument extends Model
{
    protected $fillable = [
        'gia_proposal_id',
        'document_type',
        'file_name',
        'file_path',
        'file_size',
        'mime_type',
        'is_verified',
        'verified_by',
        'verified_at',
        'verification_remarks',
        'updated_at'
    ];

    protected function casts(){[
            'is_verified' => 'boolean',
            'verified_at' => 'datetime',
            'updated_at' => 'datetime'
        ];
    }

    public function gia_proposal():BelongsTo{
        return $this->belongsTo(GiaProposal::class);
    }

    public function user():BelongsTo{
        return $this->belongsTo(User::class,"verified_by");
    }
}
