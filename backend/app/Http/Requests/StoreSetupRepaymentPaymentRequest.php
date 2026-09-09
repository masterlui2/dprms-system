<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSetupRepaymentPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $project = $this->route('project');
        $isOwner = $user?->hasRole(['PROPONENT', 'MSME_PROPONENT'])
            && $user->canAccessProgram('SETUP')
            && $project?->proposal?->submitted_by === $user->id;

        return $isOwner;
    }

    public function rules(): array
    {
        return [
            'amount_paid' => ['required', 'numeric', 'decimal:0,2', 'gt:0'],
            'or_number' => [
                'required',
                'string',
                'max:100',
                'regex:/^\d+$/',
                Rule::unique('repayment_transactions', 'or_number'),
            ],
            'bank_branch' => ['required', 'string', 'max:150'],
            'check_number' => ['required', 'string', 'max:100'],
            'check_date' => ['required', 'date'],
            'payment_date' => ['required', 'date', 'before_or_equal:today'],
            'payment_proof' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'or_number.regex' => 'The OR number must contain numbers only.',
        ];
    }
}
