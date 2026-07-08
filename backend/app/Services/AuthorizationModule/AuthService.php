<?php

namespace App\Services\AuthorizationModule;

use App\Models\User;
use App\Repositories\Contracts\AuthorizationModule\UserRepositoryInterface;
use App\Services\Contracts\AuthorizationModule\AuthServiceInterface;
use Illuminate\Support\Facades\Hash;
use Override;

class AuthService implements AuthServiceInterface
{
    /**
     * Create a new class instance.
     */
    public function __construct(protected UserRepositoryInterface $userRepository)
    {
    }

    #[Override]
    public function login(string $email, string $password): array
    {
        $user = $this->userRepository->findByEmail($email);

        if(! $user || ! Hash::check($password,$user->password)){
            throw new \Exception('Invalid credentials');
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
        ];
    }

    #[Override]
    public function logout(User $user): bool
    {
        return (bool) $user->currentAccessToken()->delete();
    }

    #[Override]
    public function register(array $data): User
    {
        return $this->userRepository->create($data);
    }
}
