<?php

namespace App\Services\AuthorizationModule;

use App\Models\Role;
use App\Models\User;
use App\Repositories\Contracts\AuthorizationModule\UserRepositoryInterface;
use App\Services\Contracts\AuthorizationModule\AuthServiceInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;
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

        $user->load('role');
        $token = $user->createToken('api-token')->plainTextToken;
        $primaryRole = $user->role->first();

        return [
            'user' => [
                'email' => $user->email,
                'name' => $user->name,
                'role' => $primaryRole?->code ?? 'proponent',
            ],
            'token' => $token,
        ];
    }

    #[Override]
    public function logout(User $user): bool
    {
        /** @var PersonalAccessToken|null $token */
        $token = $user->currentAccessToken();

        return $token?->delete() ?? false;
    }

    #[Override]
    public function register(array $data): User
    {
        $role = $data['role'];
        unset($data['role']);

        $roleId = Role::query()->where('code', $role)->value('id');

        if(! $roleId){
            throw ValidationException::withMessages([
                'role' => ['The selected account role is not available.'],
            ]);
        }

        return DB::transaction(function () use ($data, $roleId) {
            $user = $this->userRepository->create($data);

            $user->role()->syncWithoutDetaching([
                $roleId => [
                    'assigned_at' => now()
                ],
            ]);

            return $user;
        });
    }
}
