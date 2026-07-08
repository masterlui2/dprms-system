<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateProposalTemplateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'program_type' => 'sometimes|in:SETUP,GIA',
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'file' => 'nullable|file|mimes:pdf,doc,docx|max:10240',
        ];
    }
}
