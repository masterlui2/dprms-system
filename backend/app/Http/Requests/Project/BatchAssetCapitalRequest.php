<?php

namespace App\Http\Requests\Project;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class BatchAssetCapitalRequest extends FormRequest
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
            'creates.*.name' => ['required', 'string', 'max:100'],
            'creates.*.amount' => ['required', 'numeric', 'min:0', 'decimal:0,2'],

            'updates' => ['sometimes', 'array'],
            'updates.*.id' => ['required', 'integer', 'exists:asset_capitals,id'],
            'updates.*.name' => ['sometimes', 'string', 'max:100'],
            'updates.*.amount' => ['sometimes', 'numeric', 'min:0', 'decimal:0,2'],

            'deletes' => ['sometimes', 'array'],
            'deletes.*' => ['integer', 'exists:asset_capitals,id'],
        ];
    }
}
