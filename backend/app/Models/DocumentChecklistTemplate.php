<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DocumentChecklistTemplate extends Model
{
    protected $fillable = [
        'program_type',
        'phase_code',
        'phase_title',
        'item_code',
        'document_name',
        'group_name',
        'is_mandatory',
        'sort_order',
        'applicability_rules',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_mandatory' => 'boolean',
            'is_active' => 'boolean',
            'applicability_rules' => 'array',
            'sort_order' => 'integer',
        ];
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(ProposalChecklistReview::class, 'template_item_id');
    }
}
