<?php

namespace App\Http\Requests\Project;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreExecutiveSummaryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check();
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'semester' => ['required', 'integer', 'in:1,2'],
            'year' => ['required', 'integer', 'digits:4'],
            'total_project_budget' => ['required', 'numeric', 'min:0', 'decimal:0,2'],
        ];
    }
}
