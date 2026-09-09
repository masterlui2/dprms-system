<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEquipmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole(['PROJECT_STAFF', 'FOCAL']) ?? false;
    }

    public function rules(): array
    {
        return [
            'program_type' => ['required', 'string', Rule::in(['SETUP', 'GIA'])],
            'project_id' => ['required', 'integer', 'exists:projects,id'],
            'category_id' => ['required', 'integer', Rule::exists('equipment_categories', 'id')->where('is_active', true)],
            'equipment_name' => ['required', 'string', 'max:255'],
            'brand' => ['required', 'string', 'max:255'],
            'model' => ['required', 'string', 'max:255'],
            'serial_number' => ['required', 'string', 'max:255', Rule::unique('equipment_registries', 'serial_number')],
            'property_number' => ['nullable', 'string', 'max:100', Rule::unique('equipment_registries', 'property_number')],
            'unit' => ['required', 'string', 'max:50'],
            'acquisition_cost' => ['required', 'numeric', 'min:0', 'decimal:0,2'],
            'acquisition_date' => ['required', 'date', 'before_or_equal:today'],
            'installed_at' => ['nullable', 'date', 'after_or_equal:acquisition_date', 'before_or_equal:today'],
            'supplier_name' => ['required', 'string', 'max:255'],
            'location' => ['required', 'string', 'max:500'],
            'current_condition' => ['required', 'string', Rule::in(['GOOD', 'FAIR', 'POOR', 'NON_FUNCTIONAL'])],
            'specifications' => ['nullable', 'string', 'max:3000'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
