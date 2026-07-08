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
            'proposal_id' => 'required|exists:proposals,id',

            'business_name' => 'required|string|max:255',

            'business_type' => 'required|in:SOLE_PROPRIETORSHIP,PARTNERSHIP,CORPORATION,COOPERATIVE',

            'dti_sec_number' => 'required|string|max:100',

            'industry_sector' => 'required|string|max:255',

            'enterprise_size' => 'required|in:MICRO,SMALL,MEDIUM',

            'years_in_operation' => 'required|integer|min:0',

            'business_address' => 'required|string',

            'region' => 'required|string|max:100',

            'province' => 'required|string|max:100',

            'city_municipality' => 'required|string|max:100',

            'total_assets' => 'nullable|numeric|min:0',

            'number_of_employees' => 'nullable|integer|min:0',

            'annual_revenue' => 'nullable|numeric|min:0',
        ];
    }
}
