<?php

namespace App\Http\Requests\Project;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class BatchMarketRequest extends FormRequest
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
            'creates.*.market_name' => ['required', 'string', 'max:255'],
            'creates.*.address' => ['required', 'string', 'max:255'],
            'creates.*.condition' => ['required', 'string', 'in:old,new'],
            'creates.*.effective_date' => ['required', 'date_format:Y-m-d'],
            'creates.*.contact_person' => ['required', 'string', 'max:255'],
            'creates.*.service' => ['required', 'string', 'max:255'],
            'creates.*.volume' => ['required', 'string', 'max:255'],

            'updates' => ['sometimes', 'array'],
            'updates.*.id' => ['required', 'integer', 'exists:markets,id'],
            'updates.*.market_name' => ['sometimes', 'string', 'max:255'],
            'updates.*.address' => ['sometimes', 'string', 'max:255'],
            'updates.*.condition' => ['sometimes', 'string', 'in:old,new'],
            'updates.*.effective_date' => ['sometimes', 'date_format:Y-m-d'],
            'updates.*.contact_person' => ['sometimes', 'string', 'max:255'],
            'updates.*.service' => ['sometimes', 'string', 'max:255'],
            'updates.*.volume' => ['sometimes', 'string', 'max:255'],

            'deletes' => ['sometimes', 'array'],
            'deletes.*' => ['integer', 'exists:markets,id'],
        ];
    }
}
