<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const NAMES = [
        'Endorsement Letter from C/PSTO',
        'RTEC Report',
        'SETI Scorecard',
        'GAD Checklist for S&T Interventions in MSMEs',
        'Notarized and Signed MOA',
        'Approved Line-Item Budget',
    ];

    public function up(): void
    {
        foreach (self::NAMES as $name) {
            $exists = DB::table('document_types')
                ->where('name', $name)
                ->where('set_number', 'GIA1')
                ->where('applicable_program', 'GIA')
                ->where('is_applicant_visible', false)
                ->exists();

            if (! $exists) {
                DB::table('document_types')->insert([
                    'name' => $name,
                    'set_number' => 'GIA1',
                    'applicable_program' => 'GIA',
                    'is_required' => true,
                    'is_applicant_visible' => false,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        DB::table('document_types')
            ->whereIn('name', self::NAMES)
            ->where('set_number', 'GIA1')
            ->where('applicable_program', 'GIA')
            ->where('is_applicant_visible', false)
            ->delete();
    }
};
