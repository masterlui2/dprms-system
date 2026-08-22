<?php

namespace App\Http\Controllers;

use App\Models\DocumentType;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DocumentTypeController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'program' => ['required', Rule::in(['SETUP', 'GIA'])],
            'visibility' => ['nullable', Rule::in(['applicant', 'internal'])],
            'set_number' => ['nullable', Rule::in(['PROPOSAL', 'SET1', 'SET2', 'SET3', 'GIA1'])],
            'business_type' => ['nullable', Rule::in([
                'SOLE-PROPRIETORSHIP', 'PARTNERSHIP', 'CORPORATION', 'COOPERATIVE',
            ])],
            'business_size' => ['nullable', 'string'],
            'gia_category' => ['nullable', Rule::in([
                'PRIVATE-SECTOR', 'HEI', 'BARANGAY-LGU',
            ])],
        ]);

        $program = $validated['program'];
        $visibility = $validated['visibility'] ?? 'applicant';
        $setNumber = $validated['set_number'] ?? null;
        $businessType = $validated['business_type'] ?? null;
        $businessSize = $validated['business_size'] ?? null;
        $giaCategory = $validated['gia_category'] ?? null;

        if ($visibility === 'internal') {
            abort_unless(
                $request->user()?->hasRole(['PROJECT_STAFF', 'FOCAL', 'PROVINCIAL_DIRECTOR']),
                403,
            );
        }

        $query = DocumentType::query()->where(
            'is_applicant_visible',
            $visibility === 'applicant',
        );

        // program is required, so this is always applied (no more silent
        // SETUP+GIA merge when the param is omitted)
        $query->where(fn ($q) => $q
            ->where('applicable_program', $program)
            ->orWhere('applicable_program', 'BOTH'));

        // set_number disambiguates rows that share a `group` label across
        // different sets (e.g. "Additional Documents" appears in SET2 and
        // GIA1). Pass it whenever the caller knows which set/step they're
        // rendering; omit it to get every applicant-visible doc for the
        // program, spanning all sets.
        if ($setNumber) {
            $query->where('set_number', $setNumber);
        }

        $query->where(fn ($q) => $q
            ->whereNull('applicable_business_types')
            ->when($businessType, fn ($q2) => $q2->orWhereJsonContains('applicable_business_types', $businessType)));

        $query->where(fn ($q) => $q
            ->whereNull('applicable_business_sizes')
            ->when($businessSize, fn ($q2) => $q2->orWhereJsonContains('applicable_business_sizes', $businessSize)));

        $query->where(fn ($q) => $q
            ->whereNull('applicable_gia_categories')
            ->when($giaCategory, fn ($q2) => $q2->orWhereJsonContains('applicable_gia_categories', $giaCategory)));

        // Order by set first (so SET1 business docs always precede SET2
        // additional docs, etc.), then group within a set, then insertion
        // order within a group. CASE WHEN is used instead of MySQL's
        // FIELD() since this targets Postgres.
        $query->orderByRaw("
                CASE set_number
                    WHEN 'PROPOSAL' THEN 1
                    WHEN 'SET1' THEN 2
                    WHEN 'SET2' THEN 3
                    WHEN 'SET3' THEN 4
                    WHEN 'GIA1' THEN 5
                    ELSE 6
                END
            ")
            ->orderBy('group')
            ->orderBy('id');

        return response()->json(['data' => $query->get()]);
    }
}
