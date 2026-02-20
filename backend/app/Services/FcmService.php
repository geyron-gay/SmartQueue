<?php
namespace App\Services;

use Google\Client;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log; // 👈 Don't forget this!

class FcmService {
    public static function sendStickyNotification($token, $title, $body) {
        try {
            Log::info("🔔 FCM: Starting notification process for token: " . substr($token, 0, 10) . "...");

            // 1. Google Auth Check
            $client = new Client(); 
            $client->setAuthConfig(storage_path('app/firebase-auth.json'));
            $client->addScope('https://www.googleapis.com/auth/firebase.messaging');
            
            $auth = $client->fetchAccessTokenWithAssertion();
            $accessToken = $auth['access_token'];

            if (!$accessToken) {
                Log::error("❌ FCM: Failed to get Google Access Token. Check firebase-auth.json");
                return false;
            }

            $projectId = config('services.firebase.project_id'); 
            $url = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";

            // 2. Log the Payload (See what we are sending)
           $payload = [
    'message' => [
        'token' => $token,
        'notification' => [
            'title' => $title,
            'body' => $body,
        ],
        'android' => [
            'priority' => 'high',
            'restricted_package_name' => 'com.aaron.tmcsmartqueue',
            'notification' => [
                'channel_id' => 'queue-status',
                // 🛑 Removed 'sticky' and 'ongoing' from here because Google API rejects them
                'notification_priority' => 'PRIORITY_MAX',
                'visibility' => 'PUBLIC'
            ]
        ],
        // 💡 We pass these as 'data' so your React Native app can read them 
        // and manually set the notification to sticky/ongoing
        'data' => [
            'sticky' => 'true',
            'ongoing' => 'true',
        ]
    ]
];
            Log::info("📦 FCM Payload:", $payload);

            // 3. Send and Log Response
            $response = Http::withToken($accessToken)->post($url, $payload);

            if ($response->successful()) {
                Log::info("✅ FCM Success Response: " . $response->body());
            } else {
                Log::error("❌ FCM Server Error: " . $response->status() . " - " . $response->body());
            }

            return $response;

        } catch (\Exception $e) {
            Log::error("🚨 FCM Critical Crash: " . $e->getMessage());
            return false;
        }
    }
}