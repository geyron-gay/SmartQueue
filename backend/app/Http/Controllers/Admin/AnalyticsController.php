<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;  

class AnalyticsController extends Controller
{
       // app/Http/Controllers/Api/Admin/AnalyticsController.php

public function getQueueStats(Request $request)
{
    // Senior Tip: Always allow date filtering!
    $days = $request->query('days', 30); 

    $stats = DB::table('queues')
        ->where('created_at', '>=', now()->subDays($days))
        ->whereNotNull('completed_at') // Only calculate finished transactions
        ->select(
            DB::raw('COUNT(*) as total_students'),
            // Wait Time = started_at - created_at (in seconds)
            DB::raw('AVG(TIMESTAMPDIFF(SECOND, created_at, started_at)) as avg_wait_time'),
            // Service Time = completed_at - started_at (in seconds)
            DB::raw('AVG(TIMESTAMPDIFF(SECOND, started_at, completed_at)) as avg_service_time'),
            // Group by Date for the chart
            DB::raw('DATE(created_at) as date')
        )
        ->groupBy('date')
        ->orderBy('date', 'ASC')
        ->get();

    return response()->json([
        'summary' => [
            'total' => $stats->sum('total_students'),
            'avg_wait' => round($stats->avg('avg_wait_time') / 60, 2), // Convert to minutes
            'avg_service' => round($stats->avg('avg_service_time') / 60, 2)
        ],
        'chartData' => $stats
    ]);
}

// app/Http/Controllers/Api/Admin/AnalyticsController.php

public function getStaffPerformance(Request $request)
{
    $days = $request->query('days', 30);

    $performance = DB::table('queues')
        ->join('users', 'queues.user_id', '=', 'users.id')
        ->where('queues.completed_at', '>=', now()->subDays($days))
        ->select(
            'users.name as staff_name',
            'users.department',
            DB::raw('COUNT(*) as total_served'),
            // Average time spent per student in minutes
            DB::raw('ROUND(AVG(TIMESTAMPDIFF(SECOND, started_at, completed_at)) / 60, 2) as avg_service_time'),
            // Get the fastest and slowest transaction for context
            DB::raw('MIN(TIMESTAMPDIFF(SECOND, started_at, completed_at)) as fastest_seconds'),
            DB::raw('MAX(TIMESTAMPDIFF(SECOND, started_at, completed_at)) as slowest_seconds')
        )
        ->groupBy('users.id', 'users.name', 'users.department')
        ->orderBy('total_served', 'DESC')
        ->get();

    return response()->json($performance);
}
}
