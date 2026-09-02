<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Employee extends Model
{
    protected $fillable = [
        'quarter_id',
        'employee_name',
        'age',
        'status',
        'gender',
        'sectoral_group',
        'days_of_attendance',
        'salary_rate',
    ];

    public function quarter():BelongsTo{
        return $this->belongsTo(QuarterlyMetrics::class,'quarter_id');
    }
}
