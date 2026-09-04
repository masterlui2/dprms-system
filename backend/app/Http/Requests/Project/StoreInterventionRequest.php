<?php

namespace App\Http\Requests\Project;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreInterventionRequest extends FormRequest
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
            'name'          => ['required', 'string', 'max:255'],
            'type'          => ['required', 'string', 'in:CONSULTANCY,TRAINING,TECHNOLOGY,TESTING,OTHERS'],
            'availed'       => ['required', 'boolean'],
            'intervention'  => ['required', 'string', 'max:255'],
            'date'          => ['required', 'date'],
        ];
    }
}
