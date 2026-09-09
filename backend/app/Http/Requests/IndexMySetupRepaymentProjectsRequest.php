<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class IndexMySetupRepaymentProjectsRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user?->hasRole(['PROPONENT', 'MSME_PROPONENT'])
            && $user->canAccessProgram('SETUP');
    }

    public function rules(): array
    {
        return [];
    }
}
