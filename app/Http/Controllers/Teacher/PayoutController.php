<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\TeacherPayout;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

final class PayoutController extends Controller
{
    /**
     * Display a listing of the teacher's payouts.
     */
    public function index(): View
    {
        $user = Auth::user();

        $pendingPayouts = TeacherPayout::where('user_id', $user->id)
            ->whereIn('status', ['pending', 'processing'])
            ->orderBy('created_at', 'desc')
            ->get();

        $completedPayouts = TeacherPayout::where('user_id', $user->id)
            ->where('status', 'paid')
            ->orderBy('processed_at', 'desc')
            ->paginate(10, ['*'], 'completed_page');

        $failedPayouts = TeacherPayout::where('user_id', $user->id)
            ->whereIn('status', ['failed', 'cancelled'])
            ->orderBy('processed_at', 'desc')
            ->paginate(10, ['*'], 'failed_page');

        return view('teacher.payouts.index', [
            'pendingPayouts' => $pendingPayouts,
            'completedPayouts' => $completedPayouts,
            'failedPayouts' => $failedPayouts,
        ]);
    }

    /**
     * Display the specified payout.
     */
    public function show(TeacherPayout $payout): View
    {

        if ($payout->user_id !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        return view('teacher.payouts.show', [
            'payout' => $payout,
        ]);
    }
}
