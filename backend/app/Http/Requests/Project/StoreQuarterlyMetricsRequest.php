<?php

namespace App\Http\Requests\Project;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class StoreQuarterlyMetricsRequest extends FormRequest
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
            'quarter'    => ['required', 'integer', 'between:1,4'],
            'year'       => [
                'required',
                'integer',
                'digits:4',
                Rule::unique('quarterly_metrics')->where(fn ($q) => $q
                    ->where('project_id', $this->input('project_id'))
                    ->where('quarter', $this->input('quarter'))
                ),
            ],
        ];
    }
}
