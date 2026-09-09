<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ShowSetupRepaymentLedgerRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user) {
            return false;
        }

        $isDirector = $user->hasRole(['PROVINCIAL_DIRECTOR', 'PSTO_DIRECTOR']);
        $isSetupFocal = $user->hasRole(['FOCAL', 'SSCP_FOCAL', 'SETUP_FOCAL'])
            && $user->canAccessProgram('SETUP');
        $isSetupProponent = $user->hasRole(['PROPONENT', 'MSME_PROPONENT'])
            && $user->canAccessProgram('SETUP');

        return $isDirector || $isSetupFocal || $isSetupProponent;
    }

    public function rules(): array
    {
        return [];
    }
}
