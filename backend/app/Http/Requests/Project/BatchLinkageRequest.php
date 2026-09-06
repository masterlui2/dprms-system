<?php

namespace App\Http\Requests\Project;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class BatchLinkageRequest extends FormRequest
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
            'creates.*.type' => ['required', 'string', 'in:forward,backward'],
            'creates.*.male_quantity' => ['required', 'integer', 'min:0'],
            'creates.*.female_quantity' => ['required', 'integer', 'min:0'],

            'updates' => ['sometimes', 'array'],
            'updates.*.id' => ['required', 'integer', 'exists:linkages,id'],
            'updates.*.name' => ['sometimes', 'string', 'max:255'],
            'updates.*.type' => ['sometimes', 'string', 'in:forward,backward'],
            'updates.*.male_quantity' => ['sometimes', 'integer', 'min:0'],
            'updates.*.female_quantity' => ['sometimes', 'integer', 'min:0'],

            'deletes' => ['sometimes', 'array'],
            'deletes.*' => ['integer', 'exists:linkages,id'],
        ];
    }
}
