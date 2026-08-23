<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Override;

class GiaProposal extends Model
{
    protected $fillable = [
        'proposal_id',
        'proponent_category',
        'organization_name',
        'office_address',
        'position',
        'contact_number',
        'research_type',
        'research_category',
        'form_snapshot',
    ];

    #[Override]
    protected function casts(): array
    {
        return [
            'form_snapshot' => 'array',
        ];
    }

    public function proposal():BelongsTo{
        return $this->belongsTo(Proposal::class);
    }

    public function gia_document():HasMany{
        return $this->hasMany(GiaDocument::class);
    }

    public function gia_co_author():HasMany{
        return $this->hasMany(GiaCoAuthor::class);
    }
}
