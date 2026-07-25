<?php

namespace App\Models;

use Dom\Document;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Override;

class DocumentType extends Model
{
    protected $fillable = [
        'name',
        'group',
        'description',
        'set_number',
        'applicable_program',
        'applicable_business_types',
        'applicable_gia_categories',
        'is_required',
        'is_applicant_visible',
    ];

    #[Override]
    protected function casts()
    {
        return [
            'applicable_business_types' => 'array',
            'applicable_gia_categories' => 'array',
            'is_required' => 'boolean',
            'is_applicant_visible' => 'boolean',
        ];
    }

    public function documents(): HasMany{
        return $this->hasMany(Document::class);
    }
}
