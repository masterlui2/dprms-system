<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpsertSetupRepaymentScheduleRequest extends FormRequest
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
            'total_project_cost' => ['required', 'numeric', 'min:0.01', 'max:9999999999999.99'],
            'full_release_date' => ['required', 'date_format:Y-m-d'],
            'amortization_start_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:full_release_date'],
            'repayment_term_months' => ['required', 'integer', 'between:1,120'],
            'installments' => ['required', 'array', 'min:1', 'max:120'],
            'installments.*.period_label' => ['required', 'string', 'max:100', 'distinct'],
            'installments.*.amount' => ['required', 'numeric', 'min:0.01', 'max:9999999999999.99'],
            'installments.*.due_date' => [
                'required',
                'date_format:Y-m-d',
                'after_or_equal:amortization_start_date',
                'distinct',
            ],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $installments = $this->input('installments', []);
            $term = (int) $this->input('repayment_term_months');

            if (count($installments) !== $term) {
                $validator->errors()->add(
                    'installments',
                    'The installment count must match the repayment term.',
                );
            }

            $fundingCents = $this->toCents($this->input('total_project_cost'));
            $scheduledCents = collect($installments)
                ->sum(fn (array $row) => $this->toCents($row['amount'] ?? 0));

            if ($scheduledCents !== $fundingCents) {
                $validator->errors()->add(
                    'installments',
                    'The installment total must exactly match the total project cost.',
                );
            }

            $dates = collect($installments)->pluck('due_date')->all();
            if ($dates !== collect($dates)->sort()->values()->all()) {
                $validator->errors()->add(
                    'installments',
                    'Installment due dates must be in chronological order.',
                );
            }
        }];
    }

    private function toCents(mixed $amount): int
    {
        return (int) round((float) $amount * 100);
    }
}
