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
use App\Http\Controllers\Admin\UserManagementController;
use App\Http\Controllers\PriorityVerificationController;
use App\Http\Controllers\PurposeController;

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

Route::get('/priority-verification-file/{userId}', [PriorityVerificationController::class, 'download'])->name('priority.download');;

Route::get('/active-sessions', function () {
    return QueueSession::with('purposes') // 👈 This is the magic line
        ->whereDate('created_at', today())
        ->get();
});

Route::post('/loginUser', [AuthController::class, 'login']);
Route::post('/registerUser', [AuthController::class, 'register']);


Route::get('/sessions/current', [SessionController::class, 'current'])->middleware('auth:sanctum');

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
    Route::get('/users-management', [UserManagementController::class, 'index']);
    Route::post('/users-create', [UserManagementController::class, 'store']);
    Route::delete('/users-delete/{user}', [UserManagementController::class, 'destroy']);
    Route::put('/users-update/{user}', [UserManagementController::class, 'update']);
    Route::post('/admin/registrar-staff/{user}/relocate', [DashboardController::class, 'relocateStaff']);
    Route::get('/admin/analytics/peak-hours', [AnalyticsController::class, 'peakHours']);
});
   

Route::middleware(['auth:sanctum', 'role:staff'])->group(function () {

    Route::post('/sessions/end', [SessionController::class, 'end']); // Staff use this
    Route::post('/sessions/start', [SessionController::class, 'startSession']); // Staff use this
    Route::patch('/sessions/{id}', [SessionController::class, 'update']);
    Route::get('/staff/lookup', [QueueController::class, 'lookupStudent']);
    Route::get('/staff/history', [QueueController::class, 'getDepartmentHistory']);  
    Route::put('/queues/{id}/demote', [QueueController::class, 'demoteStudent']);
    Route::get('/queues', [QueueController::class, 'index']);           // Staff use this
    Route::put('/queues/{id}', [QueueController::class, 'updateStatus']); // Staff use this
    Route::post('/queues/call-batch', [QueueController::class, 'callBatch']);
    Route::patch('/update/sessions/{id}', [SessionController::class, 'updateSession']);
    Route::post('/queues/complete-batch', [QueueController::class, 'completeBatch']);
    Route::patch('/update/batch/size', [SessionController::class, 'updateBatchSize']);
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
    Route::put('/user/update', [ProfileController::class, 'updateProfile']);
});

Route::middleware(['auth:sanctum'])->group(function () {
    

   Route::get('/priority-verification/{user}', [PriorityVerificationController::class, 'show']);
   Route::post('/purposes-create', [PurposeController::class, 'store']);
   Route::get('/staff/purposes', [PurposeController::class, 'index']);
   Route::delete('/purposes-delete/{purpose}', [PurposeController::class, 'destroy']);
   Route::put('/purposes-update/{purpose}', [PurposeController::class, 'update']);
   Route::get('/staff/lookup', [QueueController::class, 'lookupStudent']);
   Route::post('/broadcast', [BroadcastController::class, 'createBroadcast']);
   Route::get('/broadcast/history', [BroadcastController::class, 'getHistory']);
   // User upload
    Route::post('/upload-priority-id', [PriorityVerificationController::class, 'uploadPriorityId']);

    // Admin view image
    Route::get('/priority-id/{userId}', [PriorityVerificationController::class, 'viewPriorityId']);

    // Admin approve/reject
    Route::post('/priority-status/{userId}', [PriorityVerificationController::class, 'updatePriorityStatus']);
});

require __DIR__.'/auth.php';