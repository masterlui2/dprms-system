<?php

namespace App\Http\Requests;

use App\Models\Project;
use App\Support\ProgramAccess;
use Illuminate\Foundation\Http\FormRequest;

class SaveGiaMonitoringReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $project = $this->route('project');

        return $user
            && $project instanceof Project
            && $project->program_type === 'GIA'
            && $user->hasRole('FOCAL')
            && ProgramAccess::canWriteMonitoring($user, 'GIA');
    }

    public function rules(): array
    {
        return [
            'year' => ['required', 'integer', 'between:2000,2100'],
            'semester' => ['required', 'integer', 'between:1,2'],
            'form_data' => ['required', 'array'],
            'form_data.projectLeaderGender' => ['nullable', 'string', 'max:255'],
            'form_data.agency' => ['nullable', 'string', 'max:255'],
            'form_data.addressContact' => ['nullable', 'string', 'max:1000'],
            'form_data.cooperatingAgencies' => ['nullable', 'string', 'max:2000'],
            'form_data.baseStation' => ['nullable', 'string', 'max:500'],
            'form_data.sitesOfImplementation' => ['nullable', 'string', 'max:1000'],
            'form_data.durationMonths' => ['nullable', 'integer', 'between:0,1200'],
            'form_data.startDate' => ['nullable', 'string', 'max:100'],
            'form_data.endDate' => ['nullable', 'string', 'max:100'],
            'form_data.totalBudget' => ['nullable', 'numeric', 'min:0'],
            'form_data.accomplishments' => ['present', 'array', 'max:100'],
            'form_data.accomplishments.*.id' => ['required', 'string', 'max:100'],
            'form_data.accomplishments.*.objective' => ['nullable', 'string', 'max:5000'],
            'form_data.accomplishments.*.objectiveWeight' => ['nullable', 'numeric', 'between:0,100'],
            'form_data.accomplishments.*.activities' => ['nullable', 'string', 'max:10000'],
            'form_data.accomplishments.*.targetAccomplishment' => ['nullable', 'string', 'max:5000'],
            'form_data.accomplishments.*.targetWeightY1' => ['nullable', 'numeric', 'between:0,100'],
            'form_data.accomplishments.*.targetWeightY2' => ['nullable', 'numeric', 'between:0,100'],
            'form_data.accomplishments.*.targetWeightY3' => ['nullable', 'numeric', 'between:0,100'],
            'form_data.accomplishments.*.actualAccomplishment' => ['nullable', 'string', 'max:10000'],
            'form_data.accomplishments.*.actualY1Percent' => ['nullable', 'numeric', 'between:0,100'],
            'form_data.accomplishments.*.actualY2Percent' => ['nullable', 'numeric', 'between:0,100'],
            'form_data.accomplishments.*.actualY3Percent' => ['nullable', 'numeric', 'between:0,100'],
            'form_data.accomplishments.*.remarks' => ['nullable', 'string', 'max:5000'],
            'form_data.catchUpPlan' => ['nullable', 'string', 'max:20000'],
            'form_data.outputs' => ['present', 'array', 'max:100'],
            'form_data.outputs.*.id' => ['required', 'string', 'max:100'],
            'form_data.outputs.*.category' => ['nullable', 'string', 'max:255'],
            'form_data.outputs.*.targetY1' => ['nullable', 'numeric', 'min:0'],
            'form_data.outputs.*.targetY2' => ['nullable', 'numeric', 'min:0'],
            'form_data.outputs.*.targetY3' => ['nullable', 'numeric', 'min:0'],
            'form_data.outputs.*.actualFigureY1' => ['nullable', 'numeric', 'min:0'],
            'form_data.outputs.*.actualDescY1' => ['nullable', 'string', 'max:10000'],
            'form_data.outputs.*.actualFigureY2' => ['nullable', 'numeric', 'min:0'],
            'form_data.outputs.*.actualDescY2' => ['nullable', 'string', 'max:10000'],
            'form_data.outputs.*.actualFigureY3' => ['nullable', 'numeric', 'min:0'],
            'form_data.outputs.*.actualDescY3' => ['nullable', 'string', 'max:10000'],
            'form_data.problemConcern' => ['nullable', 'string', 'max:20000'],
            'form_data.suggestedSolution' => ['nullable', 'string', 'max:20000'],
            'form_data.preparedBy' => ['nullable', 'string', 'max:255'],
            'form_data.reviewedBy' => ['nullable', 'string', 'max:255'],
            'form_data.approvedBy' => ['nullable', 'string', 'max:255'],
        ];
    }
}
