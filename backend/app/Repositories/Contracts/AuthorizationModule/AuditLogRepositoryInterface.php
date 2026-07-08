<?php

namespace App\Repositories\Contracts\AuthorizationModule;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Collection;

interface AuditLogRepositoryInterface
{
    public function all(): Collection;
    public function findByIp(string $ip): Collection;
    public function findById(int $id): ?AuditLog;
    public function create(array $data): AuditLog;
}
