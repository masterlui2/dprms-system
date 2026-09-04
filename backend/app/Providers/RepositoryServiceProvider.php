<?php

namespace App\Providers;

use App\Models\DocumentRequirement;
use App\Models\ProposalTemplate;
use App\Models\QuarterlyMetrics;
use App\Repositories\AuthorizationModule\RoleRepository;
use App\Repositories\AuthorizationModule\UserRepository;
use App\Repositories\AuthorizationModule\UserRoleRepository;
use App\Repositories\AuthorizationModule\AuditLogRepository;
use App\Repositories\BaseRepository;
use App\Repositories\Contracts\AuthorizationModule\UserRepositoryInterface;
use App\Repositories\Contracts\AuthorizationModule\RoleRepositoryInterface;
use App\Repositories\Contracts\AuthorizationModule\UserRoleRepositoryInterface;
use App\Repositories\Contracts\AuthorizationModule\AuditLogRepositoryInterface;
use App\Repositories\Contracts\BaseRepositoryInterface;
use App\Repositories\Contracts\ProjectModule\AssetCapitalRepositoryInterface;
use App\Repositories\Contracts\ProjectModule\AssetRepositoryInterface;
use App\Repositories\Contracts\ProjectModule\EmployeeRepositoryInterface;
use App\Repositories\Contracts\ProjectModule\InterventionRepositoryInterface;
use App\Repositories\Contracts\ProjectModule\LinkageRepositoryInterface;
use App\Repositories\Contracts\ProjectModule\MarketRepositoryInterface;
use App\Repositories\Contracts\ProjectModule\NarrativeRepositoryInterface;
use App\Repositories\Contracts\ProjectModule\ProductionCostRepositoryInterface;
use App\Repositories\Contracts\ProjectModule\ProductionMaterialRepositoryInterface;
use App\Repositories\Contracts\ProjectModule\ProductRepositoryInterface;
use App\Repositories\Contracts\ProjectModule\ProjectRepositoryInterface;
use App\Repositories\Contracts\ProjectModule\QuarterlyMetricsRepositoryInterface;
use App\Repositories\Contracts\ProposalModule\DocumentRequirementRepositoryInterface;
use App\Repositories\Contracts\ProposalModule\DocumentsRepositoryInterface;
use App\Repositories\Contracts\ProposalModule\GiaCoAuthorRepositoryInterface;
use App\Repositories\Contracts\ProposalModule\GiaDocumentRepositoryInterface;
use App\Repositories\Contracts\ProposalModule\GiaProposalRepositoryInterface;
use App\Repositories\Contracts\ProposalModule\ProposalAuditRepositoryInterface;
use App\Repositories\Contracts\ProposalModule\ProposalRepositoryInterface;
use App\Repositories\Contracts\ProposalModule\ProposalTemplateRepositoryInterface;
use App\Repositories\Contracts\ProposalModule\SetupEquipmentQuotationRepositoryInterface;
use App\Repositories\Contracts\ProposalModule\SetupFinancialDocumentRepositoryInterface;
use App\Repositories\Contracts\ProposalModule\SetupProposalRepositoryInterface;
use App\Repositories\ProjectModule\AssetCapitalRepository;
use App\Repositories\ProjectModule\AssetRepository;
use App\Repositories\ProjectModule\EmployeeRepository;
use App\Repositories\ProjectModule\InterventionRepository;
use App\Repositories\ProjectModule\LinkageRepository;
use App\Repositories\ProjectModule\MarketRepository;
use App\Repositories\ProjectModule\NarrativeRepository;
use App\Repositories\ProjectModule\ProductionCostRepository;
use App\Repositories\ProjectModule\ProductionMaterialRepository;
use App\Repositories\ProjectModule\ProductRepository;
use App\Repositories\ProjectModule\ProjectRepository;
use App\Repositories\ProjectModule\QuarterlyMetricsRepository;
use App\Repositories\ProposalModule\DocumentRequirementRepository;
use App\Repositories\ProposalModule\DocumentsRepository;
use App\Repositories\ProposalModule\GiaCoAuthorRepository;
use App\Repositories\ProposalModule\GiaDocumentRepository;
use App\Repositories\ProposalModule\GiaProposalRepository;
use App\Repositories\ProposalModule\ProposalAuditRepository;
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
        $this->app->bind(DocumentsRepositoryInterface::class, DocumentsRepository::class);
        $this->app->bind(ProposalAuditRepositoryInterface::class, ProposalAuditRepository::class);

        $this->app->bind(ProjectRepositoryInterface::class,ProjectRepository::class);
        $this->app->bind(QuarterlyMetricsRepositoryInterface::class, QuarterlyMetricsRepository::class);
        $this->app->bind(ProductRepositoryInterface::class,ProductRepository::class);
        $this->app->bind(ProductionCostRepositoryInterface::class,ProductionCostRepository::class);
        $this->app->bind(EmployeeRepositoryInterface::class,EmployeeRepository::class);
        $this->app->bind(AssetCapitalRepositoryInterface::class, AssetCapitalRepository::class);
        $this->app->bind(AssetRepositoryInterface::class, AssetRepository::class);
        $this->app->bind(InterventionRepositoryInterface::class,InterventionRepository::class);
        $this->app->bind(LinkageRepositoryInterface::class,LinkageRepository::class);
        $this->app->bind(MarketRepositoryInterface::class,MarketRepository::class);
        $this->app->bind(NarrativeRepositoryInterface::class,NarrativeRepository::class);
        $this->app->bind(ProductionMaterialRepositoryInterface::class, ProductionMaterialRepository::class);

        $this->app->bind(BaseRepositoryInterface::class, BaseRepository::class);
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
