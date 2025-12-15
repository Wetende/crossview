<x-dashboard-layout>
    <x-slot name="title">Child @lmsterm('Study Material') Progress</x-slot>

    <x-slot name="sidebar">
        @include('layouts.partials.parent.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.parent.header')
        <h1 class="text-30 lh-12 fw-700">Detailed @lmsterm('Study Material') Progress</h1>
        <div class="breadcrumbs mt-10 pt-0 pb-0">
            <div class="breadcrumbs__content">
                <div class="breadcrumbs__item">
                    <a href="{{ route('home') }}">Home</a>
                </div>
                <div class="breadcrumbs__item">
                    <a href="{{ route('parent.overview') }}">Dashboard</a>
                </div>
                <div class="breadcrumbs__item">
                    <a href="{{ route('parent.child-progress') }}">Child Progress</a>
                </div>
                <div class="breadcrumbs__item">
                    <a href="javascript:void(0);">{{ $enrollment->course->title }}</a>
                </div>
            </div>
        </div>
    </x-slot>

    <div class="dashboard__content bg-light-4">
        <div class="row mb-30">
            <div class="col-12">
                <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <div class="d-flex items-center justify-between">
                        <div class="d-flex items-center">
                            @php
                                $backgroundUrl = $enrollment->course->thumbnail_path ? asset($enrollment->course->thumbnail_path) : asset('img/courses/default-thumbnail.jpg');
                                $progressValue = $enrollment->progress ?? 0;
                            @endphp
                            <div class="shrink-0 size-60 rounded-16 bg-image-cover mr-20 js-bg-image" data-bg-url="{{ $backgroundUrl }}"></div>
                            <div>
                                <h3 class="text-20 lh-1 fw-500">{{ $enrollment->course->title }}</h3>
                                <div class="d-flex items-center mt-10">
                                    <span class="lh-1 text-14 {{ $enrollment->completed_at ? 'text-green-1' : 'text-purple-1' }}">
                                        {{ $enrollment->completed_at ? 'Completed' : 'In Progress' }}
                                    </span>
                                    @if($enrollment->completed_at)
                                        <span class="lh-1 text-14 ml-10">on {{ $enrollment->completed_at->format('M d, Y') }}</span>
                                    @endif
                                </div>
                            </div>
                        </div>
                        <div>
                            <div class="text-14 text-dark-1">Student: <span class="fw-500">{{ $child->name }}</span></div>
                            <div class="text-14 text-dark-1 mt-5">Enrolled: <span class="fw-500">{{ $enrollment->enrolled_at ? $enrollment->enrolled_at->format('M d, Y') : 'N/A' }}</span></div>
                        </div>
                    </div>

                    <div class="mt-30">
                        <div class="d-flex justify-between items-center mb-10">
                            <div class="text-16 lh-1 fw-500">Overall Progress</div>
                            <div class="text-16 lh-1 fw-500">{{ number_format($enrollment->progress ?? 0, 1) }}%</div>
                        </div>
                        <div class="progress-bar bg-light-3 -dark-bg-dark-5 h-8 rounded-full">
                            <div class="progress-bar__item bg-purple-1 h-full rounded-full js-progress-bar" data-progress="{{ $progressValue }}"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col-12">
                <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <h3 class="text-20 lh-1 fw-500 mb-30">@lmsterm('Study Material') Content Progress</h3>

                    @if($enrollment->course->sections->isEmpty())
                        <div class="text-center py-20">
                            <p>No course content available.</p>
                        </div>
                    @else
                        <div class="accordion -block js-accordion">
                            @foreach($enrollment->course->sections as $section)
                                <div class="accordion__item rounded-8 bg-light-4 -dark-bg-dark-2 mb-10">
                                    <div class="accordion__button px-20 py-15 d-flex items-center justify-between">
                                        <div class="d-flex items-center">
                                            <div class="accordion__icon size-40 flex-center mr-10 bg-light-7 -dark-bg-dark-1 rounded-full">
                                                <div class="icon-minus"></div>
                                                <div class="icon-plus"></div>
                                            </div>
                                            <span class="text-16 fw-500">{{ $section->title }}</span>
                                        </div>
                                    </div>

                                    <div class="accordion__content">
                                        <div class="px-30 py-20">
                                            @if($section->lessons->isEmpty())
                                                <p class="text-center py-10">No lessons in this section.</p>
                                            @else
                                                <div class="table-responsive">
                                                    <table class="table w-1/1">
                                                        <thead class="text-14 fw-500 bg-light-3 -dark-bg-dark-2">
                                                            <tr>
                                                                <th>Lesson</th>
                                                                <th>Type</th>
                                                                <th class="text-center">Duration</th>
                                                                <th class="text-center">Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody class="text-14">
                                                            @foreach($section->lessons as $lesson)
                                                                <tr class="border-bottom-light">
                                                                    <td>{{ $lesson->title }}</td>
                                                                    <td>{{ ucfirst($lesson->type) }}</td>
                                                                    <td class="text-center">{{ $lesson->duration_in_minutes }} min</td>
                                                                    <td class="text-center">
                                                                        <div class="badge {{ $lesson->is_completed ? 'bg-green-1 text-white' : 'bg-light-7 -dark-bg-dark-3 text-dark-1 -dark-text-white' }}">
                                                                            {{ $lesson->is_completed ? 'Completed' : 'Not Completed' }}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            @endforeach
                                                        </tbody>
                                                    </table>
                                                </div>
                                            @endif
                                            
                                            @if($section->quizzes->isNotEmpty())
                                                <div class="mt-20">
                                                    <h4 class="text-16 fw-500 mb-15">Quizzes in this section</h4>
                                                    <div class="table-responsive">
                                                        <table class="table w-1/1">
                                                            <thead class="text-14 fw-500 bg-light-3 -dark-bg-dark-2">
                                                                <tr>
                                                                    <th>Quiz</th>
                                                                    <th class="text-center">Attempts</th>
                                                                    <th class="text-center">Best Score</th>
                                                                    <th class="text-center">Status</th>
                                                                    <th class="text-center">Actions</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody class="text-14">
                                                                @foreach($section->quizzes as $quiz)
                                                                    @php
                                                                        $attempts = $quiz->quizAttempts->where('user_id', $child->id);
                                                                        $bestAttempt = $attempts->sortByDesc('score')->first();
                                                                    @endphp
                                                                    <tr class="border-bottom-light">
                                                                        <td>{{ $quiz->title }}</td>
                                                                        <td class="text-center">{{ $attempts->count() }}</td>
                                                                        <td class="text-center">{{ $bestAttempt ? number_format($bestAttempt->score, 1) . '%' : 'Not attempted' }}</td>
                                                                        <td class="text-center">
                                                                            @if($bestAttempt)
                                                                                <div class="badge {{ $bestAttempt->passed ? 'bg-green-1 text-white' : 'bg-red-1 text-white' }}">
                                                                                    {{ $bestAttempt->passed ? 'Passed' : 'Failed' }}
                                                                                </div>
                                                                            @else
                                                                                <div class="badge bg-light-7 -dark-bg-dark-3 text-dark-1 -dark-text-white">
                                                                                    Not Started
                                                                                </div>
                                                                            @endif
                                                                        </td>
                                                                        <td class="text-center">
                                                                            @if($bestAttempt)
                                                                                <a href="{{ route('parent.child.quiz-results', ['child' => $child->id, 'quizAttempt' => $bestAttempt->id]) }}" class="button -sm -purple-1 text-white">View Results</a>
                                                                            @else
                                                                                <span class="text-light-1">No attempts</span>
                                                                            @endif
                                                                        </td>
                                                                    </tr>
                                                                @endforeach
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            @endif
                                        </div>
                                    </div>
                                </div>
                            @endforeach
                        </div>
                    @endif
                </div>
            </div>
        </div>

        <div class="d-flex items-center">
            <a href="{{ route('parent.child-progress') }}" class="button -md -light-3 -dark-bg-dark-3 text-dark-1 -dark-text-white">{{ __('Back to Child Progress') }}</a>
            <a href="{{ route('parent.child.dashboard', ['child' => $child->id]) }}" class="button -md -light-3 -dark-bg-dark-3 text-dark-1 -dark-text-white ml-10">{{ __('Child Dashboard') }}</a>
        </div>
    </div>
</x-dashboard-layout>

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Set background images
    document.querySelectorAll('.js-bg-image').forEach(function(element) {
        const bgUrl = element.getAttribute('data-bg-url');
        element.style.backgroundImage = 'url(' + bgUrl + ')';
    });
    
    // Set progress bars
    document.querySelectorAll('.js-progress-bar').forEach(function(element) {
        const progress = element.getAttribute('data-progress');
        element.style.width = progress + '%';
    });
});
</script>
@endpush 