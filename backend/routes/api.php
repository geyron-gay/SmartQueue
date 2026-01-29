<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


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

// Only Admins can enter here
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/admin/stats', function() {
        return response()->json(['message' => 'Welcome Admin! Here is the secret data yooow .']);
    });
});
use App\Http\Controllers\SessionController;
    use App\Models\QueueSession;

    Route::get('/active-sessions', function () {
    return QueueSession::where('is_active', true)->get();
});

    Route::post('/sessions/end', [SessionController::class, 'end']); // Staff use this
// Only Staff can enter here
Route::middleware(['auth:sanctum', 'role:staff'])->group(function () {
    Route::get('/staff/tasks', function() {
        return response()->json(['message' => 'Welcome Staff! Here are your tasks.']);
    });

    Route::post('/sessions/start', [SessionController::class, 'startSession']); // Staff use this
    Route::get('/sessions/current', [SessionController::class, 'current']); // Staff use this

});

use App\Http\Controllers\QueueController;


// Put these inside your 'auth:sanctum' middleware if you want only logged-in 
// people to see them, or keep them outside for the students to join!

Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/join-queue', [QueueController::class, 'joinQueue']);
    Route::get('/my-history', [QueueController::class, 'getUserHistory']); 
    
    Route::get('/user/active-ticket', [QueueController::class, 'getActiveTicket']);
});

Route::get('/queues', [QueueController::class, 'index']);           // Staff use this
Route::put('/queues/{id}', [QueueController::class, 'updateStatus']); // Staff use this
Route::get('/queues/status/{id}', [QueueController::class, 'getTicketStatus']);


use App\Http\Controllers\AuthController;
Route::post('/loginUser', [AuthController::class, 'login']);
Route::post('/registerUser', [AuthController::class, 'register']);



require __DIR__.'/auth.php';