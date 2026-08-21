<?php

namespace App\Services\ProposalModule;

use Barryvdh\DomPDF\Facade\Pdf;

class GiaProposalPDFService{
    public function generate(array $data): string{
        $pdf = Pdf::loadView('pdf.giaProposal',['data' => $data])->setPaper('a4','portrait');
        return $pdf->output();
    }
}
