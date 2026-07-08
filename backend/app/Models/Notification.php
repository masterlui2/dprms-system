<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'is_read',
        'read_at',
        'related_type',
        'related_id',
    ];

    protected function casts():array{
        return [
            'read_at' => 'datetime',
            'is_read' => 'boolean'
        ];
    }

    public function user(){
        return $this->belongsTo(User::class, "user_id");
    }

    public function related(){
        return $this->morphTo();
    }
}
