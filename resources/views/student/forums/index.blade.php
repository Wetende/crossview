<x-dashboard-layout>
    <x-slot name="title">My Forums</x-slot>

    <x-slot name="sidebar">
        @include('layouts.partials.student.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.student.header')
        <h1 class="text-30 lh-12 fw-700">My Forums</h1>
        <div class="breadcrumbs mt-10 pt-0 pb-0">
            <div class="breadcrumbs__content">
                <div class="breadcrumbs__item">
                    <a href="{{ route('home') }}">Home</a>
                </div>
                <div class="breadcrumbs__item">
                    <a href="{{ route('student.overview') }}">Dashboard</a>
                </div>
                <div class="breadcrumbs__item">
                    <a href="{{ route('student.forums.index') }}">My Forums</a>
                </div>
            </div>
        </div>
    </x-slot>

    {{-- Adapted content from dshb-forums.html --}}
    <div class="row y-gap-30">
        <div class="col-xl-9 col-lg-8">
            <div class="accordion -block-2 text-left js-accordion">
                {{-- Placeholder: Loop through forum categories/main topics --}}
                @for ($i = 0; $i < 3; $i++)
                <div class="accordion__item">
                    <div class="accordion__button">
                        <div class="accordion__icon">
                            <div class="icon" data-feather="plus"></div>
                            <div class="icon" data-feather="minus"></div>
                        </div>
                        <span class="text-17 fw-500 text-dark-1">Forum Category Title {{ $i + 1 }}</span>
                    </div>

                    <div class="accordion__content">
                        <div class="accordion__content__inner">
                            <div class="row y-gap-30">
                                {{-- Placeholder: Loop through forums/threads in this category --}}
                                @for ($j = 0; $j < 2; $j++)
                                <div class="col-12">
                                    <div class="py-30 px-30 rounded-8 bg-white -dark-bg-dark-1 shadow-4">
                                        <div class="row y-gap-20 justify-between items-center">
                                            <div class="col-xl-7">
                                                <div class="d-flex items-center">
                                                    <div class="icon-forum text-24 text-purple-1 mr-20"></div>
                                                    <div>
                                                        <h4 class="text-17 lh-15 fw-500">
                                                            <a href="{{ route('student.forums.show', ['threadId' => ($i * 2) + $j + 1]) }}">Sample Forum Thread Title {{ ($i * 2) + $j + 1 }}</a>
                                                        </h4>
                                                        <div class="text-13 lh-1 mt-5">Started by <a class="fw-500" href="#">Student User</a> - 2 hours ago</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div class="col-xl-2 text-right md:text-left">
                                                <div class="text-15 lh-1">3 Replies</div>
                                                <div class="text-13 lh-1 mt-5">15 Views</div>
                                            </div>

                                            <div class="col-xl-3 text-right md:text-left">
                                                <div class="text-13 lh-1">Last post by <a class="fw-500" href="#">Another Student</a></div>
                                                <div class="text-13 lh-1 mt-5">15 minutes ago</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                @endfor
                            </div>
                             <div class="mt-20 d-flex justify-end">
                                <a href="#" class="button -sm -purple-1 text-white">Start New Topic</a> {{-- Or link to course-specific forum --}}
                            </div>
                        </div>
                    </div>
                </div>
                @endfor
            </div>
        </div>

        <div class="col-xl-3 col-lg-4">
            <div class="pt-30 pb-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                <h5 class="text-17 fw-500 mb-30">Recent Topics</h5>
                <div class="row y-gap-20">
                    {{-- Placeholder: Recent Topics --}}
                    @for ($k = 1; $k <= 5; $k++)
                    <div class="col-12">
                        <a href="{{ route('student.forums.show', ['threadId' => $k]) }}" class="text-15 lh-15 fw-500 text-dark-1">Recent Topic Title {{ $k }}</a>
                        <div class="text-13 lh-1 mt-5">In <a href="#">Forum Category</a> - 5 min ago</div>
                    </div>
                    @endfor
                </div>

                <h5 class="text-17 fw-500 mt-30 mb-30">Forum Stats</h5>
                 <div class="row y-gap-10">
                    <div class="col-12 d-flex justify-between">
                        <span>Total Topics:</span>
                        <span class="fw-500">120</span>
                    </div>
                     <div class="col-12 d-flex justify-between">
                        <span>Total Posts:</span>
                        <span class="fw-500">850</span>
                    </div>
                     <div class="col-12 d-flex justify-between">
                        <span>Total Members:</span>
                        <span class="fw-500">300</span>
                    </div>
                 </div>
            </div>
        </div>
    </div>

</x-dashboard-layout> 