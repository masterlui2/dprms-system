<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateChecklistTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'document_name' => ['sometimes', 'string', 'max:255'],
            'group_name' => ['sometimes', 'string', 'max:255'],
            'phase_code' => ['sometimes', 'string', 'max:50'],
            'phase_title' => ['sometimes', 'string', 'max:255'],
            'is_mandatory' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer'],
            'is_active' => ['sometimes', 'boolean'],
            'applicability_rules' => ['nullable', 'array'],
        ];
    }
}
