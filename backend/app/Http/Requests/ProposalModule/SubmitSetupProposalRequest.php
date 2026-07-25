<?php

namespace App\Http\Requests\ProposalModule;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class SubmitSetupProposalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check();
    }

    public function rules(): array
    {
        return [
            // Proposal fields
            'title' => 'required|string|max:500',
            'remarks' => 'nullable|string',

            // SetupProposal fields
            'business_name' => 'required|string|max:255',
            'business_type' => 'required|in:SOLE-PROPRIETORSHIP,PARTNERSHIP,CORPORATION,COOPERATIVE',
            'industry_sector' => 'required|string|max:255',
            'enterprise_size' => 'required|in:MICRO,SMALL,MEDIUM',
            'years_in_operation' => 'required|integer|min:0',
            'business_address' => 'required|string',
            'form_snapshot' => 'required|array',
        ];
    }
}
