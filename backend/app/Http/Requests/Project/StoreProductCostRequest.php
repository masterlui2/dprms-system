<?php

namespace App\Http\Requests\Project;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreProductCostRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Auth::check();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'particulars' => ['required', 'string', 'max:255'],
            'month_1'     => ['required', 'numeric', 'min:0', 'decimal:0,2'],
            'month_2'     => ['required', 'numeric', 'min:0', 'decimal:0,2'],
            'month_3'     => ['required', 'numeric', 'min:0', 'decimal:0,2'],
        ];
    }
}
