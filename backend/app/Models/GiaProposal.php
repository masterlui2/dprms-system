<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GiaProposal extends Model
{
    protected $fillable = [
        'proposal_id',
        'research_title',
        'research_type',
        'sectoral_council',
        'call_for_proposals_ref',
        'research_duration_months',
        'total_budget_requested',
        'implementing_agency',
        'project_site',
        'abstract',
        'gad_score',
        'gad_scoresheet_path',
        'capsule_proposal_path',
        'full_proposal_path'
    ];

    public function proposal():BelongsTo{
        return $this->belongsTo(GiaProposal::class);
    }

    public function gia_document():HasMany{
        return $this->hasMany(GiaDocument::class);
    }

    public function gia_co_author():HasMany{
        return $this->hasMany(GiaCoAuthor::class);
    }
}
