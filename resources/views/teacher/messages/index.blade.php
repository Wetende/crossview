<x-dashboard-layout title="Teacher Dashboard - Messages">
    <x-slot name="header">
        @include('layouts.partials.teacher.header')
    </x-slot>

    <x-slot name="sidebar">
        @include('layouts.partials.teacher.sidebar')
    </x-slot>

    <div class="dashboard__content bg-light-4">
        <div class="row pb-50 mb-10">
            <div class="col-auto">
                <h1 class="text-30 lh-12 fw-700">Messages</h1>
                <div class="text-15 lh-12 fw-500 text-dark-1 mt-5">Communicate with students and administration.</div>
            </div>
        </div>

        <div class="row y-gap-30">
            <div class="col-12">
                <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 min-vh-100">
                    <div class="d-flex flex-wrap">
                        {{-- Column 1: Message Threads/Contacts List --}}
                        <div class="col-xl-4 col-lg-5 col-md-12 border-end-light -dark-border-dark-2">
                            <div class="py-30 px-30">
                                <div class="d-flex items-center justify-between mb-20">
                                    <h2 class="text-17 lh-1 fw-500">Conversations</h2>
                                    {{-- <button class="button -sm -purple-1 text-white">New Message</button> --}}
                                </div>
                                
                                <div class="relative">
                                    <input type="text" class="form-control py-15" placeholder="Search contacts...">
                                    <button class="absolute d-flex items-center h-full right-15 top-0">
                                        <i class="icon-search text-13"></i>
                                    </button>
                                </div>

                                <div class="mt-20 message-list-scrollable" style="max-height: 60vh; overflow-y: auto;">
                                    {{-- Start: Example Message Thread Item (Loop this) --}}
                                    {{-- @foreach ($conversations as $conversation) --}}
                                    <a href="#" class="d-flex items-center py-20 px-10 rounded-8 -hover-light-2 {{-- $loop->first ? 'bg-light-2 -dark-bg-dark-2' : '' --}}">
                                        <div class="shrink-0 mr-15">
                                            <img class="size-40 object-cover rounded-full" src="{{ asset('img/avatars/2.png') }}" alt="User avatar"> {{-- Placeholder --}}
                                        </div>
                                        <div class="grow">
                                            <div class="d-flex items-center justify-between">
                                                <div class="text-15 lh-12 fw-500 text-dark-1">Jerome Bell</div> {{-- Placeholder Name --}}
                                                <div class="text-13 lh-1 text-light-1">10:23 AM</div> {{-- Placeholder Time --}}
                                            </div>
                                            <div class="text-13 lh-12 text-light-1 mt-5">Lorem ipsum dolor sit amet, consectetur...</div> {{-- Placeholder Message Snippet --}}
                                        </div>
                                    </a>
                                    {{-- @endforeach --}}
                                    {{-- End: Example Message Thread Item --}}

                                    {{-- Placeholder for no conversations --}}
                                    <div class="text-center py-50 d-none"> {{-- Add logic to show this if no conversations --}}
                                        <p>No conversations yet.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {{-- Column 2: Active Chat Window --}}
                        <div class="col-xl-8 col-lg-7 col-md-12">
                            <div class="py-30 px-30 h-full d-flex flex-column">
                                {{-- Chat Header --}}
                                <div class="d-flex items-center justify-between pb-20 border-bottom-light -dark-border-dark-2">
                                    <div class="d-flex items-center">
                                        <img class="size-40 object-cover rounded-full mr-15" src="{{ asset('img/avatars/2.png') }}" alt="User avatar"> {{-- Placeholder --}}
                                        <div>
                                            <div class="text-15 lh-12 fw-500 text-dark-1">Jerome Bell</div> {{-- Placeholder --}}
                                            <div class="text-13 lh-1 text-light-1 mt-5">Online</div> {{-- Placeholder Status --}}
                                        </div>
                                    </div>
                                    {{-- <button class="icon-bin text-16 text-light-1"></button> --}}
                                </div>

                                {{-- Chat Messages Area --}}
                                <div class="flex-grow-1 mt-20 message-area-scrollable" style="max-height: 50vh; overflow-y: auto;">
                                    {{-- Received Message Example --}}
                                    <div class="d-flex mb-20">
                                        <div class="shrink-0 mr-15">
                                            <img class="size-40 object-cover rounded-full" src="{{ asset('img/avatars/2.png') }}" alt="User avatar">
                                        </div>
                                        <div class="py-15 px-20 rounded-8 bg-light-2 -dark-bg-dark-2 text-dark-1 -dark-text-white">
                                            Hey, can you help me with my latest assignment? I'm a bit stuck.
                                            <div class="text-12 lh-1 text-light-1 mt-10">10:25 AM</div>
                                        </div>
                                    </div>

                                    {{-- Sent Message Example --}}
                                    <div class="d-flex justify-end mb-20">
                                        <div class="py-15 px-20 rounded-8 bg-purple-1 text-white">
                                            Sure, what part are you having trouble with?
                                            <div class="text-12 lh-1 text-purple-1-light mt-10 text-end">10:26 AM</div>
                                        </div>
                                        <div class="shrink-0 ml-15">
                                            <img class="size-40 object-cover rounded-full" src="{{ asset('img/avatars/1.png') }}" alt="User avatar">
                                        </div>
                                    </div>
                                    {{-- Add more messages here --}}
                                </div>

                                {{-- Reply Box --}}
                                <div class="pt-30 border-top-light -dark-border-dark-2">
                                    <form action="#" class="d-flex items-center">
                                        <textarea class="form-control flex-grow-1 mr-15" rows="1" placeholder="Type your message..."></textarea>
                                        <button class="button -md -purple-1 text-white">Send</button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</x-dashboard-layout> 