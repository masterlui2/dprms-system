<?php

namespace App\Services\Contracts\AuthorizationModule;

use App\Models\User;

interface AuthServiceInterface{
    public function register(array $data): User;
    public function login(string $email, string $password): array;
    public function logout(User $user): bool;
}
