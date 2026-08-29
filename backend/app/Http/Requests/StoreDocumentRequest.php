<?php

namespace App\Http\Requests;

use App\Models\Document;
use App\Models\DocumentType;
use App\Models\Proposal;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreDocumentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $documentType = DocumentType::query()->find($this->input('document_type_id'));

        if (! $documentType) {
            return true;
        }

        $proposal = Proposal::query()->find($this->input('proposal_id'));

        if (! $documentType->is_applicant_visible) {
            if (! ($this->user()?->hasRole('PROJECT_STAFF') ?? false)) {
                return false;
            }

            if (! $proposal) {
                return true;
            }

            return in_array(
                $documentType->applicable_program,
                [$proposal->program_type, 'BOTH'],
                true,
            );
        }

        if (! $proposal) {
            return true;
        }

        if ($proposal->submitted_by !== $this->user()?->id) {
            return false;
        }

        if ($proposal->status !== 'RETURNED') {
            return true;
        }

        return Document::query()
            ->where('proposal_id', $proposal->id)
            ->where('document_type_id', $documentType->id)
            ->where('status', 'returned_for_revision')
            ->exists();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'proposal_id' => 'required|exists:proposals,id',
            'document_type_id' => 'required|exists:document_types,id',
            'file' => 'required|file|mimes:pdf|max:10240',
        ];
    }
}
