<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
class Role extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'program_type',
        'description'
    ];

    public function user():BelongsToMany{
        return $this->belongsToMany(User::class,'user_roles')
            ->using(UserRole::class)
            ->withPivot(['assigned_at','assigned_by'])
            ->withTimestamps();
    }
}
