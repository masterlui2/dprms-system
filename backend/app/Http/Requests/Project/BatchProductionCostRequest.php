<?php

namespace App\Http\Requests\Project;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class BatchProductionCostRequest extends FormRequest
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
            'creates.*.particulars' => ['required', 'string', 'max:255'],
            'creates.*.type' => ['required', 'string', 'in:OPERATION,LABOR,MISCELLANEOUS'],
            'creates.*.month_1' => ['required', 'numeric', 'min:0', 'decimal:0,2'],
            'creates.*.month_2' => ['required', 'numeric', 'min:0', 'decimal:0,2'],
            'creates.*.month_3' => ['required', 'numeric', 'min:0', 'decimal:0,2'],

            'updates' => ['sometimes', 'array'],
            'updates.*.id' => ['required', 'integer', 'exists:production_costs,id'],
            'updates.*.particulars' => ['sometimes', 'string', 'max:255'],
            'updates.*.type' => ['required', 'string', 'in:OPERATION,LABOR,MISCELLANEOUS'],
            'updates.*.month_1' => ['sometimes', 'numeric', 'min:0', 'decimal:0,2'],
            'updates.*.month_2' => ['sometimes', 'numeric', 'min:0', 'decimal:0,2'],
            'updates.*.month_3' => ['sometimes', 'numeric', 'min:0', 'decimal:0,2'],

            'deletes' => ['sometimes', 'array'],
            'deletes.*' => ['integer', 'exists:production_costs,id'],
        ];
    }
}
