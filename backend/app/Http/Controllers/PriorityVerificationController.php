<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\PriorityVerification;

class PriorityVerificationController extends Controller
{

public function download($userId)
{
    $verification = PriorityVerification::where('user_id', $userId)->firstOrFail();
    $filePath = storage_path('app/private/' . $verification->file_path);

    // Debug log
    Log::info('Downloading file path: ' . $filePath);

    if (!file_exists($filePath)) {
        Log::error('File not found: ' . $filePath);
        abort(404, 'File not found');
    }

    return response()->file($filePath);
}

public function show($userId)
{
    $verification = PriorityVerification::where('user_id', $userId)->latest()->first();

    return response()->json([
        'verification' => $verification ? [
            'status' => $verification->status,

            // ✅ ONLY return URL if file_path exists
            'file_url' => $verification->file_path
                ? route('priority.download', ['userId' => $userId])
                : null
        ] : null
    ]);
}
public function uploadPriorityId(Request $request)
{
    $request->validate([
        'priority_id' => 'required|image|mimes:jpeg,png,jpg|max:2048'
    ]);

    $user = auth()->user();

    $file = $request->file('priority_id');

    $filename = time() . '_' . $user->id . '.' . $file->getClientOriginalExtension();

   $path = $file->storeAs('priority_ids', $filename, 'private'); // 'private' disk

    // 🔥 Create or update record
    PriorityVerification::updateOrCreate(
        ['user_id' => $user->id],
        [
            'file_path' => $path,
            'status' => 'pending'
        ]
    );

    return response()->json([
        'message' => 'Uploaded successfully',
        'status' => 'pending',
        'file_url' => url('storage/private/' . $filename)
    ]);
}

public function viewPriorityId($userId)
{
    $admin = auth()->user();

    if (!in_array($admin->role, ['admin', 'staff'])) {
        abort(403);
    }

    $verification = PriorityVerification::where('user_id', $userId)->firstOrFail();

    return response()->file(storage_path('app/' . $verification->file_path));
}

public function updatePriorityStatus(Request $request, $userId)
{
    $request->validate([
        'status' => 'required|in:approved,rejected',
        'remarks' => 'nullable|string' // Optional: why they were rejected
    ]);

    $verification = PriorityVerification::where('user_id', $userId)->firstOrFail();
    $verification->update([
        'status' => $request->status,
        'verified_at' => $request->status === 'approved' ? now() : null,
    ]);

    // Update the User table priority status if approved
    if ($request->status === 'approved') {
        $verification->user->update(['priority' => 'Priority']);
    }

    // 🔥 This triggers your Redis worker to tell the React Native app!
    event(new \App\Events\QueueUpdated($userId)); 

    return response()->json([
        'message' => "Priority status updated to {$request->status}",
        'status' => $request->status
    ]);
}
}
