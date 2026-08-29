<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProposalReviewDecisionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'decision' => [
                'required',
                'string',
                Rule::in([
                    'return_for_revision',
                    'endorse_to_focal',
                    'approve',
                    'disapprove',
                    'advance_stage',
                    'RETURNED',
                    'ENDORSED_TO_FOCAL',
                ]),
            ],
            'findings' => [
                'nullable',
                'string',
                'max:5000',
                'required_if:decision,return_for_revision',
            ],
            'remarks' => [
                'nullable',
                'string',
                'max:5000',
            ],
            'focal_id' => [
                'nullable',
                'integer',
                'exists:users,id',
            ],
            'assigned_evaluator_id' => [
                'nullable',
                'integer',
                'exists:users,id',
            ],
        ];
    }
}
