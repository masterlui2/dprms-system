<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExecutiveSummary extends Model
{

    protected $table = "executive_summary_tbl";
    protected $fillable = [
        'project_id',
        'submitted_by',
        'semester',
        'year',
        'total_project_budget',
    ];

    public function project():BelongsTo{
        return $this->belongsTo(Project::class);
    }

    public function accomplishments():HasMany{
        return $this->hasMany(Accomplishment::class,"executive_summary_id");
    }

    public function outputs():HasMany{
        return $this->hasMany(Output::class,"executive_summary_id");
    }

    public function actions():HasMany{
        return $this->hasMany(Action::class,"executive_summary_id");
    }
}
