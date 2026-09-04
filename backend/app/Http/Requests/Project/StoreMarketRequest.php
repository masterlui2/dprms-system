<?php

namespace App\Http\Requests\Project;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreMarketRequest extends FormRequest
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
            'market_name'    => ['required', 'string', 'max:255'],
            'address'        => ['required', 'string', 'max:255'],
            'condition'      => ['required', 'string', 'in:old,new'],
            'effective_date' => ['required', 'date'],
            'contact_person' => ['required', 'string', 'max:255'],
            'service'        => ['required', 'string', 'max:255'],
            'volume'         => ['required', 'string', 'max:255'],
        ];
    }
}
