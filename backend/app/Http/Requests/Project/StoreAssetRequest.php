<?php

namespace App\Http\Requests\Project;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreAssetRequest extends FormRequest
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
            'asset_name'       => ['required', 'string', 'max:100'],
            'type'       => ['required', 'string', 'max:100'],
            'lifespan'      => ['required', 'integer', 'min:1'],
            'year_acquired' => ['required', 'integer', 'digits:4', 'min:1900', 'max:' . date('Y')],
            'cost'          => ['required', 'numeric', 'min:0', 'max:9999999999999.99'],
        ];
    }
}
