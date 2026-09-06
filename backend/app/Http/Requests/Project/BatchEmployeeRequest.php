<?php

namespace App\Http\Requests\Project;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class BatchEmployeeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Auth::check();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'creates' => ['sometimes', 'array'],
            'creates.*.temp_id' => ['sometimes', 'string'],
            'creates.*.employee_name' => ['required', 'string', 'max:100'],
            'creates.*.age' => ['required', 'integer', 'min:15', 'max:100'],
            'creates.*.status' => ['required', Rule::in(['Regular', 'Contract-Based', 'Part-Timer', 'Project-Based'])],
            'creates.*.gender' => ['required', Rule::in(['Male', 'Female'])],
            'creates.*.sectoral_group' => ['required', Rule::in(['None', 'PWD', 'Senior'])],
            'creates.*.days_of_attendance' => ['required', 'integer', 'min:0', 'max:92'],
            'creates.*.salary_rate' => ['required', 'numeric', 'min:0', 'decimal:0,2'],

            'updates' => ['sometimes', 'array'],
            'updates.*.id' => ['required', 'integer', 'exists:employees,id'],
            'updates.*.employee_name' => ['sometimes', 'string', 'max:100'],
            'updates.*.age' => ['sometimes', 'integer', 'min:15', 'max:100'],
            'updates.*.status' => ['sometimes', Rule::in(['Regular', 'Contract-Based', 'Part-Timer', 'Project-Based'])],
            'updates.*.gender' => ['sometimes', Rule::in(['Male', 'Female'])],
            'updates.*.sectoral_group' => ['sometimes', Rule::in(['None', 'PWD', 'Senior'])],
            'updates.*.days_of_attendance' => ['sometimes', 'integer', 'min:0', 'max:92'],
            'updates.*.salary_rate' => ['sometimes', 'numeric', 'min:0', 'decimal:0,2'],

            'deletes' => ['sometimes', 'array'],
            'deletes.*' => ['integer', 'exists:employees,id'],
        ];
    }
}
