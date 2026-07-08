<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
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
}
