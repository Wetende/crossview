<x-dashboard-layout>
    <x-slot name="title">{{ $course->title }} - @lmsterm('Study Material') Overview</x-slot>

    <x-slot name="sidebar">
        @include('layouts.partials.student.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.student.header')
    </x-slot>

    <div class="dashboard__content bg-light-4">
        <div class="row y-gap-30">
            <div class="col-12">
                <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                        <h1 class="text-30 lh-12 fw-700">{{ $course->title }}</h1>
                        <a href="{{ route('student.my-learning') }}" class="button -md -light-3 text-dark-1">
                            <i class="icon-arrow-left text-16 mr-10"></i>
                            Back to My Learning
                        </a>
                    </div>
                    
                    <div class="py-30 px-30">
                        @if(session('info'))
                            <div class="alert alert-info mb-30">
                                {{ session('info') }}
                            </div>
                        @endif
                        
                        <div class="text-center py-60">
                            <div class="mb-30">
                                <i class="icon-file-text text-80 text-light-1"></i>
                            </div>
                            <h2 class="text-24 fw-700 mb-15">No Lessons Available Yet</h2>
                            <p class="text-16 text-light-1 mb-30">
                                This @lmsterm('study material') doesn't have any lessons published yet. Please check back later or contact your instructor for more information.
                            </p>
                            
                            @if($course->short_description)
                                <div class="py-20 px-30 rounded-16 bg-light-4 -dark-bg-dark-2 mb-30">
                                    <h3 class="text-18 fw-500 mb-10">@lmsterm('Study Material') Description</h3>
                                    <p class="text-15">{{ $course->short_description }}</p>
                                </div>
                            @endif
                            
                            <div class="d-flex justify-center x-gap-15">
                                <a href="{{ route('student.my-learning') }}" class="button -md -purple-1 text-white">
                                    View Other @lmsterm('Study Materials')
                                </a>
                                <a href="{{ route('student.overview') }}" class="button -md -outline-purple-1 text-purple-1">
                                    Go to Dashboard
                                </a>
                            </div>
                        </div>
                        
                        @if($courseSections->count() > 0)
                            <div class="border-top-light pt-30 mt-30">
                                <h3 class="text-20 fw-700 mb-20">@lmsterm('Study Material') Structure</h3>
                                <div class="accordion -block-2 text-left js-accordion">
                                    @foreach($courseSections as $section)
                                        <div class="accordion__item">
                                            <div class="accordion__button py-20 px-30 bg-light-4 -dark-bg-dark-2">
                                                <span class="text-17 fw-500">{{ $section->title }}</span>
                                                <div class="accordion__icon">
                                                    <div class="icon" data-feather="chevron-down"></div>
                                                </div>
                                            </div>
                                            <div class="accordion__content">
                                                <div class="accordion__content__inner px-30 py-20">
                                                    @if($section->description)
                                                        <p class="text-15 text-light-1">{{ $section->description }}</p>
                                                    @else
                                                        <p class="text-15 text-light-1">No lessons available in this section yet.</p>
                                                    @endif
                                                </div>
                                            </div>
                                        </div>
                                    @endforeach
                                </div>
                            </div>
                        @endif
                    </div>
                </div>
            </div>
        </div>
    </div>
</x-dashboard-layout> 