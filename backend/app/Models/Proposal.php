<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Override;

class Proposal extends Model
{
    protected $fillable = [
        'submitted_by',
        'program_type',
        'reference_number',
        'title',
        'status',
        'current_stage',
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

    public function setup_proposal():HasMany{
        return $this->hasMany(SetupProposal::class);
    }

    public function gia_proposal():HasMany{
        return $this->hasMany(GiaProposal::class);
    }
}
