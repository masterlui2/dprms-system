<?php

namespace App\Http\Requests\Project;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class StoreEmployeeRequest extends FormRequest
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
            'employee_name'       => ['required', 'string', 'max:100'],
            'age'                 => ['required', 'integer', 'min:15', 'max:100'],
            'status'              => ['required', Rule::in(['Regular', 'Contract-Based', 'Part-Timer', 'Project-Based'])],
            'gender'              => ['required', Rule::in(['Male', 'Female'])],
            'sectoral_group'      => ['required', Rule::in(['None', 'PWD', 'Senior'])],
            'days_of_attendance'  => ['required', 'integer', 'min:0', 'max:92'], // max ~3 months in a quarter
            'salary_rate'         => ['required', 'numeric', 'min:0', 'decimal:0,2'],
        ];
    }
}
