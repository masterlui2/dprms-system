<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EquipmentCategory extends Model
{
    protected $fillable = [
        'category_name',
        'category_code',
        'industry_sector',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function equipment(): HasMany
    {
        return $this->hasMany(EquipmentRegistry::class, 'category_id');
    }
}
