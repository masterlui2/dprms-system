<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BatchSaveChecklistRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'overall_remarks' => ['nullable', 'string'],
            'items' => ['nullable', 'array'],
            'items.*.id' => ['nullable', 'string'],
            'items.*.template_id' => ['nullable', 'integer'],
            'items.*.is_present' => ['nullable', 'boolean'],
            'items.*.status' => ['nullable', 'string', 'in:Complied,Missing,Under Review,Needs Revision'],
            'items.*.remarks' => ['nullable', 'string'],
        ];
    }
}
