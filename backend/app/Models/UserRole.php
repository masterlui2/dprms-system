<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\Pivot;
use Override;

class UserRole extends Pivot
{
    protected $table = 'user_roles';

    public $incrementing = true;

    protected $fillable = [
        'user_id',
        'role_id',
        'assigned_at',
        'assigned_by'
    ];

    #[Override]
    protected function casts():array
    {
        return [
            'assigned_at' => 'datetime'
        ];
    }

    public function user():BelongsTo{
        return $this->belongsTo(User::class);
    }

    public function role():BelongsTo{
        return $this->belongsTo(Role::class);
    }

    public function assigned_by():BelongsTo{
        return $this->belongsTo(User::class,'assigned_by');
    }
}
