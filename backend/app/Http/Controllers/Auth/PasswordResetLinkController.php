<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class PasswordResetLinkController extends Controller
{
    /**
     * Handle an incoming password reset link request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
public function store(Request $request): JsonResponse
{
    $request->validate([
        'email' => ['required', 'email'],
    ]);

    // Check if user exists first (Best Practice)
    $userExists = DB::table('users')->where('email', $request->email)->exists();
    if (!$userExists) {
        return response()->json(['error' => 'No account found with this email.'], 404);
    }

    $code = rand(100000, 999999);

    try {
        // Update database
        DB::table('password_resets')->updateOrInsert(
            ['email' => $request->email],
            [
                'token' => $code,
                'created_at' => now()
            ]
        );

        // SEND MAIL
        \Illuminate\Support\Facades\Mail::raw("Your SmartQueue password reset code is: {$code}", function ($message) use ($request) {
            $message->to($request->email)
                    ->subject('Password Reset Code');
        });

        return response()->json(['status' => 'Code sent to your email.']);

    } catch (\Exception $e) {
        // This will catch SMTP errors, App Password errors, etc.
        return response()->json([
            'error' => 'Mail Server Error',
            'debug' => $e->getMessage() // This tells us the REAL problem
        ], 500);
    }
}

// Route: Route::post('/verify-pin', [PasswordResetLinkController::class, 'verifyPin']);

public function verifyPin(Request $request): JsonResponse
{
    $request->validate([
        'email' => 'required|email',
        'token' => 'required|digits:6',
    ]);

    $record = DB::table('password_resets')
        ->where('email', $request->email)
        ->where('token', $request->token)
        ->first();

    if (!$record || \Carbon\Carbon::parse($record->created_at)->addMinutes(60)->isPast()) {
        return response()->json(['message' => 'Invalid or expired PIN.'], 422);
    }

    return response()->json(['message' => 'PIN verified.']);
}
}
