<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexEquipmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole(['PROJECT_STAFF', 'FOCAL']) ?? false;
    }

    public function rules(): array
    {
        return [
            'program_type' => ['nullable', 'string', Rule::in(['SETUP', 'GIA'])],
            'search' => ['nullable', 'string', 'max:150'],
            'category_id' => ['nullable', 'integer', 'exists:equipment_categories,id'],
            'condition' => ['nullable', 'string', Rule::in(['GOOD', 'FAIR', 'POOR', 'NON_FUNCTIONAL'])],
        ];
    }
}
