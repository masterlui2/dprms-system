<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEquipmentInspectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole(['PROJECT_STAFF', 'FOCAL']) ?? false;
    }

    public function rules(): array
    {
        return [
            'condition' => ['required', 'string', Rule::in(['good', 'fair', 'poor', 'non-functional', 'non_functional'])],
            'remarks' => ['nullable', 'string', 'max:2000'],
            'qr_reference' => ['required', 'string', 'max:255'],
        ];
    }
}
