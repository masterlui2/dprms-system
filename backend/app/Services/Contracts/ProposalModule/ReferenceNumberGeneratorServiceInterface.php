<?php

namespace App\Services\Contracts\ProposalModule;

interface ReferenceNumberGeneratorServiceInterface{
    public function generate(string $programType): string;
}
