<?php

namespace App\Http\Controllers;

use App\Models\DocumentType;
use Illuminate\Http\Request;

class DocumentTypeController extends Controller
{
    public function index(Request $request)
    {
        $program = $request->query('program'); // SETUP | GIA
        $businessType = $request->query('business_type'); // SOLE-PROPRIETORSHIP | PARTNERSHIP | CORPORATION | COOPERATIVE
        $giaCategory = $request->query('gia_category');

        $query = DocumentType::query()
            ->where('is_applicant_visible', true);

        if ($program) {
            $query->where(fn ($q) => $q
                ->where('applicable_program', $program)
                ->orWhere('applicable_program', 'BOTH'));
        }

        $query->where(fn ($q) => $q
            ->whereNull('applicable_business_types')
            ->when($businessType, fn ($q2) => $q2->orWhereJsonContains('applicable_business_types', $businessType)));

        $query->where(fn ($q) => $q
            ->whereNull('applicable_gia_categories')
            ->when($giaCategory, fn ($q2) => $q2->orWhereJsonContains('applicable_gia_categories', $giaCategory)));

        return response()->json(['data' => $query->orderBy('group')->orderBy('id')->get()]);
    }
}
