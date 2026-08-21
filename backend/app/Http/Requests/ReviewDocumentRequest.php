<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReviewDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => [
                'required',
                Rule::in(['approved', 'returned_for_revision']),
            ],
            'remarks' => [
                'nullable',
                'string',
                'max:1000',
                'required_if:status,returned_for_revision',
            ],
        ];
    }
}
