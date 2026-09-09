<?php

namespace App\Http\Requests\Project;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class BatchInterventionRequest extends FormRequest
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
            'creates.*.name' => ['required', 'string', 'max:255'],
            'creates.*.type' => ['required', 'string', 'in:CONSULTANCY,TRAINING,TECHNOLOGY,TESTING,OTHERS'],
            'creates.*.availed' => ['required', 'boolean'],
            'creates.*.intervention' => ['required', 'string', 'max:255'],
            'creates.*.date' => ['required', 'date'],

            'updates' => ['sometimes', 'array'],
            'updates.*.id' => ['required', 'integer', 'exists:interventions,id'],
            'updates.*.name' => ['sometimes', 'string', 'max:255'],
            'updates.*.type' => ['sometimes', 'string', 'in:CONSULTANCY,TRAINING,TECHNOLOGY,TESTING,OTHERS'],
            'updates.*.availed' => ['sometimes', 'boolean'],
            'updates.*.intervention' => ['sometimes', 'string', 'max:255'],
            'updates.*.date' => ['sometimes', 'date'],

            'deletes' => ['sometimes', 'array'],
            'deletes.*' => ['integer', 'exists:interventions,id'],
        ];
    }
}
