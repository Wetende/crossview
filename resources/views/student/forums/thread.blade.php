<x-dashboard-layout>
    <x-slot name="title">Forum Thread: {{ $threadTitle ?? 'View Thread' }}</x-slot> {{-- Placeholder title --}}

    <x-slot name="sidebar">
        @include('layouts.partials.student.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.student.header')
        {{-- Placeholder: Fetch actual thread title --}}
        @php $threadTitle = "Sample Thread Title (ID: " . ($threadId ?? 'N/A') . ")"; @endphp 
        <h1 class="text-30 lh-12 fw-700">{{ $threadTitle }}</h1>
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
                <div class="breadcrumbs__item">
                    {{-- Placeholder: Add category breadcrumb if applicable --}}
                    <a href="#">Forum Category</a> 
                </div>
                <div class="breadcrumbs__item">
                    <a href="{{ route('student.forums.show', ['threadId' => $threadId ?? 1]) }}" class="text-dark-1">{{ $threadTitle }}</a>
                </div>
            </div>
        </div>
    </x-slot>

    {{-- Adapted content from dshb-forums.html (single thread view) --}}
    <div class="row y-gap-30">
        <div class="col-12">
            <div class="py-30 px-30 rounded-8 bg-white -dark-bg-dark-1 shadow-4">
                <div class="row justify-between y-gap-20 items-center">
                    <div class="col-xl-6 col-lg-auto">
                        <div class="row x-gap-10 y-gap-10 items-center">
                            <div class="col-auto">
                                <button class="button -sm -outline-purple-1 text-purple-1">Previous</button>
                            </div>
                            <div class="col-auto">
                                <div class="pagination__count">Page <span class="fw-500">1</span> of <span class="fw-500">3</span></div>
                            </div>
                            <div class="col-auto">
                                <button class="button -sm -outline-purple-1 text-purple-1">Next</button>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-6 col-lg">
                        <div class="row x-gap-15 y-gap-15 justify-end items-center">
                            <div class="col-auto">
                                {{-- <button class="button -sm -purple-1 text-white">Follow this topic</button> --}}
                            </div>
                            <div class="col-auto">
                                <button class="button -sm -purple-1 text-white">Post Reply</button>
                            </div>
                        </div>
                    </div>
                </div>

                {{-- Forum Posts Loop --}}
                @for ($p = 0; $p < 3; $p++)
                <div class="border-top-light pt-30 mt-30">
                    <div class="row x-gap-50">
                        <div class="col-md-auto col-auto">
                            <div class="d-flex items-center">
                                <img src="{{ asset('assets/img/avatars/placeholder.png') }}" alt="avatar" class="size-50 rounded-full">
                                <div class="ml-20">
                                    <div class="text-15 lh-15 fw-500 text-dark-1">Student User {{ $p + 1 }}</div>
                                    <div class="text-13 lh-1 mt-5">Joined: Jan 2023</div>
                                    <div class="text-13 lh-1 mt-5">Posts: 25</div>
                                </div>
                            </div>
                        </div>

                        <div class="col">
                            <div class="d-flex justify-between">
                                <div class="text-14 lh-13 text-light-1">Posted: 2 hours ago</div>
                                <div class="d-flex x-gap-10">
                                    <a href="#" class="text-14 text-purple-1">Quote</a>
                                    <a href="#" class="text-14 text-purple-1">Report</a>
                                </div>
                            </div>

                            <div class="forum-post-content text-15 text-dark-1 mt-15">
                                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                                <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                                @if($p == 1)
                                <div class="quote bg-light-5 -dark-bg-dark-2 p-20 mt-20 rounded-8">
                                    <div class="text-14 fw-500 text-dark-1">Originally posted by Student User 1:</div>
                                    <p class="text-14 italic mt-5">This is a quoted text example.</p>
                                </div>
                                <p class="mt-15">Replying to the quote above.</p>
                                @endif
                            </div>
                            
                            <div class="border-top-light mt-20 pt-15">
                                <div class="text-13 lh-1">Signature: Learning everyday!</div>
                            </div>
                        </div>
                    </div>
                </div>
                @endfor
                {{-- End Forum Posts Loop --}}

                <div class="row justify-between y-gap-20 items-center pt-30 mt-20 border-top-light">
                    <div class="col-xl-6 col-lg-auto">
                         <div class="row x-gap-10 y-gap-10 items-center">
                            <div class="col-auto">
                                <button class="button -sm -outline-purple-1 text-purple-1">Previous</button>
                            </div>
                            <div class="col-auto">
                                <div class="pagination__count">Page <span class="fw-500">1</span> of <span class="fw-500">3</span></div>
                            </div>
                            <div class="col-auto">
                                <button class="button -sm -outline-purple-1 text-purple-1">Next</button>
                            </div>
                        </div>
                    </div>
                </div>

                {{-- Reply Form --}}
                <div class="border-top-light pt-30 mt-30">
                    <h4 class="text-17 fw-500 mb-20">Post a Reply</h4>
                    <form action="#" class="row y-gap-20">
                        <div class="col-12">
                            <textarea name="reply_content" placeholder="Your reply..." rows="6" class="form-control"></textarea>
                        </div>
                        <div class="col-12">
                            <button type="submit" class="button -md -purple-1 text-white">Submit Reply</button>
                        </div>
                    </form>
                </div>
                {{-- End Reply Form --}}
            </div>
        </div>
    </div>

</x-dashboard-layout> 