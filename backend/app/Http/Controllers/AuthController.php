<?php
namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller {
    public function register(Request $request) {
        $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'user_type' => 'required|in:student,visitor',
            // Student ID is only required if they are a student
            'student_id' => [
        'required_if:user_type,student',
        'nullable',
        'string',
        'unique:users',
        'regex:/^23-0\d{5}$/',
    ],

        ]);

        $user = User::create([
            'name' => $request->name,
            'username' => $request->username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'student_id' => $request->student_id,
            'user_type' => $request->user_type,
            'role' => 'user', // Staff roles are assigned by Admin manually
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ]);
    }

   public function login(Request $request)
{
    $request->validate([
        'identifier' => 'required|string',
        'password'   => 'required|string',
    ]);

    // Detect if identifier is email or username
    $field = filter_var($request->identifier, FILTER_VALIDATE_EMAIL)
                ? 'email'
                : 'username';

    // Find user
    $user = User::where($field, $request->identifier)->first();

    // Check if user exists and password matches
    if (! $user || ! Hash::check($request->password, $user->password)) {
        throw ValidationException::withMessages([
            'identifier' => ['The provided credentials are incorrect.'],
        ]);
    }

    // Optional: delete old tokens (cleaner login system)
    $user->tokens()->delete();

    // Create new token
    $token = $user->createToken('auth_token')->plainTextToken;

    return response()->json([
        'access_token' => $token,
        'token_type'   => 'Bearer',
        'user'         => $user,
    ]);
}

}