<?php

namespace App\Repositories\AuthorizationModule;

use App\Models\AuditLog;
use App\Repositories\Contracts\AuthorizationModule\AuditLogRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use App\Repositories\BaseRepository;
use Override;

class AuditLogRepository implements AuditLogRepositoryInterface
{
    /**
     * Create a new class instance.
     */
    public function __construct(protected AuditLog $model)
    {
        //
    }

    #[Override]
    public function all(): Collection
    {
        return $this->model->newQuery()->get();
    }

    #[Override]
    public function findByIp(string $ip): Collection
    {
        return $this->model->newQuery()->where("ip_address",$ip)->get();
    }

    #[Override]
    public function findById(int $id): ?AuditLog
    {
        return $this->model->newQuery()->find($id);
    }

    #[Override]
    public function create(array $data): AuditLog
    {
        return $this->model->newQuery()->create($data);
    }
}
