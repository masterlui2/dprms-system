<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArchivedDocument extends Model
{
    protected $fillable = [
        'document_id',
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
        'reviewed_at',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'reviewed_at' => 'datetime',
            'archived_at' => 'datetime',
        ];
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function proposal(): BelongsTo
    {
        return $this->belongsTo(Proposal::class);
    }

    public function document_type(): BelongsTo
    {
        return $this->belongsTo(DocumentType::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
