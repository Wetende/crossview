<x-slot name="header">
    @include('layouts.partials.student.header')
</x-slot>

<x-dashboard-layout>
    <x-slot name="sidebar">
        @include('layouts.partials.student.sidebar')
    </x-slot>

    <div class="dashboard__content bg-light-4">
        <div class="row y-gap-20 justify-between items-end pb-30 mb-10">
            <div class="col-auto">
                <h1 class="text-30 lh-12 fw-700">My Badges</h1>
                <div class="mt-10">Your achievements and rewards.</div>
            </div>
        </div>

        @if(session('success'))
            <div class="alert -success mb-30">
                <div class="alert__content">{{ session('success') }}</div>
            </div>
        @endif

        <div class="row y-gap-30">
            <!-- Earned Badges -->
            <div class="col-12">
                <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <div class="d-flex items-center justify-between">
                        <h2 class="text-20 lh-1 fw-500">Earned Badges</h2>
                    </div>

                    @if(count($earnedBadges) > 0)
                        <div class="row y-gap-25 pt-30">
                            @foreach($earnedBadges as $badge)
                                <div class="col-xl-3 col-lg-4 col-sm-6">
                                    <div class="py-30 px-20 rounded-8 bg-light-6 -dark-bg-dark-2 h-100 text-center">
                                        <div class="size-80 mx-auto mb-20">
                                            @if($badge->icon_url)
                                                <img src="{{ $badge->icon_url }}" alt="{{ $badge->name }}" class="size-80">
                                            @else
                                                <div class="bg-light-3 d-flex items-center justify-center size-80 rounded-full mx-auto">
                                                    <i class="icon-award text-30"></i>
                                                </div>
                                            @endif
                                        </div>
                                        <h4 class="text-17 fw-500 mb-5">{{ $badge->name }}</h4>
                                        <p class="text-14 lh-1 mt-5 text-light-1">Earned {{ $badge->pivot->earned_at->diffForHumans() }}</p>
                                        <div class="mt-10 text-14">{{ Str::limit($badge->description, 100) }}</div>
                                        @if($badge->points > 0)
                                            <div class="mt-10 badge bg-purple-1 text-white py-5 px-15">{{ $badge->points }} Points</div>
                                        @endif
                                    </div>
                                </div>
                            @endforeach
                        </div>
                    @else
                        <div class="text-center py-40">
                            <div class="mb-20">
                                <img src="{{ asset('img/dashboard/empty-state/badges.svg') }}" alt="No Badges" style="max-width: 200px;" class="mb-20">
                            </div>
                            <h4 class="text-18 fw-500 mb-10">No Badges Earned Yet</h4>
                            <p class="text-14 mb-20">Complete courses, quizzes, and activities to earn badges and showcase your achievements.</p>
                        </div>
                    @endif
                </div>
            </div>

            <!-- Available Badges -->
            <div class="col-12">
                <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <div class="d-flex items-center justify-between">
                        <h2 class="text-20 lh-1 fw-500">Available Badges</h2>
                    </div>

                    @if(count($availableBadges) > 0)
                        <div class="row y-gap-25 pt-30">
                            @foreach($availableBadges as $badge)
                                <div class="col-xl-3 col-lg-4 col-sm-6">
                                    <div class="py-30 px-20 rounded-8 bg-light-6 -dark-bg-dark-2 h-100 text-center">
                                        <div class="size-80 mx-auto mb-20 opacity-50">
                                            @if($badge->icon_url)
                                                <img src="{{ $badge->icon_url }}" alt="{{ $badge->name }}" class="size-80 grayscale">
                                            @else
                                                <div class="bg-light-3 d-flex items-center justify-center size-80 rounded-full mx-auto">
                                                    <i class="icon-award text-30"></i>
                                                </div>
                                            @endif
                                            <div class="badge-lock position-absolute top-10 right-10">
                                                <i class="icon-lock text-16"></i>
                                            </div>
                                        </div>
                                        <h4 class="text-17 fw-500 mb-5">{{ $badge->name }}</h4>
                                        <div class="mt-10 text-14">{{ Str::limit($badge->description, 100) }}</div>
                                        <div class="mt-10">
                                            <span class="badge bg-light-3 text-dark-1 py-5 px-15">
                                                @if($badge->criteria_type == 'course_completion_count')
                                                    Complete {{ $badge->criteria_value }} courses
                                                @elseif($badge->criteria_type == 'quiz_score_above')
                                                    Score {{ $badge->criteria_value }}% or higher on a quiz
                                                @elseif($badge->criteria_type == 'login_streak_days')
                                                    Login for {{ $badge->criteria_value }} consecutive days
                                                @else
                                                    {{ $badge->criteria_type }}: {{ $badge->criteria_value }}
                                                @endif
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            @endforeach
                        </div>
                    @else
                        <div class="text-center py-40">
                            <h4 class="text-18 fw-500 mb-10">You've Earned All Available Badges!</h4>
                            <p class="text-14 mb-20">Congratulations on your achievements! Check back later for new badges.</p>
                        </div>
                    @endif
                </div>
            </div>
        </div>
    </div>
</x-dashboard-layout> 