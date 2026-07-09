<?php

namespace App\Providers;

use App\Services\AuthorizationModule\AuthService;
use App\Services\Contracts\AuthorizationModule\AuthServiceInterface;
use App\Services\Contracts\ProposalModule\ProposalServiceInterface;
use App\Services\Contracts\ProposalModule\ProposalTemplateServiceInterface;
use App\Services\Contracts\ProposalModule\ReferenceNumberGeneratorServiceInterface;
use App\Services\ProposalModule\ProposalService;
use App\Services\ProposalModule\ProposalTemplateService;
use App\Services\ProposalModule\ReferenceNumberGeneratorService;
use Illuminate\Support\ServiceProvider;

class ServiceServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(AuthServiceInterface::class, AuthService::class);
        $this->app->bind(ProposalTemplateServiceInterface::class, ProposalTemplateService::class);
        $this->app->bind(ReferenceNumberGeneratorServiceInterface::class, ReferenceNumberGeneratorService::class);
        $this->app->bind(ProposalServiceInterface::class, ProposalService::class);
    }
}
