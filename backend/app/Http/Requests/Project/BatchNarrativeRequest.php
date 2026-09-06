<?php

namespace App\Http\Requests\Project;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class BatchNarrativeRequest extends FormRequest
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
            'creates.*.particular' => ['required', 'string', 'max:255'],
            'creates.*.type' => ['required', 'string', 'in:PROBLEMS,PLANS'],
            'creates.*.intervention' => ['required', 'string'],

            'updates' => ['sometimes', 'array'],
            'updates.*.id' => ['required', 'integer', 'exists:narratives,id'],
            'updates.*.particular' => ['sometimes', 'string', 'max:255'],
            'updates.*.type' => ['sometimes', 'string', 'in:PROBLEMS,PLANS'],
            'updates.*.intervention' => ['sometimes', 'string'],

            'deletes' => ['sometimes', 'array'],
            'deletes.*' => ['integer', 'exists:narratives,id'],
        ];
    }
}
