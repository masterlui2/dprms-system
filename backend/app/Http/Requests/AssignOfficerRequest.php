<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class AssignOfficerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'assigned_staff_id' => ['nullable', 'integer', 'exists:users,id'],
            'assigned_focal_id' => ['nullable', 'integer', 'exists:users,id'],
            'staff_id' => ['nullable', 'integer', 'exists:users,id'],
            'focal_id' => ['nullable', 'integer', 'exists:users,id'],
            'remarks' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $hasStaff = $this->filled('assigned_staff_id') || $this->filled('staff_id');
            $hasFocal = $this->filled('assigned_focal_id') || $this->filled('focal_id');

            if (! $hasStaff && ! $hasFocal) {
                $validator->errors()->add(
                    'officer',
                    'At least one officer (staff or focal) must be specified for assignment.'
                );
            }
        });
    }
}
