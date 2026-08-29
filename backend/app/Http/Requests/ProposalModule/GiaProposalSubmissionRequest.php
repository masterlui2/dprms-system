<?php

namespace App\Http\Requests\ProposalModule;

use App\Models\DocumentType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class GiaProposalSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check();
    }

    public function rules(): array
    {
        return [
            // Proposal fields
            'title' => 'required|string|max:500',
            'remarks' => 'nullable|string',

            // GiaProposal fields
            'proponent_category' => 'required|in:Private Sector,Higher Education Institution,Barangay LGU',
            'organization_name' => 'required|string|max:255',
            'office_address' => 'required|string|max:500',
            'position' => 'required|string|max:255',
            'contact_number' => 'required|string|max:30',
            'project_category' => 'required|in:Agriculture and Fisheries,Community Development,Education,Environment,Health,Information and Communications Technology,Research and Development,Disaster Risk Reduction and Management,Others',
            'project_type' => 'required|in:Research and Development,Capability Building and Training,Technology Transfer,Community-Based Science and Technology Project,Others',
            'form_snapshot' => 'required|array',

            'documents' => 'sometimes|array',
            'documents.*.document_type_id' => [
                'required_with:documents',
                'integer',
                'distinct',
                Rule::exists('document_types', 'id')
                    ->where(fn ($query) => $query
                        ->where('set_number', 'GIA1')
                        ->whereIn('applicable_program', ['GIA', 'BOTH'])),
            ],
            'documents.*.file' => 'required_with:documents|file|mimes:pdf|max:10240',
        ];
    }

    /**
     * Cross-checks the submitted 'documents' against every applicant-visible,
     * required GIA1 DocumentType applicable to this submission's proponent category
     * (program GIA or BOTH). The auto-generated proposal PDF
     * (set_number=PROPOSAL, is_applicant_visible=false) and any
     * internal-only document types are intentionally excluded — the
     * proponent never uploads those themselves.
     *
     * Runs after the base rules, so if project_category itself already
     * failed validation, this is skipped rather than piling on a second,
     * confusing "missing documents" error.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($validator->errors()->has('proponent_category')) {
                return;
            }

            $giaCategory = match ($this->input('proponent_category')) {
                'Private Sector' => 'PRIVATE-SECTOR',
                'Higher Education Institution' => 'HEI',
                'Barangay LGU' => 'BARANGAY-LGU',
                default => null,
            };

            $submittedTypeIds = collect($this->input('documents', []))
                ->pluck('document_type_id')
                ->filter()
                ->map(fn ($id) => (int) $id)
                ->all();

            $missingRequired = DocumentType::query()
                ->where('is_required', true)
                ->where('is_applicant_visible', true)
                ->where('set_number', 'GIA1')
                ->whereIn('applicable_program', ['GIA', 'BOTH'])
                ->where(fn ($query) => $query
                    ->whereNull('applicable_gia_categories')
                    ->orWhereJsonContains('applicable_gia_categories', $giaCategory))
                ->whereNotIn('id', $submittedTypeIds)
                ->pluck('name');

            if ($missingRequired->isNotEmpty()) {
                $validator->errors()->add(
                    'documents',
                    'Missing required document(s): '.$missingRequired->implode(', ').'.'
                );
            }
        });
    }
}
