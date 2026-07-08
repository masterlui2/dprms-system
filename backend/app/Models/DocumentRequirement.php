<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocumentRequirement extends Model
{
    protected $fillable = [
        'program_type',
        'requirement_name',
        'description',
        'is_mandatory',
        'sort_order',
        'is_active',
        'years_in_operation'
    ];

    protected function casts(){
        return [
            'is_mandatory' => 'boolean',
            'is_active' => 'boolean'
        ];
    }
}
