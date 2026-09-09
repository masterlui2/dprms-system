<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class VerifySetupRepaymentPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user?->hasRole(['FOCAL', 'SSCP_FOCAL', 'SETUP_FOCAL'])
            && $user->canAccessProgram('SETUP');
    }

    public function rules(): array
    {
        return [
            'decision' => ['required', Rule::in(['verified', 'rejected'])],
            'remarks' => ['nullable', 'required_if:decision,rejected', 'string', 'max:1000'],
        ];
    }
}
