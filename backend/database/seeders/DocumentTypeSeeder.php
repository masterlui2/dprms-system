<?php

namespace Database\Seeders;

use App\Models\DocumentType;
use Illuminate\Database\Seeder;

class DocumentTypeSeeder extends Seeder
{
    public function run(): void
    {
        $documentTypes = [
            // The generated proposal PDF itself
            [
                'name' => 'Project Proposal Form (SETUP Form 001)',
                'set_number' => 'PROPOSAL',
                'applicable_program' => 'SETUP',
                'is_required' => true,
            ],

            // SET 1 — compiled/reviewed prior to TNA
            ['name' => 'Filled-out TNA Form 01', 'set_number' => 'SET1', 'applicable_program' => 'SETUP', 'is_required' => true],
            ['name' => 'GAD Assessment (GWP)', 'set_number' => 'SET1', 'applicable_program' => 'SETUP', 'is_required' => true],
            ['name' => 'GAD Checklist for S&T Interventions in MSMEs', 'set_number' => 'SET1', 'applicable_program' => 'SETUP', 'is_required' => true],
            ['name' => 'Hazard Hunter', 'set_number' => 'SET1', 'applicable_program' => 'SETUP', 'is_required' => true],
            ['name' => "Recent Mayor's Permit", 'set_number' => 'SET1', 'applicable_program' => 'BOTH', 'is_required' => true],
            ['name' => 'DTI Registration (Sole Proprietorship)', 'set_number' => 'SET1', 'applicable_program' => 'BOTH', 'is_required' => false],
            ['name' => 'BIR Registration', 'set_number' => 'SET1', 'applicable_program' => 'BOTH', 'is_required' => true],
            ['name' => 'Photocopy of Blank Official Receipt', 'set_number' => 'SET1', 'applicable_program' => 'BOTH', 'is_required' => true],
            ['name' => '3 Valid Equipment Quotations (3 Different Suppliers)', 'set_number' => 'SET1', 'applicable_program' => 'SETUP', 'is_required' => true],
            ['name' => 'Lease Contract for Manufacturing Space (or equivalent)', 'set_number' => 'SET1', 'applicable_program' => 'SETUP', 'is_required' => false],
            ['name' => 'Notarized Board Resolution (Corp/Coop)', 'set_number' => 'SET1', 'applicable_program' => 'BOTH', 'is_required' => false],
            ['name' => 'SEC or CDA Registration (Corp/Coop)', 'set_number' => 'SET1', 'applicable_program' => 'BOTH', 'is_required' => false],
            ['name' => 'Articles of Incorporation/Cooperation', 'set_number' => 'SET1', 'applicable_program' => 'BOTH', 'is_required' => false],
            ["name" => "Secretary's Certificate of Incumbent Officers", 'set_number' => 'SET1', 'applicable_program' => 'BOTH', 'is_required' => false],
            ['name' => 'Financial Statements (Past 3 Years) with Notarized Sworn Statement', 'set_number' => 'SET1', 'applicable_program' => 'BOTH', 'is_required' => true],
            ['name' => 'Letter of Intent for SETUP Assistance', 'set_number' => 'SET1', 'applicable_program' => 'SETUP', 'is_required' => true],

            // SET 2 — compiled/checked during proposal preparation
            ['name' => 'Bio-data of Approved Signatory', 'set_number' => 'SET2', 'applicable_program' => 'BOTH', 'is_required' => true],
            ['name' => "Valid Government-Issued ID of Approved Signatory (3 Signatures)", 'set_number' => 'SET2', 'applicable_program' => 'BOTH', 'is_required' => true],
            ['name' => 'Barangay Certification of Permanent Residence', 'set_number' => 'SET2', 'applicable_program' => 'BOTH', 'is_required' => true],
            ['name' => 'Omnibus Affidavit', 'set_number' => 'SET2', 'applicable_program' => 'BOTH', 'is_required' => true],
            ['name' => 'TNA Form 4', 'set_number' => 'SET2', 'applicable_program' => 'SETUP', 'is_required' => true],

            // SET 3 — compiled/checked after deliberation and approval
            ['name' => 'Request for Release of Funds', 'set_number' => 'SET3', 'applicable_program' => 'BOTH', 'is_required' => true],
            ['name' => 'Waiver and Authorization to Tag LBP Account', 'set_number' => 'SET3', 'applicable_program' => 'BOTH', 'is_required' => true],
            ['name' => 'Payee Data Form', 'set_number' => 'SET3', 'applicable_program' => 'BOTH', 'is_required' => true],
            ['name' => 'Notarized and Signed MOA', 'set_number' => 'SET3', 'applicable_program' => 'BOTH', 'is_required' => true],
            ['name' => 'Pre-Project Implementation Sheet', 'set_number' => 'SET3', 'applicable_program' => 'SETUP', 'is_required' => true],
            ['name' => 'Notice of Approval', 'set_number' => 'SET3', 'applicable_program' => 'BOTH', 'is_required' => true],
            ['name' => 'Approved Line-Item Budget', 'set_number' => 'SET3', 'applicable_program' => 'BOTH', 'is_required' => true],
            ['name' => 'Recommending Approval of ARD', 'set_number' => 'SET3', 'applicable_program' => 'BOTH', 'is_required' => true],
            ['name' => 'Endorsement Letter from C/PSTO', 'set_number' => 'SET3', 'applicable_program' => 'BOTH', 'is_required' => true],
            ['name' => 'Final Copy of Project Proposal', 'set_number' => 'SET3', 'applicable_program' => 'BOTH', 'is_required' => true],
            ['name' => 'RTEC Report', 'set_number' => 'SET3', 'applicable_program' => 'BOTH', 'is_required' => true],
            ['name' => 'Candidate Risk Register', 'set_number' => 'SET3', 'applicable_program' => 'BOTH', 'is_required' => true],
            ['name' => 'SETI Scorecard', 'set_number' => 'SET3', 'applicable_program' => 'BOTH', 'is_required' => true],
        ];

        foreach ($documentTypes as $type) {
            DocumentType::create($type);
        }
    }
}
