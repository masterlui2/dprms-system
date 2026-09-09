<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreChecklistTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'program_type' => ['required', 'string', 'in:SETUP,GIA'],
            'phase_code' => ['required', 'string', 'max:50'],
            'phase_title' => ['required', 'string', 'max:255'],
            'item_code' => ['required', 'string', 'max:100', 'unique:document_checklist_templates,item_code'],
            'document_name' => ['required', 'string', 'max:255'],
            'group_name' => ['required', 'string', 'max:255'],
            'is_mandatory' => ['boolean'],
            'sort_order' => ['integer'],
            'applicability_rules' => ['nullable', 'array'],
        ];
    }
}
