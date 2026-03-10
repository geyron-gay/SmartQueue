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

    // 1. Generate a random 6-digit number
    $code = rand(100000, 999999);

    // 2. Save it to the password_reset_tokens table
    // We use updateOrInsert so we don't create multiple rows for one email
    DB::table('password_resets')->updateOrInsert(
        ['email' => $request->email],
        [
            'token' => $code, // We store the code in the token column
            'created_at' => now()
        ]
    );

    // 3. Send the Email manually
    \Illuminate\Support\Facades\Mail::raw("Your SmartQueue password reset code is: {$code}", function ($message) use ($request) {
        $message->to($request->email)
                ->subject('Password Reset Code');
    });

    return response()->json(['status' => 'Code sent to your email.']);
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
