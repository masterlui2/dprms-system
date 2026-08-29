<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SetupProposal extends Model
{
    protected $fillable = [
        'proposal_id',
        'business_name',
        'business_type',
        'industry_sector',
        'enterprise_size',
        'years_in_operation',
        'business_address',
        'form_snapshot',
        'region',
        'province',
        'city_municipality',
    ];

    protected function casts(): array
    {
        return [
            'form_snapshot' => 'array',
        ];
    }

    public function proposal():BelongsTo{
        return $this->belongsTo(Proposal::class);
    }

    public function user():BelongsTo{
        return $this->belongsTo(User::class, "tna_encoded_by");
    }

    public function setup_financial_document():HasMany{
        return $this->hasMany(SetupFinancialDocuments::class);
    }

    public function setup_equipment_quotation():HasMany{
        return $this->hasMany(SetupEquipmentQuotation::class);
    }
}
