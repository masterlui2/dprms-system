<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ResolveEquipmentQrRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole(['PROJECT_STAFF', 'FOCAL']) ?? false;
    }

    public function rules(): array
    {
        return [
            'qr_data' => ['required', 'string', 'max:2000'],
            'device_type' => ['nullable', 'string', 'max:100'],
            'browser' => ['nullable', 'string', 'max:100'],
        ];
    }
}
