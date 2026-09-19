<?php

namespace App\Http\Requests;

use App\Models\Project;
use App\Support\ProgramAccess;
use Illuminate\Foundation\Http\FormRequest;

class ShowGiaMonitoringReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $project = $this->route('project');

        return $user
            && $project instanceof Project
            && $project->program_type === 'GIA'
            && $user->hasRole(['FOCAL', 'PROVINCIAL_DIRECTOR', 'PSTO_DIRECTOR', 'EXECOM_MEMBER', 'RPMO', 'SYSTEM_ADMIN'])
            && ProgramAccess::canReadProgram($user, 'GIA');
    }

    public function rules(): array
    {
        return [
            'year' => ['required', 'integer', 'between:2000,2100'],
            'semester' => ['required', 'integer', 'between:1,2'],
        ];
    }
}
