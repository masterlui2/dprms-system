<?php

namespace App\Services\ProposalModule;

use Barryvdh\DomPDF\Facade\Pdf;

class SetupProposalPdfService
{
    /**
     * Render the SETUP Form 001 (Sections A & B only) as a PDF and
     * return the raw binary contents.
     */
    public function generate(array $data): string
    {
        $pdf = Pdf::loadView('pdf.setupProposal', ['data' => $data])
            ->setPaper('a4', 'portrait');

        return $pdf->output();
    }
}
