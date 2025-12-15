<x-dashboard-layout>
    <x-slot name="title">My Certificates</x-slot>

    <x-slot name="sidebar">
        @include('layouts.partials.student.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.student.header')
        <h1 class="text-30 lh-12 fw-700">My Certificates</h1>
        <div class="breadcrumbs mt-10 pt-0 pb-0">
            <div class="breadcrumbs__content">
                <div class="breadcrumbs__item">
                    <a href="{{ route('home') }}">Home</a>
                </div>
                <div class="breadcrumbs__item">
                    <a href="{{ route('student.overview') }}">Dashboard</a>
                </div>
                <div class="breadcrumbs__item">
                    <a href="{{ route('student.my-certificates') }}">My Certificates</a>
                </div>
            </div>
        </div>
    </x-slot>

    {{-- Adapted content from dshb-administration.html (generic list/card structure) --}}
    <div class="row y-gap-30">
        <div class="col-12">
            <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                <div class="py-30 px-30">
                    <div class="row y-gap-30">
                        {{-- Placeholder for looping through student's certificates --}}
                        {{-- Example Certificate Item (to be replaced with dynamic data) --}}
                        <div class="col-12">
                            <div class="d-flex justify-between items-center py-20 px-20 rounded-8 border-light -dark-border-dark-2">
                                <div>
                                    <h4 class="text-17 lh-15 fw-500">Certificate of Completion: Introduction to Web Development</h4>
                                    <div class="text-14 lh-1 text-light-1 mt-5">Issued on: 2023-10-26</div>
                                    <div class="text-14 lh-1 text-light-1 mt-5">@lmsterm('Study Material'): Web Development Bootcamp</div>
                                </div>
                                <a href="#" class="button -sm -purple-1 text-white">Download</a> {{-- Placeholder Link --}}
                            </div>
                        </div>

                        <div class="col-12">
                            <div class="d-flex justify-between items-center py-20 px-20 rounded-8 border-light -dark-border-dark-2">
                                <div>
                                    <h4 class="text-17 lh-15 fw-500">Certificate of Achievement: Advanced JavaScript</h4>
                                    <div class="text-14 lh-1 text-light-1 mt-5">Issued on: 2023-11-15</div>
                                    <div class="text-14 lh-1 text-light-1 mt-5">@lmsterm('Study Material'): Mastering JavaScript</div>
                                </div>
                                <a href="#" class="button -sm -purple-1 text-white">Download</a> {{-- Placeholder Link --}}
                            </div>
                        </div>
                        {{-- End Example Certificate Item --}}

                        <div class="col-12 text-center pt-20">
                            <p>You have not earned any certificates yet.</p> {{-- Show if no certificates --}}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

</x-dashboard-layout> 