<?php

namespace App\Models;

use Dom\DocumentType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Override;

class Document extends Model
{
    protected $fillable = [
        'proposal_id',
        'document_type_id',
        'uploaded_by',
        'reviewed_by',
        'file_name',
        'file_path',
        'file_size',
        'mime_type',
        'status',
        'remarks',
        'reviewed_at'
    ];

    #[Override]
    protected function casts()
    {
        return [
            'reviewed_at' => 'datetime',
        ];
    }

    public function document_type():BelongsTo{
        return $this->belongsTo(DocumentType::class);
    }

    public function proposal():BelongsTo{
        return $this->belongsTo(Proposal::class);
    }
}
