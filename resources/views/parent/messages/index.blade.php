<x-dashboard-layout>
    <x-slot name="title">Messages</x-slot>

    <x-slot name="sidebar">
        @include('layouts.partials.parent.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.parent.header')
        <h1 class="text-30 lh-12 fw-700">Messages</h1>
        <div class="breadcrumbs mt-10 pt-0 pb-0">
            <div class="breadcrumbs__content">
                <div class="breadcrumbs__item">
                    <a href="{{ route('home') }}">Home</a>
                </div>
                <div class="breadcrumbs__item">
                    <a href="{{ route('parent.overview') }}">Dashboard</a>
                </div>
                <div class="breadcrumbs__item">
                    <a href="{{ route('parent.messages') }}">Messages</a>
                </div>
            </div>
        </div>
    </x-slot>

    {{-- Adapted content from dshb-messages.html --}}
    <div class="row y-gap-30">
        {{-- Left Column: Conversation List --}}
        <div class="col-xl-4 col-lg-5">
            <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                <div class="d-flex items-center py-20 px-30 border-bottom-light">
                    <h2 class="text-17 lh-1 fw-500">Conversations</h2>
                    {{-- <button class="button -sm -purple-1 text-white ml-auto">New Message</button> --}}
                </div>

                <div class="py-30 px-30 scroll-bar-1" style="max-height: 600px; overflow-y: auto;">
                    <div class="y-gap-30">
                        {{-- Example Conversation Item (Active) --}}
                        <div class="d-flex justify-between items-center cursor-pointer p-10 rounded-8 bg-light-2 -dark-bg-dark-2 {{-- Add active class --}}">
                            <div class="d-flex items-center">
                                <div class="shrink-0">
                                    <img src="{{ asset('img/avatars/small/1.png') }}" alt="image" class="size-50 rounded-full">
                                </div>
                                <div class="ml-10">
                                    <div class="lh-11 fw-500 text-dark-1">Teacher Name / Admin</div>
                                    <div class="text-14 lh-11 mt-5 text-light-1">Regarding [Child's Name]'s progress...</div>
                                </div>
                            </div>
                            <div class="d-flex items-end flex-column pt-8">
                                <div class="text-13 lh-1">10 mins ago</div>
                                <div class="d-flex justify-center items-center size-20 bg-purple-1 rounded-full mt-8">
                                    <span class="text-11 lh-1 text-white fw-500">1</span> {{-- Unread count --}}
                                </div>
                            </div>
                        </div>

                        {{-- Example Conversation Item (Inactive) --}}
                        <div class="d-flex justify-between items-center cursor-pointer p-10 rounded-8 -hover-bg-light-2">
                            <div class="d-flex items-center">
                                <div class="shrink-0">
                                    <img src="{{ asset('img/avatars/small/3.png') }}" alt="image" class="size-50 rounded-full">
                                </div>
                                <div class="ml-10">
                                    <div class="lh-11 fw-500 text-dark-1">Support Team</div>
                                    <div class="text-14 lh-11 mt-5 text-light-1">We have resolved your query.</div>
                                </div>
                            </div>
                            <div class="d-flex items-end flex-column pt-8">
                                <div class="text-13 lh-1">2 days ago</div>
                            </div>
                        </div>
                        {{-- End Example Conversation Item --}}
                         <div class="col-12 text-center pt-20">
                             <p>No active conversations.</p> {{-- Show if no conversations --}}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {{-- Right Column: Chat Area --}}
        <div class="col-xl-8 col-lg-7">
            <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                {{-- Placeholder: Show if no conversation is selected --}}
                {{-- <div class="d-flex flex-column justify-center items-center h-100"> --}}
                {{-- <i class="icon-message text-60 text-light-4"></i> --}}
                {{-- <h3 class="mt-20 text-20 lh-12 fw-500">Select a conversation to start messaging.</h3> --}}
                {{-- </div> --}}

                {{-- Actual Chat Area (Show if a conversation is selected) --}}
                <div {{-- v-if="selectedConversation" --}}>
                    <div class="d-flex items-center justify-between py-20 px-30 border-bottom-light">
                        <div class="d-flex items-center">
                            <div class="shrink-0">
                                <img src="{{ asset('img/avatars/small/1.png') }}" alt="image" class="size-50 rounded-full">
                            </div>
                            <div class="ml-10">
                                <div class="lh-11 fw-500 text-dark-1">Teacher Name / Admin</div>
                                <div class="text-14 lh-11 mt-5 text-green-5">Online</div>
                            </div>
                        </div>
                        {{-- <a href="#" class="text-14 lh-11 fw-500 text-red-1 underline">Delete Conversation</a> --}}
                    </div>

                    <div class="py-40 px-40 scroll-bar-1" style="max-height: 450px; overflow-y: auto;">
                        <div class="row y-gap-20">
                            {{-- Example Received Message --}}
                            <div class="col-xl-7 col-lg-10">
                                <div class="d-flex items-center">
                                    <div class="shrink-0">
                                        <img src="{{ asset('img/avatars/small/1.png') }}" alt="image" class="size-50 rounded-full">
                                    </div>
                                    <div class="lh-11 fw-500 text-dark-1 ml-10">Teacher Name / Admin</div>
                                    <div class="text-14 lh-11 ml-10">10 mins ago</div>
                                </div>
                                <div class="d-inline-block mt-15">
                                    <div class="py-20 px-30 bg-light-3 -dark-bg-dark-2 rounded-8">
                                        Regarding [Child's Name]'s progress, they are doing well in Math but could use some extra practice in Reading Comprehension.
                                    </div>
                                </div>
                            </div>

                            {{-- Example Sent Message --}}
                            <div class="col-xl-7 offset-xl-5 col-lg-10 offset-lg-2">
                                <div class="d-flex items-center justify-end">
                                    <div class="text-14 lh-11 mr-10">8 mins ago</div>
                                    <div class="lh-11 fw-500 text-dark-1 mr-10">You</div>
                                    <div class="shrink-0">
                                        <img src="{{ asset('img/avatars/small/default.png') }}" alt="image" class="size-50 rounded-full">
                                    </div>
                                </div>
                                <div class="text-right mt-15">
                                    <div class="d-inline-block">
                                        <div class="py-20 px-30 bg-purple-1 text-white rounded-8">
                                           Thank you for the update! We will work on that.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="py-25 px-40 border-top-light">
                        <form action="#" method="POST" class="row y-gap-10 justify-between"> {{-- Update action --}}
                            @csrf
                            <div class="col-lg-10">
                                <input class="-dark-bg-dark-2 py-20 w-1/1" name="message" type="text" placeholder="Type a Message to Teacher Name / Admin">
                            </div>
                            <div class="col-lg-2 col-md-12">
                                <button class="button -md -purple-1 text-white shrink-0 w-1/1">Send</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>

</x-dashboard-layout> 