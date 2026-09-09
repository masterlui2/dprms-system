<?php

namespace App\Http\Requests\Project;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class BatchProductRequest extends FormRequest
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
            'creates.*.product_name' => ['required', 'string', 'max:100'],
            'creates.*.specifications' => ['required', 'string', 'max:100'],
            'creates.*.unit' => ['required', 'string', 'max:255'],
            'creates.*.price' => ['required', 'numeric', 'min:0', 'decimal:0,2'],
            'creates.*.quantity' => ['required', 'integer', 'min:0'],

            'updates' => ['sometimes', 'array'],
            'updates.*.id' => ['required', 'integer', 'exists:products,id'],
            'updates.*.product_name' => ['sometimes', 'string', 'max:100'],
            'updates.*.specifications' => ['sometimes', 'string', 'max:100'],
            'updates.*.unit' => ['sometimes', 'string', 'max:255'],
            'updates.*.price' => ['sometimes', 'numeric', 'min:0', 'decimal:0,2'],
            'updates.*.quantity' => ['sometimes', 'integer', 'min:0'],

            'deletes' => ['sometimes', 'array'],
            'deletes.*' => ['integer', 'exists:products,id'],
        ];
    }
}
