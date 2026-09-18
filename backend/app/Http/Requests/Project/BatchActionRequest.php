<?php

namespace App\Http\Requests\Project;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class BatchActionRequest extends FormRequest
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
            'creates.*.cooperating_agency' => ['required', 'string', 'max:255'],
            'creates.*.plan' => ['required', 'string'],
            'creates.*.solutions' => ['required', 'string'],
            'creates.*.concern' => ['required', 'string'],

            'updates' => ['sometimes', 'array'],
            'updates.*.id' => [
                'required', 'integer',
                Rule::exists('actions_tbl', 'id')->where(fn ($q) => $q->where('executive_summary_id', $summaryId)),
            ],
            'updates.*.cooperating_agency' => ['sometimes', 'string', 'max:255'],
            'updates.*.plan' => ['sometimes', 'string'],
            'updates.*.solutions' => ['sometimes', 'string'],
            'updates.*.concern' => ['sometimes', 'string'],

            'deletes' => ['sometimes', 'array'],
            'deletes.*' => [
                'integer',
                Rule::exists('actions_tbl', 'id')->where(fn ($q) => $q->where('executive_summary_id', $summaryId)),
            ],
        ];
    }
}
