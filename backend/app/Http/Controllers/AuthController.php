<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Services\Contracts\AuthorizationModule\AuthServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(protected AuthServiceInterface $authService)
    {}

    public function register(RegisterRequest $request):JsonResponse{
        $user = $this->authService->register($request->validated());

        return response()->json([
            'message' => 'registration successful',
            'data' => $user,
        ],201);
    }

    public function login(LoginRequest $request):JsonResponse{
        $result = $this->authService->login(
            $request->validated('email'),
            $request->validated('password')
        );

        return response()->json([
            'message' => 'login successful',
            'data' => $result,
        ],200);
    }

    public function logout(Request $request):JsonResponse{
        $this->authService->logout($request->user());
        return response()->json([
            'message' => 'logout successful',
        ],200);
    }
}
