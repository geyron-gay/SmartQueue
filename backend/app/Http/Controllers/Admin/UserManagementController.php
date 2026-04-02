<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Services\UserManagementService;
use App\Models\User;
use Illuminate\Http\Request;

class UserManagementController extends Controller
{
    protected $userService;

    public function __construct(UserManagementService $userService) {
        $this->userService = $userService;
    }

    

    public function index(Request $request) {
        $users = $this->userService->getUsersForDashboard($request->user());
        return UserResource::collection($users);
    }



    public function store(Request $request) {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|unique:users',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8',
            'role' => 'required|in:student,staff,admin',
            'department' => 'required_if:role,staff|nullable|string',
        ]);

        $user = $this->userService->createUser($validated);
        return new UserResource($user);
    }

    public function update(Request $request, User $user) {
        try {
            $this->userService->updateUser($user, $request->all(), $request->user());
            return response()->json(['message' => 'User updated']);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], $e->getCode() ?: 400);
        }
    }

    public function destroy(User $user, Request $request) {
        try {
            $this->userService->deleteUser($user, $request->user());
            return response()->json(['message' => 'User deleted']);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], $e->getCode() ?: 400);
        }
    }
}
