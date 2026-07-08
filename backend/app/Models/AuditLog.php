<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $fillable = [
        'user_id',
        'action',
        'module',
        'record_id',
        'record_type',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent'
    ];

    protected function casts(){
        return[
            'old_values' => 'array',
            'new_values'=> 'array'
        ];
    }

    public function user(){
        return $this->belongsTo(User::class, "user_id");
    }

    public function record(){
        return $this->morphTo();
    }
}
