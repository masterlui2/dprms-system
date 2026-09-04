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
            'remarks' => [
                Rule::requiredIf(fn () => in_array($this->input('condition'), ['poor', 'non-functional', 'non_functional'], true)),
                'nullable',
                'string',
                'max:3000',
            ],
            'recommendations' => ['nullable', 'string', 'max:3000'],
            'inspection_date' => ['nullable', 'date', 'before_or_equal:today'],
            'photos' => ['nullable', 'array', 'max:5'],
            'photos.*' => ['file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'qr_reference' => ['required', 'string', 'max:255'],
        ];
    }
}
