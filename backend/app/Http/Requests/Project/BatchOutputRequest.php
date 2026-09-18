<?php

namespace App\Http\Requests\Project;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class BatchOutputRequest extends FormRequest
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
        $summaryId = $this->route('summaryId');

        return [
            'creates' => ['sometimes', 'array'],
            'creates.*.temp_id' => ['sometimes', 'string'],
            'creates.*.expected_output' => ['required', 'string'],
            'creates.*.target' => ['required', 'numeric'],
            'creates.*.actual' => ['required', 'numeric'],
            'creates.*.description' => ['sometimes', 'nullable', 'string'],

            'updates' => ['sometimes', 'array'],
            'updates.*.id' => [
                'required', 'integer',
                Rule::exists('outputs_tbl', 'id')->where(fn ($q) => $q->where('executive_summary_id', $summaryId)),
            ],
            'updates.*.expected_output' => ['sometimes', 'string'],
            'updates.*.target' => ['sometimes', 'numeric'],
            'updates.*.actual' => ['sometimes', 'numeric'],
            'updates.*.description' => ['sometimes', 'nullable', 'string'],

            'deletes' => ['sometimes', 'array'],
            'deletes.*' => [
                'integer',
                Rule::exists('outputs_tbl', 'id')->where(fn ($q) => $q->where('executive_summary_id', $summaryId)),
            ],
        ];
    }
}
