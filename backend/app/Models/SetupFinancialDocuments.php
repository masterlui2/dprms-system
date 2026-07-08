<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SetupFinancialDocuments extends Model
{
    protected $fillable = [
        'setup_proposal_id',
        'document_type',
        'document_year',
        'file_name',
        'file_path',
        'file_size',
        'mime_type',
        'is_verified',
        'verified_by',
        'verified_at',
        'updated_at'
    ];

    protected function casts(){
        return [
            'is_verified' => 'boolean',
            'verified_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function setup_proposal():BelongsTo{
        return $this->belongsTo(SetupProposal::class);
    }

    public function user():BelongsTo{
        return $this->belongsTo(User::class,"verified_by");
    }
}
