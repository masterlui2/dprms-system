<?php

namespace App\Http\Requests\Project;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class BatchAccomplishmentRequest extends FormRequest
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
            'creates.*.objectives' => ['required', 'string'],
            'creates.*.activities' => ['required', 'string'],
            'creates.*.target_milestones' => ['required', 'string'],
            'creates.*.weight' => ['required', 'numeric', 'min:0'],
            'creates.*.actual_accomplishment' => ['required', 'string'],
            'creates.*.actual' => ['required'],

            'updates' => ['sometimes', 'array'],
            'updates.*.id' => [
                'required', 'integer',
                Rule::exists('accomplishment_tbl', 'id')->where(fn ($q) => $q->where('executive_summary_id', $summaryId)),
            ],
            'updates.*.objectives' => ['sometimes', 'string'],
            'updates.*.activities' => ['sometimes', 'string'],
            'updates.*.target_milestones' => ['sometimes', 'string'],
            'updates.*.weight' => ['sometimes', 'numeric', 'min:0'],
            'updates.*.actual_accomplishment' => ['sometimes', 'string'],
            'updates.*.actual' => ['sometimes'],

            'deletes' => ['sometimes', 'array'],
            'deletes.*' => [
                'integer',
                Rule::exists('accomplishment_tbl', 'id')->where(fn ($q) => $q->where('executive_summary_id', $summaryId)),
            ],
        ];
    }
}
