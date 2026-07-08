<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SetupEquipmentQuotation extends Model
{
    protected $fillable = [
        'setup_proposal_id',
        'quotation_number',
        'supplier_name',
        'equipment_description',
        'quantity',
        'unit_price',
        'total_price',
        'currency',
        'quotation_date',
        'validity_period',
        'file_path'
    ];

    protected function casts(){
    }

    public function setup_proposal():BelongsTo{
        return $this->belongsTo(SetupProposal::class);
    }
}
