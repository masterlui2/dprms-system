<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdvanceStageRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => [
                'required',
                Rule::in(['DRAFT', 'SUBMITTED','UNDER_VALIDATION','ENDORSED_TO_RPMO','UNDER_SCREENING', 'ENDORSED_TO_RTEC', 'UNDER_EVALUATION', 'ENDORSED_TO_DIRECTOR', 'APPROVED','DISAPPROVED', 'RETURNED']),
            ],
            'stage' =>[
                'required',
                Rule::in(['DRAFT', 'SUBMITTED','UNDER_VALIDATION','ENDORSED_TO_RPMO','UNDER_SCREENING', 'ENDORSED_TO_RTEC', 'UNDER_EVALUATION', 'ENDORSED_TO_DIRECTOR', 'APPROVED','DISAPPROVED', 'RETURNED']),
            ],
        ];
    }
}
