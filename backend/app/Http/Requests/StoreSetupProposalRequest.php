<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreSetupProposalRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'proposal_id' => 'required|exists:proposals,id',

            'business_name' => 'required|string|max:255',

            'business_type' => 'required|in:SOLE_PROPRIETORSHIP,PARTNERSHIP,CORPORATION,COOPERATIVE',

            'industry_sector' => 'required|string|max:255',

            'enterprise_size' => 'required|in:MICRO,SMALL,MEDIUM',

            'years_in_operation' => 'required|integer|min:0',

            'business_address' => 'required|string',

        ];
    }
}
