<x-dashboard-layout title="Teacher Dashboard - @lmsterm('Study Material') Reviews">
    <x-slot name="header">
        @include('layouts.partials.teacher.header')
    </x-slot>

    <x-slot name="sidebar">
        @include('layouts.partials.teacher.sidebar')
    </x-slot>

    <div class="dashboard__content bg-light-4">
        <div class="row pb-50 mb-10">
            <div class="col-auto">
                <h1 class="text-30 lh-12 fw-700">@lmsterm('Study Material') Reviews</h1>
                <div class="text-15 lh-12 fw-500 text-dark-1 mt-5">View and manage student feedback for your courses</div>
            </div>
        </div>

        <div class="row y-gap-30">
            <div class="col-12">
                <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 overflow-hidden">
                    <!-- Header with filter options -->
                    <div class="px-30 pt-30 pb-20 border-bottom-light">
                        <div class="row justify-between items-center">
                            <div class="col-auto">
                                <h3 class="text-18 fw-500">All Reviews ({{ $totalCount }})</h3>
                            </div>
                            <div class="col-auto">
                                <form action="{{ route('teacher.reviews.index') }}" method="GET" id="filterForm">
                                    <div class="d-flex x-gap-20 y-gap-10 flex-wrap">
                                        <div>
                                            <div class="dropdown js-dropdown js-category-active">
                                                <div class="dropdown__button d-flex items-center text-14 rounded-8 px-20 py-10 border-light">
                                                    <span class="js-dropdown-title">{{ request('course_id') ? $courses->firstWhere('id', request('course_id'))->title : 'All '.get_lms_term('Study Materials') }}</span>
                                                    <i class="icon-chevron-down text-9 ml-10"></i>
                                                </div>
                                                <div class="toggle-element -dropdown js-click-dropdown dropdown__menu">
                                                    <div class="text-14 y-gap-15 js-dropdown-list">
                                                        <div><a href="#" class="d-block js-dropdown-link" onclick="updateFilter('course_id', '')">All {{ get_lms_term('Study Materials') }}</a></div>
                                                        @foreach($courses as $course)
                                                            <div><a href="#" class="d-block js-dropdown-link" onclick="updateFilter('course_id', '{{ $course->id }}')">{{ $course->title }}</a></div>
                                                        @endforeach
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <div class="dropdown js-dropdown js-category-active">
                                                <div class="dropdown__button d-flex items-center text-14 rounded-8 px-20 py-10 border-light">
                                                    <span class="js-dropdown-title">{{ request('rating') ? request('rating') . ' Stars' : 'All Ratings' }}</span>
                                                    <i class="icon-chevron-down text-9 ml-10"></i>
                                                </div>
                                                <div class="toggle-element -dropdown js-click-dropdown dropdown__menu">
                                                    <div class="text-14 y-gap-15 js-dropdown-list">
                                                        <div><a href="#" class="d-block js-dropdown-link" onclick="updateFilter('rating', '')">All Ratings</a></div>
                                                        <div><a href="#" class="d-block js-dropdown-link" onclick="updateFilter('rating', '5')">5 Stars</a></div>
                                                        <div><a href="#" class="d-block js-dropdown-link" onclick="updateFilter('rating', '4')">4 Stars</a></div>
                                                        <div><a href="#" class="d-block js-dropdown-link" onclick="updateFilter('rating', '3')">3 Stars</a></div>
                                                        <div><a href="#" class="d-block js-dropdown-link" onclick="updateFilter('rating', '2')">2 Stars</a></div>
                                                        <div><a href="#" class="d-block js-dropdown-link" onclick="updateFilter('rating', '1')">1 Star</a></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <input type="hidden" name="course_id" id="course_id" value="{{ request('course_id') }}">
                                    <input type="hidden" name="rating" id="rating" value="{{ request('rating') }}">
                                </form>
                            </div>
                        </div>
                    </div>

                    <!-- Reviews List -->
                    <div class="py-20 px-30">
                        @if($reviews->count() > 0)
                            @foreach($reviews as $review)
                                <div class="py-25 px-25 rounded-12 bg-light-7 -dark-bg-dark-2 mb-20 transition-all hover:shadow-3">
                                    <div class="row x-gap-20 y-gap-20">
                                        <!-- Reviewer Info -->
                                        <div class="col-auto">
                                            <div class="d-flex flex-column items-center">
                                                @if($review->user->profile_photo_path)
                                                    <img class="size-60 object-cover rounded-full mb-10" src="{{ Storage::url($review->user->profile_photo_path) }}" alt="{{ $review->getDisplayNameAttribute() }}">
                                                @else
                                                    <div class="size-60 flex-center rounded-full bg-purple-1 mb-10">
                                                        <span class="text-white text-18 fw-500">{{ substr($review->getDisplayNameAttribute(), 0, 1) }}</span>
                                                    </div>
                                                @endif
                                                <div class="text-center">
                                                    <div class="text-14 fw-500">{{ $review->getDisplayNameAttribute() }}</div>
                                                    @if(!$review->is_anonymous && $review->user->job_title)
                                                        <div class="text-12 text-light-1">{{ $review->user->job_title }}</div>
                                                    @endif
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- Review Content -->
                                        <div class="col">
                                            <div class="d-flex flex-column h-full">
                                                <!-- Rating and Metadata -->
                                                <div class="d-flex justify-between items-start mb-15">
                                                    <div>
                                                        <div class="d-flex x-gap-5 mb-5">
                                                            @for($i = 1; $i <= 5; $i++)
                                                                <div><i class="icon-star text-12 {{ $i <= $review->rating ? 'text-yellow-1' : 'text-light-1' }}"></i></div>
                                                            @endfor
                                                        </div>
                                                        <div class="text-14 text-light-1">
                                                            Reviewed on <a href="{{ route('teacher.courses.edit', $review->course->id) }}" class="text-purple-1 underline">{{ $review->course->title }}</a>
                                                        </div>
                                                    </div>
                                                    <div class="text-12 text-light-1">
                                                        {{ $review->created_at->format('M d, Y') }}
                                                    </div>
                                                </div>
                                                
                                                <!-- Review Text -->
                                                <div class="flex-grow-1">
                                                    @if(strlen($review->content) > 0)
                                                        <div class="text-14 lh-16 text-dark-1">{{ $review->content }}</div>
                                                    @else
                                                        <div class="text-14 lh-16 text-light-1 italic">No written review provided - rating only.</div>
                                                    @endif
                                                </div>
                                                
                                                <!-- Actions -->
                                                <div class="d-flex x-gap-15 justify-end mt-15 pt-15 border-top-light">
                                                    @if(!$review->is_approved)
                                                        <form action="{{ route('teacher.reviews.approve', $review->id) }}" method="POST" class="d-inline">
                                                            @csrf
                                                            <button type="submit" class="button -sm -green-1 text-white px-20 py-5 rounded-8">
                                                                <i class="icon-check text-12 mr-5"></i> Approve
                                                            </button>
                                                        </form>
                                                    @else
                                                        <span class="button -sm -dark-2 text-white px-20 py-5 rounded-8">
                                                            <i class="icon-check-circle text-12 mr-5"></i> Approved
                                                        </span>
                                                    @endif
                                                    
                                                    @if($review->is_approved)
                                                        <form action="{{ route('teacher.reviews.hide', $review->id) }}" method="POST" class="d-inline">
                                                            @csrf
                                                            <button type="submit" class="button -sm -red-1 text-white px-20 py-5 rounded-8">
                                                                <i class="icon-eye-off text-12 mr-5"></i> Hide
                                                            </button>
                                                        </form>
                                                    @endif
                                                    
                                                    <button class="button -sm -outline-dark-1 text-dark-1 px-20 py-5 rounded-8 reply-button" data-review-id="{{ $review->id }}">
                                                        <i class="icon-message text-12 mr-5"></i> Reply
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            @endforeach
                        @else
                            <!-- Empty State -->
                            <div class="text-center py-50">
                                <img src="{{ asset('img/dashboard/empty-state/reviews.svg') }}" alt="No reviews" class="h-150 mb-20">
                                <h4 class="text-18 fw-500 mb-10">No reviews yet</h4>
                                <p class="text-14 text-light-1 max-w-300 mx-auto">When students leave reviews for your courses, they'll appear here.</p>
                            </div>
                        @endif
                    </div>
                    
                    <!-- Pagination -->
                    @if($reviews->count() > 0)
                        <div class="border-top-light">
                            <div class="px-30 py-20">
                                <div class="row justify-between items-center">
                                    <div class="col-auto">
                                        <div class="text-14 text-light-1">
                                            Showing {{ $reviews->firstItem() }}-{{ $reviews->lastItem() }} of {{ $reviews->total() }} reviews
                                        </div>
                                    </div>
                                    <div class="col-auto">
                                        {{ $reviews->appends(request()->query())->links('vendor.pagination.default') }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    @endif
                </div>
            </div>
        </div>
    </div>

    @push('scripts')
    <script>
        function updateFilter(field, value) {
            document.getElementById(field).value = value;
            document.getElementById('filterForm').submit();
        }

        document.addEventListener("DOMContentLoaded", function() {
            const replyButtons = document.querySelectorAll('.reply-button');
            replyButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const reviewId = this.getAttribute('data-review-id');
                    // Open modal or toggle reply form
                    alert('Reply feature will be implemented soon. Review ID: ' + reviewId);
                });
            });
        });
    </script>
    @endpush
</x-dashboard-layout>