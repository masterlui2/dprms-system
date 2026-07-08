<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GiaCoAuthor extends Model
{
    protected $fillable = [
        'gia_proposal_id',
        'name',
        'designation',
        'institution',
        'email',
        'contact_number',
        'cv_path',
    ];

    public function gia_proposal():BelongsTo{
        return $this->belongsTo(GiaProposal::class);
    }
}
