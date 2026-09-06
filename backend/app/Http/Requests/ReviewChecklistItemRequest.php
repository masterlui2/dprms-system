<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReviewChecklistItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'document_id' => ['nullable', 'integer', 'exists:documents,id'],
            'is_present' => ['required', 'boolean'],
            'status' => ['required', 'string', 'in:Complied,Missing,Under Review,Needs Revision'],
            'remarks' => ['nullable', 'string'],
        ];
    }
}
