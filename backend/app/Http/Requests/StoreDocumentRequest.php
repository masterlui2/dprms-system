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
        $user = $this->user();
        if (! $user) {
            return false;
        }

        if ($user->hasRole(['PROJECT_STAFF', 'FOCAL', 'PROVINCIAL_DIRECTOR', 'RPMO', 'ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN'])) {
            return true;
        }

        $documentType = DocumentType::query()->find($this->input('document_type_id'));

        if (! $documentType) {
            return true;
        }

        $proposal = Proposal::query()->find($this->input('proposal_id'));

        if (! $documentType->is_applicant_visible) {
            return false;
        }

        if (! $proposal) {
            return true;
        }

        if ($proposal->submitted_by !== $user->id) {
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
