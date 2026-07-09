<?php

namespace App\Providers;

use App\Models\DocumentRequirement;
use App\Models\ProposalTemplate;
use App\Repositories\AuthorizationModule\RoleRepository;
use App\Repositories\AuthorizationModule\UserRepository;
use App\Repositories\AuthorizationModule\UserRoleRepository;
use App\Repositories\AuthorizationModule\AuditLogRepository;
use App\Repositories\Contracts\AuthorizationModule\UserRepositoryInterface;
use App\Repositories\Contracts\AuthorizationModule\RoleRepositoryInterface;
use App\Repositories\Contracts\AuthorizationModule\UserRoleRepositoryInterface;
use App\Repositories\Contracts\AuthorizationModule\AuditLogRepositoryInterface;
use App\Repositories\Contracts\ProposalModule\DocumentRequirementRepositoryInterface;
use App\Repositories\Contracts\ProposalModule\GiaCoAuthorRepositoryInterface;
use App\Repositories\Contracts\ProposalModule\GiaDocumentRepositoryInterface;
use App\Repositories\Contracts\ProposalModule\GiaProposalRepositoryInterface;
use App\Repositories\Contracts\ProposalModule\ProposalRepositoryInterface;
use App\Repositories\Contracts\ProposalModule\ProposalTemplateRepositoryInterface;
use App\Repositories\Contracts\ProposalModule\SetupEquipmentQuotationRepositoryInterface;
use App\Repositories\Contracts\ProposalModule\SetupFinancialDocumentRepositoryInterface;
use App\Repositories\Contracts\ProposalModule\SetupProposalRepositoryInterface;
use App\Repositories\ProposalModule\DocumentRequirementRepository;
use App\Repositories\ProposalModule\GiaCoAuthorRepository;
use App\Repositories\ProposalModule\GiaDocumentRepository;
use App\Repositories\ProposalModule\GiaProposalRepository;
use App\Repositories\ProposalModule\ProposalRepository;
use App\Repositories\ProposalModule\ProposalTemplateRepository;
use App\Repositories\ProposalModule\SetupEquipmentQuotationRepository;
use App\Repositories\ProposalModule\SetupFinancialDocumentRepository;
use App\Repositories\ProposalModule\SetupProposalRepository;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->bind(UserRepositoryInterface::class, UserRepository::class);
        $this->app->bind(RoleRepositoryInterface::class, RoleRepository::class);
        $this->app->bind(UserRoleRepositoryInterface::class, UserRoleRepository::class);
        $this->app->bind(AuditLogRepositoryInterface::class, AuditLogRepository::class);

        $this->app->bind(ProposalRepositoryInterface::class, ProposalRepository::class);
        $this->app->bind(ProposalTemplateRepositoryInterface::class, ProposalTemplateRepository::class);
        $this->app->bind(DocumentRequirementRepositoryInterface::class, DocumentRequirementRepository::class);
        $this->app->bind(SetupProposalRepositoryInterface::class, SetupProposalRepository::class);
        $this->app->bind(SetupFinancialDocumentRepositoryInterface::class, SetupFinancialDocumentRepository::class);
        $this->app->bind(SetupEquipmentQuotationRepositoryInterface::class, SetupEquipmentQuotationRepository::class);
        $this->app->bind(GiaCoAuthorRepositoryInterface::class, GiaCoAuthorRepository::class);
        $this->app->bind(GiaDocumentRepositoryInterface::class, GiaDocumentRepository::class);
        $this->app->bind(GiaProposalRepositoryInterface::class, GiaProposalRepository::class);
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
