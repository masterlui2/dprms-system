<?php

namespace App\Http\Requests;

use App\Models\Project;
use App\Support\ProgramAccess;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSiteVisitRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $project = Project::query()->find($this->integer('project_id'));

        return $user
            && $project
            && $project->status === 'active'
            && ProgramAccess::canWriteMonitoring($user, $project->program_type);
    }

    public function rules(): array
    {
        return [
            'project_id' => ['required', 'integer', 'exists:projects,id'],
            'scheduled_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'purpose' => [
                'required',
                Rule::in(['PRE_IMPLEMENTATION', 'EQUIPMENT_ARRIVAL', 'QUARTERLY_MONITORING', 'ENERGY_AUDIT']),
            ],
            'assigned_user_ids' => ['required', 'array', 'min:1', 'max:20'],
            'assigned_user_ids.*' => ['integer', 'distinct', 'exists:users,id'],
            'facility_location' => ['required', 'string', 'max:500'],
            'proponent_instructions' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
