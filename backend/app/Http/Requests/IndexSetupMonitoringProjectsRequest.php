<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class IndexSetupMonitoringProjectsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->canAccessProgram('SETUP') ?? false;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:150'],
            'district' => ['nullable', 'string', 'max:100'],
            'year' => ['nullable', 'integer', 'min:2000', 'max:2100'],
            'quarter' => ['nullable', 'integer', 'between:1,4'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
