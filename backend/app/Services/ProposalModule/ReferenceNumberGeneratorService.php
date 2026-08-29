<?php

namespace App\Services\ProposalModule;

use App\Models\Proposal;
use App\Services\Contracts\ProposalModule\ReferenceNumberGeneratorServiceInterface;

class ReferenceNumberGeneratorService implements ReferenceNumberGeneratorServiceInterface{
    public function generate(string $programType): string{
        $year = now()->year;

        $count = Proposal::query()->where('program_type',$programType)->whereYear('created_at',$year)->count();

        $sequence = str_pad((string) ($count + 1), 4, '0', STR_PAD_LEFT);

        return "{$programType}-{$year}-{$sequence}";
    }
}
