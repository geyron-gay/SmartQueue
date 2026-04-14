<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;  
use Carbon\Carbon;

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

    // Step 1: Get all staff by department
    $staffs = DB::table('users')
        ->where('role', 'staff')
        ->select('id', 'name as staff_name', 'department')
        ->get()
        ->keyBy('department'); // key by department for quick lookup

    // Step 2: Aggregate queues per department
    $queues = DB::table('queues')
        ->where('created_at', '>=', now()->subDays($days))
        ->select(
            'department',
            DB::raw('COUNT(*) as total_served'),
            DB::raw('ROUND(AVG(TIMESTAMPDIFF(SECOND, started_at, completed_at)) / 60, 2) as avg_service_time'),
            DB::raw('MIN(TIMESTAMPDIFF(SECOND, started_at, completed_at)) as fastest_seconds'),
            DB::raw('MAX(TIMESTAMPDIFF(SECOND, started_at, completed_at)) as slowest_seconds')
        )
        ->groupBy('department')
        ->get();

    // Step 3: Map queue stats to staff
    $performance = $queues->map(function($q) use ($staffs) {
        $staff = $staffs[$q->department] ?? null;

        return [
            'staff_name' => $staff->staff_name ?? $q->department,
            'department' => $q->department,
            'total_served' => $q->total_served,
            'avg_service_time' => $q->avg_service_time,
            'fastest_seconds' => $q->fastest_seconds,
            'slowest_seconds' => $q->slowest_seconds,
        ];
    });

    return response()->json($performance);
}

 public function peakHours(Request $request)
    {
        $range = $request->query('range', 'weekly'); // default weekly
        $department = $request->query('department');

        // 🧠 Determine date range
        $now = Carbon::now();

        switch ($range) {
            case 'daily':
                $start = $now->copy()->startOfDay();
                $end   = $now->copy()->endOfDay();
                break;

            case 'monthly':
                $start = $now->copy()->startOfMonth();
                $end   = $now->copy()->endOfMonth();
                break;

            case 'weekly':
            default:
                $start = $now->copy()->startOfWeek(Carbon::MONDAY);
                $end   = $now->copy()->endOfWeek(Carbon::FRIDAY);
                break;
        }

        // 🛠️ Base query
        $query = DB::table('queues')
           ->selectRaw('
    DATE(created_at) as date,
    DAYOFWEEK(created_at) as day,
    HOUR(created_at) as hour,
    COUNT(*) as total
')
            ->whereBetween('created_at', [$start, $end]);

        // 🎯 Optional department filter
        if ($department) {
            $query->where('department', $department);
        }

        $results = $query
            ->groupBy('date', 'day', 'hour')
            ->orderBy('day')
            ->orderBy('hour')
            ->get();

        // 🧠 Transform into frontend-friendly format
        $mapped = [];

        foreach ($results as $row) {
            $dayIndex = $row->day - 2; // Monday = 0

            // ignore weekends
            if ($dayIndex < 0 || $dayIndex > 4) continue;

            $mapped[] = [
                'dayIndex' => $dayIndex,
                'hour' => (int) $row->hour,
                'total' => (int) $row->total,
                'date' => $row->date
            ];
        }

        return response()->json([
            'range' => $range,
            'start' => $start->toDateTimeString(),
            'end'   => $end->toDateTimeString(),
            'data'  => $mapped
        ]);
    }

}
