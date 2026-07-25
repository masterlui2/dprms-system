<?php

namespace App\Models;

use Dom\Document;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Override;

class DocumentType extends Model
{
    protected $fillable = [
        'name',
        'set_number',
        'applicable_program',
        'is_required'
    ];

    #[Override]
    protected function casts()
    {
        return [
            'is_required' => 'boolean',
        ];
    }

    public function documents(): BelongsTo{
        return $this->belongsTo(Document::class);
    }
}
