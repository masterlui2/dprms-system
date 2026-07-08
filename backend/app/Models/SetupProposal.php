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
        'dti_sec_number',
        'industry_sector',
        'enterprise_size',
        'years_in_operation',
        'business_address',
        'region',
        'province',
        'city_minicipality',
        'annual_revenue',
        'tna_encoded_at',
        'tna_encoded_by',
        'lgu_permit_number',
        'letter_of_intent_path'
    ];

    protected function casts(){
        return [
            'tna_encoded_at' => 'datetime',
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
