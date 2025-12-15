<x-dashboard-layout>
    <x-slot name="title">Bookmarked @lmsterm('Study Materials')</x-slot>

    <x-slot name="sidebar">
        @include('layouts.partials.student.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.student.header')
        <h1 class="text-30 lh-12 fw-700">Bookmarked @lmsterm('Study Materials')</h1>
        <div class="breadcrumbs mt-10 pt-0 pb-0">
            <div class="breadcrumbs__content">
                <div class="breadcrumbs__item">
                    <a href="{{ route('home') }}">Home</a>
                </div>
                <div class="breadcrumbs__item">
                    <a href="{{ route('student.overview') }}">Dashboard</a>
                </div>
                <div class="breadcrumbs__item">
                    <a href="{{ route('student.bookmarked-courses') }}">Bookmarks</a>
                </div>
            </div>
        </div>
    </x-slot>

    {{-- Adapted content from dshb-bookmarks.html --}}
    <div class="row y-gap-30">
        <div class="col-12">
            <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                <div class="d-flex items-center py-20 px-30 border-bottom-light">
                    <h2 class="text-17 lh-1 fw-500">My Bookmarked @lmsterm('Study Materials')</h2>
                </div>

                <div class="py-30 px-30">
                    <div class="row y-gap-30">
                        {{-- Placeholder for looping through student's bookmarked courses --}}
                        {{-- Example Bookmarked Course Card (to be replaced with dynamic data) --}}
                        <div class="col-xl-6 col-lg-6 col-md-6">
                            <div class="coursesCard -type-1 border-light rounded-8">
                                <div class="relative">
                                    <div class="coursesCard__image overflow-hidden rounded-top-8">
                                        <img class="w-1/1" src="{{ asset('img/courses/1.png') }}" alt="image"> {{-- Use asset() --}}
                                        <div class="coursesCard__image_overlay rounded-top-8"></div>
                                    </div>
                                    <div class="d-flex justify-between py-10 px-10 absolute-full-center z-3">
                                        <div>
                                            {{-- <div class="px-15 rounded-200 bg-purple-1">
                                                <span class="text-11 lh-1 uppercase fw-500 text-white">Popular</span>
                                            </div> --}}
                                        </div>
                                        <div>
                                            <button class="button - λειτουργία -sm -dark-1 text-white"> <i class="icon-bookmark"></i> </button> {{-- remove bookmark button --}}
                                        </div>
                                    </div>
                                </div>
                                <div class="h-100 px-15 py-15">
                                    <div class="d-flex items-center">
                                        <div class="text-14 lh-1 text-yellow-1 mr-10">4.5</div>
                                        <div class="d-flex x-gap-5 items-center">
                                            <div class="icon-star text-9 text-yellow-1"></div>
                                            {{-- Add more stars --}}
                                        </div>
                                        <div class="text-13 lh-1 ml-10">(1991)</div>
                                    </div>
                                    <div class="text-17 lh-15 fw-500 text-dark-1 mt-10">
                                        <a class="-dark-text-white" href="#">Learn Figma - UI/UX Design Essential Training</a> {{-- Link to course --}}
                                    </div>
                                    <div class="d-flex x-gap-10 items-center pt-10">
                                        <div class="d-flex items-center">
                                            <div class="mr-8"><img src="{{ asset('img/coursesCards/icons/1.svg') }}" alt="icon"></div>
                                            <div class="text-14 lh-1">6 lesson</div>
                                        </div>
                                        <div class="d-flex items-center">
                                            <div class="mr-8"><img src="{{ asset('img/coursesCards/icons/2.svg') }}" alt="icon"></div>
                                            <div class="text-14 lh-1">3h 56m</div>
                                        </div>
                                        <div class="d-flex items-center">
                                            <div class="mr-8"><img src="{{ asset('img/coursesCards/icons/3.svg') }}" alt="icon"></div>
                                            <div class="text-14 lh-1">Beginner</div>
                                        </div>
                                    </div>
                                    <div class="coursesCard-footer">
                                        <div class="coursesCard-footer__author">
                                            <img src="{{ asset('img/general/avatar-1.png') }}" alt="image">
                                            <div>Ali Tufan</div>
                                        </div>
                                        <div class="coursesCard-footer__price">
                                            <div>$179</div>
                                            <div>$79</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {{-- End Example Bookmarked Course Card --}}

                        <div class="col-12 text-center pt-20">
                            <p>You have no bookmarked courses.</p> {{-- Show if no bookmarks --}}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

</x-dashboard-layout> 