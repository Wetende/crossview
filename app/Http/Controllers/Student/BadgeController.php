<?php

declare(strict_types=1);

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Badge;
use App\Services\BadgeService;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

final class BadgeController extends Controller
{
    public function __construct(
        private readonly BadgeService $badgeService
    ) {
    }

    public function index(): View
    {
        $user = Auth::user();


        $earnedBadges = $user->badges()->orderBy('user_badges.earned_at', 'desc')->get();


        $availableBadges = Badge::where('is_active', true)
            ->whereNotIn('id', $earnedBadges->pluck('id'))
            ->orderBy('name')
            ->get();

        return view('student.badges.index', compact('earnedBadges', 'availableBadges'));
    }
}
