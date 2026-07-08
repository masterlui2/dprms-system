<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProposalTemplate extends Model
{
    protected $fillable = [
        'uploaded_by',
        'program_type',
        'template_name',
        'description',
        'file_name',
        'file_path',
        'file_size',
        'mime_type',
        'version',
        'is_active'
    ];

    protected function casts(){
        return [
            'is_active' => "boolean",
        ];
    }

    public function user():BelongsTo{
        return $this->belongsTo(User::class,"uploaded_by");
    }
}
