<?php

namespace App\Http\Requests\ProposalModule;

use App\Models\DocumentType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class SubmitSetupProposalRequest extends FormRequest
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

            // SetupProposal fields
            'business_name' => 'required|string|max:255',
            'business_type' => 'required|in:SOLE-PROPRIETORSHIP,PARTNERSHIP,CORPORATION,COOPERATIVE',
            'industry_sector' => 'required|string|max:255',
            'enterprise_size' => 'required|in:MICRO,SMALL,MEDIUM',
            'years_in_operation' => 'required|integer|min:0',
            'business_address' => 'required|string',
            'form_snapshot' => 'required|array',

            // The frontend now submits the proposal AND every supporting
            // document together, in one multipart request (see
            // SetupSubmissionService::submit(), which wraps proposal
            // creation, the SetupProposal row, the auto-generated Form 001
            // PDF, and every document in `documents` in a single DB
            // transaction — either all of it lands or none of it does).
            //
            // withValidator() below cross-checks 'documents' against every
            // applicant-visible, required DocumentType for this
            // business_type/enterprise_size, so an incomplete submission is
            // rejected before anything is created — not partway through.
            'documents' => 'sometimes|array',
            'documents.*.document_type_id' => [
                'required_with:documents',
                'integer',
                'distinct',
                Rule::exists('document_types', 'id')
                    ->where(fn ($query) => $query->whereIn('applicable_program', ['SETUP', 'BOTH'])),
            ],
            'documents.*.file' => 'required_with:documents|file|mimes:pdf|max:10240',
        ];
    }

    /**
     * Cross-checks the submitted 'documents' against every applicant-visible,
     * required DocumentType applicable to this submission's business_type and
     * enterprise_size (program SETUP or BOTH). The auto-generated proposal
     * PDF (set_number=PROPOSAL, is_applicant_visible=false) and any
     * internal-only document types are intentionally excluded — the
     * proponent never uploads those themselves.
     *
     * Runs after the base rules, so if business_type/enterprise_size
     * themselves already failed validation, this is skipped rather than
     * piling on a second, confusing "missing documents" error.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($validator->errors()->has('business_type') || $validator->errors()->has('enterprise_size')) {
                return;
            }

            $businessType = $this->input('business_type');
            $enterpriseSize = $this->input('enterprise_size');

            $submittedTypeIds = collect($this->input('documents', []))
                ->pluck('document_type_id')
                ->filter()
                ->map(fn ($id) => (int) $id)
                ->all();

            $missingRequired = DocumentType::query()
                ->where('is_required', true)
                ->where('is_applicant_visible', true)
                ->whereIn('applicable_program', ['SETUP', 'BOTH'])
                ->where(fn ($query) => $query
                    ->whereNull('applicable_business_types')
                    ->orWhereJsonContains('applicable_business_types', $businessType))
                ->where(fn ($query) => $query
                    ->whereNull('applicable_business_sizes')
                    ->orWhereJsonContains('applicable_business_sizes', $enterpriseSize))
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
