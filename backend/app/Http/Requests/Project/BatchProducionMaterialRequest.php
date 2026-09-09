<?php

namespace App\Http\Requests\Project;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class BatchProducionMaterialRequest extends FormRequest
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
            'creates.*.materials' => ['required', 'string', 'max:255'],
            'creates.*.unit' => ['required', 'string', 'max:255'],
            'creates.*.quantity' => ['required', 'integer', 'min:0'],
            'creates.*.cost' => ['required', 'integer', 'min:0'],

            'updates' => ['sometimes', 'array'],
            'updates.*.id' => ['required', 'integer', 'exists:production_materials,id'],
            'updates.*.materials' => ['sometimes', 'string', 'max:255'],
            'updates.*.unit' => ['sometimes', 'string', 'max:255'],
            'updates.*.quantity' => ['sometimes', 'integer', 'min:0'],
            'updates.*.cost' => ['sometimes', 'integer', 'min:0'],

            'deletes' => ['sometimes', 'array'],
            'deletes.*' => ['integer', 'exists:production_materials,id'],
        ];
    }
}
