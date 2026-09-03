<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexGiaMonitoringProjectsRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user) {
            return false;
        }

        return $user->hasRole('PROVINCIAL_DIRECTOR')
            || ($user->hasRole('FOCAL') && $user->program_type === 'GIA');
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:150'],
            'agency' => ['nullable', 'string', 'max:255'],
            'status' => [
                'nullable',
                Rule::in(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SUSPENDED', 'TERMINATED']),
            ],
            'year' => ['nullable', 'integer', 'min:2000', 'max:2100'],
            'semester' => ['nullable', 'integer', 'between:1,2'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
