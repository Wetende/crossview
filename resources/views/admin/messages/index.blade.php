<x-dashboard-layout>
    <x-slot name="title">Admin Messages</x-slot>

    <x-slot name="sidebar">
        @include('layouts.partials.admin.sidebar')
    </x-slot>
    
    <x-slot name="header">
        @include('layouts.partials.admin.header')
    </x-slot>

    <div class="breadcrumbs mt-10 pt-0 pb-0">
        <div class="breadcrumbs__content">
                <div class="breadcrumbs__item">
                    <a href="{{ route('home') }}">Home</a>
                </div>
                <div class="breadcrumbs__item">
                    <a href="{{ route('admin.overview') }}">Dashboard</a>
                </div>
                <div class="breadcrumbs__item">
                    <a href="{{ route('admin.messages.index') }}">Messages</a>
                </div>
            </div>
        </div>
    </x-slot>

    {{-- Adapted content from parent messages index --}}
    <div class="row y-gap-30">
        {{-- Left Column: Conversation List --}}
        <div class="col-xl-4 col-lg-5">
            <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                <div class="d-flex items-center justify-between py-20 px-30 border-bottom-light">
                    <h2 class="text-17 lh-1 fw-500">Conversations</h2>
                    {{-- <button class="button -sm -purple-1 text-white ml-auto">New Message</button> --}} {{-- TODO: Add New Message functionality later --}}
                </div>

                <div class="py-30 px-30 scroll-bar-1" style="max-height: 600px; overflow-y: auto;">
                    <div class="y-gap-30 js-conversations-list">
                        {{-- Placeholder for dynamic conversation list --}}
                        {{-- @forelse ($conversations as $conversation) --}}
                        {{-- Example Conversation Item (Active) --}}
                        {{-- <div class="d-flex justify-between items-center cursor-pointer p-10 rounded-8 bg-light-2 -dark-bg-dark-2 js-conversation-item {{ $loop->first ? 'is-active' : '' }}" data-conversation-id="{{ $conversation->id }}"> --}}
                        <div class="d-flex justify-between items-center cursor-pointer p-10 rounded-8 bg-light-2 -dark-bg-dark-2 is-active" data-conversation-id="1"> {{-- Example Active --}}
                            <div class="d-flex items-center">
                                <div class="shrink-0">
                                    {{-- <img src="{{ $conversation->participant_avatar ?? asset('img/avatars/small/placeholder.png') }}" alt="avatar" class="size-50 rounded-full"> --}}
                                    <img src="{{ asset('img/avatars/small/1.png') }}" alt="avatar" class="size-50 rounded-full">
                                </div>
                                <div class="ml-10">
                                    {{-- <div class="lh-11 fw-500 text-dark-1">{{ $conversation->participant_name ?? 'User Name' }}</div> --}}
                                    <div class="lh-11 fw-500 text-dark-1">Teacher Sarah / Student John</div>
                                    {{-- <div class="text-14 lh-11 mt-5 text-light-1">{{ Str::limit($conversation->latest_message_snippet, 30) }}</div> --}}
                                    <div class="text-14 lh-11 mt-5 text-light-1">Regarding Project Alpha submission...</div>
                                </div>
                            </div>
                            <div class="d-flex items-end flex-column pt-8">
                                {{-- <div class="text-13 lh-1">{{ $conversation->timestamp_human ?? '10 mins ago' }}</div> --}}
                                <div class="text-13 lh-1">10 mins ago</div>
                                {{-- @if ($conversation->unread_count > 0) --}}
                                <div class="d-flex justify-center items-center size-20 bg-purple-1 rounded-full mt-8">
                                    {{-- <span class="text-11 lh-1 text-white fw-500">{{ $conversation->unread_count }}</span> --}}
                                    <span class="text-11 lh-1 text-white fw-500">2</span>
                                </div>
                                {{-- @endif --}}
                            </div>
                        </div>

                        {{-- Example Conversation Item (Inactive) --}}
                        {{-- <div class="d-flex justify-between items-center cursor-pointer p-10 rounded-8 -hover-bg-light-2 js-conversation-item" data-conversation-id="{{ $conversation->id }}"> --}}
                        <div class="d-flex justify-between items-center cursor-pointer p-10 rounded-8 -hover-bg-light-2" data-conversation-id="2"> {{-- Example Inactive --}}
                            <div class="d-flex items-center">
                                <div class="shrink-0">
                                    <img src="{{ asset('img/avatars/small/3.png') }}" alt="avatar" class="size-50 rounded-full">
                                </div>
                                <div class="ml-10">
                                    <div class="lh-11 fw-500 text-dark-1">Support Inquiry #12345</div>
                                    <div class="text-14 lh-11 mt-5 text-light-1">System Update Notification</div>
                                </div>
                            </div>
                            <div class="d-flex items-end flex-column pt-8">
                                <div class="text-13 lh-1">2 days ago</div>
                            </div>
                        </div>
                        {{-- @empty --}}
                        {{-- <div class="col-12 text-center pt-20">
                            <p>No active conversations.</p>
                        </div> --}}
                        {{-- @endforelse --}}
                    </div>
                </div>
            </div>
        </div>

        {{-- Right Column: Chat Area --}}
        <div class="col-xl-8 col-lg-7">
            <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100 js-chat-area">
                {{-- Placeholder: Show if no conversation is selected --}}
                <div class="d-flex flex-column justify-center items-center h-100 js-no-conversation-selected">
                    <i class="icon-message text-60 text-light-4"></i>
                    <h3 class="mt-20 text-20 lh-12 fw-500">Select a conversation to start messaging.</h3>
                </div>

                {{-- Actual Chat Area (Show if a conversation is selected - to be loaded dynamically) --}}
                <div class="d-none js-selected-conversation-area"> {{-- Hidden by default --}}
                    <div class="d-flex items-center justify-between py-20 px-30 border-bottom-light">
                        <div class="d-flex items-center">
                            <div class="shrink-0">
                                <img src="{{ asset('img/avatars/small/1.png') }}" alt="avatar" class="size-50 rounded-full js-chat-participant-avatar">
                            </div>
                            <div class="ml-10">
                                <div class="lh-11 fw-500 text-dark-1 js-chat-participant-name">Participant Name</div>
                                <div class="text-14 lh-11 mt-5 text-green-5 js-chat-participant-status">Online</div>
                            </div>
                        </div>
                        {{-- <a href="#" class="text-14 lh-11 fw-500 text-red-1 underline">Delete Conversation</a> --}} {{-- TODO: Add Delete functionality --}}
                    </div>

                    <div class="py-40 px-40 scroll-bar-1 js-chat-messages-container" style="max-height: 450px; overflow-y: auto;">
                        {{-- Messages will be loaded here dynamically --}}
                        {{-- Example Received Message --}}
                        <div class="col-xl-7 col-lg-10">
                            <div class="d-flex items-center">
                                <div class="shrink-0">
                                    <img src="{{ asset('img/avatars/small/1.png') }}" alt="image" class="size-50 rounded-full">
                                </div>
                                <div class="lh-11 fw-500 text-dark-1 ml-10">Participant Name</div>
                                <div class="text-14 lh-11 ml-10">10 mins ago</div>
                            </div>
                            <div class="d-inline-block mt-15">
                                <div class="py-20 px-30 bg-light-3 -dark-bg-dark-2 rounded-8">
                                    Example received message content.
                                </div>
                            </div>
                        </div>

                        {{-- Example Sent Message --}}
                        <div class="col-xl-7 offset-xl-5 col-lg-10 offset-lg-2 text-right">
                            <div class="d-flex items-center justify-end">
                                <div class="text-14 lh-11 mr-10">8 mins ago</div>
                                <div class="lh-11 fw-500 text-dark-1 mr-10">You (Admin)</div>
                                <div class="shrink-0">
                                    <img src="{{ asset('img/avatars/small/default.png') }}" alt="image" class="size-50 rounded-full">
                                </div>
                            </div>
                            <div class="mt-15 d-inline-block text-left"> {{-- Ensure text-left for content inside for readability --}}
                                <div class="py-20 px-30 bg-purple-1 text-white rounded-8">
                                   Example sent message content.
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="py-25 px-40 border-top-light">
                        {{-- Form action will be set dynamically or handled by JS --}}
                        <form action="{{ route('admin.messages.store') }}" method="POST" class="row y-gap-10 justify-between js-send-message-form">
                            @csrf
                            <input type="hidden" name="conversation_id" value="" class="js-conversation-id-input"> {{-- To be populated by JS --}}
                            <div class="col-lg-10 col-md-9 col-8">
                                <input class="-dark-bg-dark-2 py-20 w-1/1" name="message_content" type="text" placeholder="Type a Message...">
                            </div>
                            <div class="col-lg-2 col-md-3 col-4">
                                <button type="submit" class="button -md -purple-1 text-white shrink-0 w-1/1">Send</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>

    @push('scripts')
    <script>
        document.addEventListener('DOMContentLoaded', function () {
            // Basic JS to handle conversation selection (very simplified)
            const conversationList = document.querySelector('.js-conversations-list');
            const chatArea = document.querySelector('.js-chat-area');
            const noConversationSelected = chatArea.querySelector('.js-no-conversation-selected');
            const selectedConversationArea = chatArea.querySelector('.js-selected-conversation-area');
            const chatParticipantName = chatArea.querySelector('.js-chat-participant-name');
            const chatParticipantAvatar = chatArea.querySelector('.js-chat-participant-avatar');
            const chatMessagesContainer = chatArea.querySelector('.js-chat-messages-container');
            const sendMessageForm = chatArea.querySelector('.js-send-message-form');
            const conversationIdInput = chatArea.querySelector('.js-conversation-id-input');

            if (conversationList) {
                conversationList.addEventListener('click', function (event) {
                    const targetItem = event.target.closest('.js-conversation-item');
                    if (!targetItem) return;

                    // Remove active class from all items
                    conversationList.querySelectorAll('.js-conversation-item').forEach(item => {
                        item.classList.remove('bg-light-2', '-dark-bg-dark-2', 'is-active');
                        item.classList.add('-hover-bg-light-2');
                    });

                    // Add active class to clicked item
                    targetItem.classList.add('bg-light-2', '-dark-bg-dark-2', 'is-active');
                    targetItem.classList.remove('-hover-bg-light-2');

                    const conversationId = targetItem.dataset.conversationId;
                    const participantName = targetItem.querySelector('.lh-11.fw-500.text-dark-1').textContent;
                    const participantAvatarSrc = targetItem.querySelector('img').src;

                    // Update chat area header
                    chatParticipantName.textContent = participantName;
                    chatParticipantAvatar.src = participantAvatarSrc;
                    conversationIdInput.value = conversationId; // Set conversation_id for the send form

                    // Show chat area, hide placeholder
                    noConversationSelected.classList.add('d-none');
                    selectedConversationArea.classList.remove('d-none');

                    // TODO: AJAX call to fetch and render messages for conversationId
                    // For now, just clearing and showing example
                    chatMessagesContainer.innerHTML = `
                        <div class="col-12 text-center py-50">
                            <p>Loading messages for ${participantName}...</p>
                            <p class="text-12 text-light-1">(AJAX call to load messages for ID: ${conversationId} would go here)</p>
                        </div>
                    `;
                    console.log(`Selected conversation ID: ${conversationId}`);
                });
            }

            // Placeholder for form submission (would ideally be AJAX)
            if (sendMessageForm) {
                sendMessageForm.addEventListener('submit', function(e) {
                    // e.preventDefault(); // Prevent default if using AJAX
                    // const formData = new FormData(this);
                    // console.log('Sending message:', Object.fromEntries(formData.entries()));
                    // TODO: Implement AJAX message sending
                    // After sending, clear input and refresh messages
                });
            }
        });
    </script>
    @endpush

</x-dashboard-layout>
