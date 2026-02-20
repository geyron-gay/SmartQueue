<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Spatie\Activitylog\Models\Activity;

class AuditController extends Controller
{
    public function index()
    {
        // Senior Tip: We use 'with' to eager-load the user (causer) 
        // This prevents the "N+1" problem which crashes slow databases.
        $logs = Activity::with('causer')
            ->latest()
            ->paginate(50); // Production level: Always paginate!

        return response()->json($logs);
    }
}
