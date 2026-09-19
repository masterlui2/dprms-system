<?php

namespace App\Http\Requests;

use App\Support\ProgramAccess;
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

        return $user->hasRole(['FOCAL', 'PROVINCIAL_DIRECTOR', 'PSTO_DIRECTOR', 'EXECOM_MEMBER', 'RPMO', 'SYSTEM_ADMIN'])
            && ProgramAccess::canReadProgram($user, 'GIA');
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
