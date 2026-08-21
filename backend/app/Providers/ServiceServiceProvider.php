<?php

namespace App\Providers;

use App\Services\AuthorizationModule\AuthService;
use App\Services\Contracts\AuthorizationModule\AuthServiceInterface;
use App\Services\Contracts\ProposalModule\DocumentsServiceInterface;
use App\Services\Contracts\ProposalModule\GiaProposalServiceInterface;
use App\Services\Contracts\ProposalModule\GiaSubmissionServiceInterface;
use App\Services\Contracts\ProposalModule\ProposalServiceInterface;
use App\Services\Contracts\ProposalModule\ProposalTemplateServiceInterface;
use App\Services\Contracts\ProposalModule\ReferenceNumberGeneratorServiceInterface;
use App\Services\Contracts\ProposalModule\SetupProposalServiceInterface;
use App\Services\Contracts\ProposalModule\SetupSubmissionServiceInterface;
use App\Services\ProposalModule\DocumentsService;
use App\Services\ProposalModule\GiaProposalService;
use App\Services\ProposalModule\GiaSubmissionService;
use App\Services\ProposalModule\ProposalService;
use App\Services\ProposalModule\ProposalTemplateService;
use App\Services\ProposalModule\ReferenceNumberGeneratorService;
use App\Services\ProposalModule\SetupProposalService;
use App\Services\ProposalModule\SetupSubmissionService;
use Illuminate\Support\ServiceProvider;

class ServiceServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(AuthServiceInterface::class, AuthService::class);
        $this->app->bind(ProposalTemplateServiceInterface::class, ProposalTemplateService::class);
        $this->app->bind(ReferenceNumberGeneratorServiceInterface::class, ReferenceNumberGeneratorService::class);
        $this->app->bind(ProposalServiceInterface::class, ProposalService::class);
        $this->app->bind(DocumentsServiceInterface::class, DocumentsService::class);
        $this->app->bind(SetupProposalServiceInterface::class, SetupProposalService::class);
        $this->app->bind(SetupSubmissionServiceInterface::class, SetupSubmissionService::class);
        $this->app->bind(GiaSubmissionServiceInterface::class, GiaSubmissionService::class);
        $this->app->bind(GiaProposalServiceInterface::class, GiaProposalService::class);
    }
}
