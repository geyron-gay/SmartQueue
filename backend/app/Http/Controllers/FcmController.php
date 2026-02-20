<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class FcmController extends Controller
{
    public function updateToken(Request $request)
    {
        // 🛡️ Validate that we actually got a string
        $request->validate([
            'token' => 'required|string',
        ]);

        // 👤 Get the current authenticated student/user
        $user = Auth::user();

        if ($user) {

         User::where('id', Auth::id())->update([
            'fcm_token' => $request->token,
        ]);


            return response()->json([
                'success' => true,
                'message' => 'FCM Token updated successfully.',
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'User not authenticated.',
        ], 401);
    }
}
