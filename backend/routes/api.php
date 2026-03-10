<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SessionController;
use App\Models\QueueSession;
use App\Http\Controllers\BroadcastController;
use App\Http\Controllers\QueueController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Admin\AnalyticsController;
use App\Http\Controllers\Admin\AuditController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\FcmController;
use App\Http\Controllers\Admin\QueueSessionController;  
/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user();
});

Route::get('/active-sessions', function () {
    return QueueSession::where('is_active', true)
        ->with('purposes') // 👈 This is the magic line
        ->get();
});

Route::post('/loginUser', [AuthController::class, 'login']);
Route::post('/registerUser', [AuthController::class, 'register']);




Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/admin/stats', function() {
        return response()->json(['message' => 'Welcome Admin! Here is the secret data yooow .']);
    });

    Route::get('/admin/analytics/queue-stats', [AnalyticsController::class, 'getQueueStats']);
    Route::get('/admin/analytics/staff-performance', [AnalyticsController::class, 'getStaffPerformance']);
    Route::get('/admin/audit-logs', [AuditController::class, 'index']);
    Route::get('/admin/registrar-staff', [DashboardController::class, 'index']);
    Route::get('/admin/registrar-staff/{id}/logs', [DashboardController::class, 'logs']);
    Route::get('/sessions', [QueueSessionController::class, 'index']);
    Route::get('/sessions/{id}', [QueueSessionController::class, 'show']);
});



   
Route::middleware(['auth:sanctum', 'role:staff'])->group(function () {

    Route::post('/sessions/end', [SessionController::class, 'end']); // Staff use this
    Route::post('/sessions/start', [SessionController::class, 'startSession']); // Staff use this
    Route::get('/sessions/current', [SessionController::class, 'current']); // Staff use this
    Route::get('/staff/lookup', [QueueController::class, 'lookupStudent']);
    Route::get('/staff/history', [QueueController::class, 'getDepartmentHistory']);  
    Route::post('/staff/broadcast', [BroadcastController::class, 'createBroadcast']);
    Route::put('/queues/{id}/demote', [QueueController::class, 'demoteStudent']);
    Route::get('/queues', [QueueController::class, 'index']);           // Staff use this
    Route::put('/queues/{id}', [QueueController::class, 'updateStatus']); // Staff use this

    });

   

Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/join-queue', [QueueController::class, 'joinQueue']);
    Route::get('/my-history', [QueueController::class, 'getUserHistory']); 
    Route::get('/user/active-tickets', [QueueController::class, 'getActiveTickets']);
    Route::put('/queues/{id}/cancel', [QueueController::class, 'cancel']);
    Route::get('/queues/status/{id}', [QueueController::class, 'getTicketStatus']);
    Route::get('/user/stats', [ProfileController::class, 'getStudentStats']);
    Route::get('/broadcasts/active', [BroadcastController::class, 'getActiveBroadcasts']);
    Route::post('/update-fcm-token', [FcmController::class, 'updateToken']);
});

require __DIR__.'/auth.php';