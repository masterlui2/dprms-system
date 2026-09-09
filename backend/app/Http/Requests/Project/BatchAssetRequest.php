<?php

namespace App\Http\Requests\Project;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class BatchAssetRequest extends FormRequest
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
            'creates.*.asset_name' => ['required', 'string', 'max:100'],
            'creates.*.type' => ['required', 'string', 'max:100'],
            'creates.*.lifespan' => ['required', 'integer', 'min:1'],
            'creates.*.year_acquired' => ['required', 'integer', 'digits:4', 'min:1900', 'max:' . date('Y')],
            'creates.*.cost' => ['required', 'numeric', 'min:0', 'max:9999999999999.99'],

            'updates' => ['sometimes', 'array'],
            'updates.*.id' => ['required', 'integer', 'exists:assets,id'],
            'updates.*.asset_name' => ['sometimes', 'string', 'max:100'],
            'updates.*.type' => ['sometimes', 'string', 'max:100'],
            'updates.*.lifespan' => ['sometimes', 'integer', 'min:1'],
            'updates.*.year_acquired' => ['sometimes', 'integer', 'digits:4', 'min:1900', 'max:' . date('Y')],
            'updates.*.cost' => ['sometimes', 'numeric', 'min:0', 'max:9999999999999.99'],

            'deletes' => ['sometimes', 'array'],
            'deletes.*' => ['integer', 'exists:assets,id'],
        ];
    }
}
