@props([
    'recommendations' => [],
    'title' => 'Recommended For You',
    'loading' => false,
    'id' => 'recommended-courses'
])

<div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4" id="{{ $id }}">
    <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
        <h2 class="text-20 lh-1 fw-500">{{ $title }}</h2>
        @if(count($recommendations) > 0)
            <a href="{{ route('student.recommendations') }}" class="text-14 text-purple-1 fw-500">View All</a>
        @endif
    </div>
    
    <div class="py-30 px-30">
        @if($loading)
            <div class="row y-gap-30">
                @for($i = 0; $i < 6; $i++)
                    <div class="col-xl-4 col-lg-6 col-md-6">
                        <div class="coursesCard -type-1">
                            <div class="relative">
                                <div class="coursesCard__image overflow-hidden rounded-8">
                                    <div class="w-1/1 h-250 bg-light-5 shimmer rounded-8"></div>
                                </div>
                            </div>
                            <div class="h-100 pt-15">
                                <div class="w-full h-20 bg-light-5 shimmer rounded-4 mb-10"></div>
                                <div class="w-3/4 h-15 bg-light-5 shimmer rounded-4 mb-10"></div>
                                <div class="w-1/2 h-15 bg-light-5 shimmer rounded-4"></div>
                            </div>
                        </div>
                    </div>
                @endfor
            </div>
        @elseif(count($recommendations) === 0)
            <div class="text-center py-60">
                <div class="size-80 flex-center rounded-full bg-light-6 mx-auto mb-20">
                    <i class="icon-lightbulb text-40 text-light-1"></i>
                </div>
                <h4 class="text-18 fw-500 mb-10">No Recommendations Available</h4>
                <p class="text-14 text-light-1 mb-20">Complete some @lmsterm('study materials') and quizzes to get personalized recommendations<br>based on your performance.</p>
                <a href="{{ route('courses.index') }}" class="button -md -purple-1 text-white">Browse @lmsterm('Study Materials')</a>
            </div>
        @else
            <div class="row y-gap-30">
                @foreach($recommendations as $course)
                    <div class="col-xl-4 col-lg-6 col-md-6">
                        <div class="coursesCard -type-1 border-light rounded-8 px-0 py-0 shadow-1 bg-white">
                            <div class="relative">
                                <div class="coursesCard__image overflow-hidden rounded-8">
                                    <img class="w-1/1 h-250 object-cover" 
                                         src="{{ $course->thumbnail_path ? asset($course->thumbnail_path) : asset('img/courses/default-thumbnail.jpg') }}" 
                                         alt="{{ $course->title }}">
                                    <div class="coursesCard__image_overlay rounded-8"></div>
                                    
                                    {{-- Priority Badge --}}
                                    @if(isset($course->recommendation_score) && $course->recommendation_score >= 8)
                                        <div class="absolute top-10 left-10">
                                            <span class="badge bg-red-1 text-white text-11 fw-500 px-10 py-5 d-flex items-center">
                                                <i class="icon-alert-triangle text-12 mr-5"></i>
                                                High Priority
                                            </span>
                                        </div>
                                    @elseif(isset($course->recommendation_score) && $course->recommendation_score >= 6)
                                        <div class="absolute top-10 left-10">
                                            <span class="badge bg-orange-1 text-white text-11 fw-500 px-10 py-5 d-flex items-center">
                                                <i class="icon-trending-up text-12 mr-5"></i>
                                                Improvement
                                            </span>
                                        </div>
                                    @else
                                        <div class="absolute top-10 left-10">
                                            <span class="badge bg-green-1 text-white text-11 fw-500 px-10 py-5 d-flex items-center">
                                                <i class="icon-check text-12 mr-5"></i>
                                                Build on Strengths
                                            </span>
                                        </div>
                                    @endif
                                    
                                    {{-- Price Badge --}}
                                    @if($course->price > 0)
                                        <div class="absolute top-10 right-10">
                                            <span class="badge bg-dark-1 text-white text-11 fw-500 px-10 py-5">
                                                ${{ number_format($course->price, 2) }}
                                            </span>
                                        </div>
                                    @else
                                        <div class="absolute top-10 right-10">
                                            <span class="badge bg-green-1 text-white text-11 fw-500 px-10 py-5">
                                                FREE
                                            </span>
                                        </div>
                                    @endif
                                </div>
                            </div>
                            
                            <div class="h-100 pt-15 px-20 pb-20">
                                {{-- Course Category --}}
                                @if($course->category)
                                    <div class="text-13 lh-1 fw-500 text-purple-1 mb-10">
                                        {{ $course->category->name }}
                                    </div>
                                @endif
                                
                                {{-- Course Title --}}
                                <div class="text-17 lh-15 fw-500 text-dark-1 mt-10">
                                    <a class="-dark-text-white" href="{{ route('courses.show', $course->slug) }}">
                                        {{ Str::limit($course->title, 50) }}
                                    </a>
                                </div>
                                
                                {{-- Teacher Info --}}
                                @if($course->user)
                                    <div class="d-flex items-center mt-10">
                                        <div class="size-30 rounded-full overflow-hidden mr-10">
                                            @if($course->user->profile_picture_path)
                                                <img src="{{ asset($course->user->profile_picture_path) }}" alt="{{ $course->user->name }}" class="w-1/1 h-1/1 object-cover">
                                            @else
                                                <div class="size-30 bg-purple-1 rounded-full flex-center">
                                                    <span class="text-white text-12 fw-500">{{ substr($course->user->name, 0, 1) }}</span>
                                                </div>
                                            @endif
                                        </div>
                                        <div class="text-14 lh-1 text-light-1">{{ $course->user->name }}</div>
                                    </div>
                                @endif
                                
                                {{-- Subject Info --}}
                                @if($course->subject)
                                    <div class="d-flex items-center mt-10">
                                        <i class="icon-book text-14 text-light-1 mr-10"></i>
                                        <div class="text-14 lh-1 text-light-1">{{ $course->subject->name }}</div>
                                    </div>
                                @endif
                                
                                {{-- Recommendation Reason --}}
                                <div class="mt-15 pt-15 border-top-light">
                                    @if(isset($course->recommendation_score) && $course->recommendation_score >= 8)
                                        <div class="d-flex items-center">
                                            <i class="icon-trending-down text-14 text-red-1 mr-10"></i>
                                            <span class="text-13 text-red-1 fw-500">Needs immediate attention</span>
                                        </div>
                                    @elseif(isset($course->recommendation_score) && $course->recommendation_score >= 6)
                                        <div class="d-flex items-center">
                                            <i class="icon-trending-up text-14 text-orange-1 mr-10"></i>
                                            <span class="text-13 text-orange-1 fw-500">Room for improvement</span>
                                        </div>
                                    @else
                                        <div class="d-flex items-center">
                                            <i class="icon-check text-14 text-green-1 mr-10"></i>
                                            <span class="text-13 text-green-1 fw-500">Build on your strengths</span>
                                        </div>
                                    @endif
                                </div>
                                
                                {{-- Action Button --}}
                                <div class="mt-20">
                                    <a href="{{ route('courses.show', $course->slug) }}" 
                                       class="button -md -purple-1 text-white w-1/1 d-flex justify-center">
                                        View @lmsterm('Study Material')
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                @endforeach
            </div>
        @endif
    </div>
</div>

{{-- Custom CSS for shimmer effect --}}
@push('styles')
<style>
.shimmer {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
    0% {
        background-position: -200% 0;
    }
    100% {
        background-position: 200% 0;
    }
}

.coursesCard {
    transition: all 0.3s ease;
}

.coursesCard:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.coursesCard__image_overlay {
    background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.1) 100%);
}
</style>
@endpush 