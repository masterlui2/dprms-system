<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Override;

class Proposal extends Model
{
    protected $fillable = [
        'submitted_by',
        'focal_id',
        'reviewed_by',
        'program_type',
        'reference_number',
        'title',
        'status',
        'submitted_at',
        'approved_at',
        'disapproved_at',
        'remarks'
    ];

    #[Override]
    protected function casts()
    {
        return [
            'submitted_at' => 'datetime',
            'approved_at' => 'datetime',
            'disapproved_at' => 'datetime',
        ];
    }

    public function user(){
        return $this->belongsTo(User::class, "submitted_by");
    }

    public function focal():BelongsTo{
        return $this->belongsTo(User::class,'focal_id');
    }

    public function reviewed():BelongsTo{
        return $this->belongsTo(User::class,'reviewed_by');
    }

    public function setup_proposal():HasMany{
        return $this->hasMany(SetupProposal::class);
    }

    public function gia_proposal():HasMany{
        return $this->hasMany(GiaProposal::class);
    }

    public function documents():HasMany{
        return $this->hasMany(Document::class);
    }

    public function review_logs(): HasMany
    {
        return $this->hasMany(ProposalReviewLog::class);
    }

    public function audits(): HasMany
    {
        return $this->hasMany(ProposalAudit::class);
    }
}
