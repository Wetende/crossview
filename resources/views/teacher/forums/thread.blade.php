<x-dashboard-layout>
    {{-- Assuming $thread is passed from the controller, and $thread->course exists if it's a course thread --}}
    @php
        $threadTitle = $thread->title ?? 'View Thread';
        $threadId = $thread->id ?? 0;
        $course = $thread->course ?? null; // Assuming a relationship
        $courseName = $course ? $course->title : 'General Forum';
        $courseId = $course ? $course->id : null;

        // Placeholder posts data
        $posts = $thread->posts ?? collect([
            ['id' => 1, 'user_name' => 'John Student', 'user_avatar' => asset('assets/img/avatars/placeholder.png'), 'user_join_date' => 'Jan 2023', 'user_post_count' => 25, 'created_at_formatted' => '2 hours ago', 'content' => '<p>This is the first post in the thread. Looking forward to discussions!</p>', 'can_edit' => false, 'can_delete' => false],
            ['id' => 2, 'user_name' => 'Teacher Bob', 'user_avatar' => asset('assets/img/avatars/placeholder-teacher.png'), 'user_join_date' => 'Mar 2022', 'user_post_count' => 150, 'created_at_formatted' => '1 hour ago', 'content' => '<p>Welcome, John! Great to have you start this discussion.</p><p>Teachers can edit or delete any post.</p>', 'can_edit' => true, 'can_delete' => true],
            ['id' => 3, 'user_name' => 'Jane Student', 'user_avatar' => asset('assets/img/avatars/placeholder-female.png'), 'user_join_date' => 'Feb 2023', 'user_post_count' => 10, 'created_at_formatted' => '30 minutes ago', 'content' => '<p>Thanks for the info, Teacher Bob!</p>', 'can_edit' => false, 'can_delete' => false],
        ]);
        // This logic should ideally be in the controller or service layer
        foreach ($posts as $idx => $postItem) {
            if (is_array($postItem)) { // If it's still an array
                $posts[$idx]['can_edit_by_teacher'] = true; // Teacher can edit any post
                $posts[$idx]['can_delete_by_teacher'] = true; // Teacher can delete any post
            }
        }
    @endphp
    <x-slot name="title">{{ $threadTitle }}</x-slot>

    <x-slot name="sidebar">
        @include('layouts.partials.teacher.sidebar')
    </x-slot>

    <x-slot name="header">
        <h1 class="text-30 lh-12 fw-700">{{ $threadTitle }}</h1>
        <div class="breadcrumbs mt-10 pt-0 pb-0">
            <div class="breadcrumbs__content">
                <div class="breadcrumbs__item">
                    <a href="{{ route('home') }}">Home</a>
                </div>
                <div class="breadcrumbs__item">
                    <a href="{{ route('teacher.overview') }}">Dashboard</a>
                </div>
                <div class="breadcrumbs__item">
                    <a href="{{ route('teacher.forums.index') }}">Forum Management</a>
                </div>
                @if($course)
                <div class="breadcrumbs__item">
                    <a href="{{ route('teacher.course.forums.show', ['course' => $courseId]) }}">{{ $courseName }}</a>
                </div>
                @endif
                <div class="breadcrumbs__item">
                    <a href="{{ route('teacher.forums.thread.show', ['thread' => $threadId]) }}" class="text-dark-1">{{ $threadTitle }}</a>
                </div>
            </div>
        </div>
    </x-slot>

    <div class="row y-gap-30">
        <div class="col-12">
            <div class="py-30 px-30 rounded-8 bg-white -dark-bg-dark-1 shadow-4">
                <div class="row justify-between y-gap-20 items-center mb-30">
                    <div class="col-auto">
                        {{-- Pagination for posts --}}
                        {{-- <div class="row x-gap-10 y-gap-10 items-center">
                            <div class="col-auto"><button class="button -sm -outline-purple-1 text-purple-1">Previous</button></div>
                            <div class="col-auto"><div class="pagination__count">Page <span class="fw-500">1</span> of <span class="fw-500">3</span></div></div>
                            <div class="col-auto"><button class="button -sm -outline-purple-1 text-purple-1">Next</button></div>
                        </div> --}}
                    </div>
                    <div class="col-auto d-flex x-gap-15">
                        <a href="{{ route('teacher.forums.thread.edit', ['thread' => $threadId]) }}" class="button -sm -outline-blue-1 text-blue-1">
                            <i class="icon-edit mr-10"></i>Edit Thread
                        </a>
                        {{-- Add Pin/Unpin, Lock/Unlock thread buttons here if logic is implemented --}}
                        {{-- Example:
                        <form action="{{ route('teacher.forums.thread.togglePin', ['thread' => $threadId]) }}" method="POST" style="display:inline;"> @csrf @method('PUT') <button type="submit" class="button -sm -outline-yellow-1 text-yellow-1">{{ $thread->is_pinned ? 'Unpin' : 'Pin' }} Thread</button></form>
                        <form action="{{ route('teacher.forums.thread.toggleLock', ['thread' => $threadId]) }}" method="POST" style="display:inline;"> @csrf @method('PUT') <button type="submit" class="button -sm -outline-orange-1 text-orange-1">{{ $thread->is_locked ? 'Unlock' : 'Lock' }} Thread</button></form>
                        --}}
                    </div>
                </div>

                {{-- Forum Posts Loop --}}
                @forelse ($posts as $post)
                <div class="border-top-light pt-30 {{ !$loop->first ? 'mt-30' : '' }}">
                    <div class="row x-gap-50">
                        <div class="col-md-auto col-auto" style="max-width: 200px;"> {{-- User info column --}}
                            <div class="d-flex flex-column items-center text-center md:items-start md:text-left md:flex-row">
                                <img src="{{ $post['user_avatar'] ?? asset('assets/img/avatars/placeholder.png') }}" alt="avatar" class="size-60 rounded-full">
                                <div class="md:ml-20 mt-10 md:mt-0">
                                    <div class="text-15 lh-15 fw-500 text-dark-1">{{ $post['user_name'] ?? 'User' }}</div>
                                    <div class="text-13 lh-1 mt-5">Joined: {{ $post['user_join_date'] ?? 'N/A' }}</div>
                                    <div class="text-13 lh-1 mt-5">Posts: {{ $post['user_post_count'] ?? 0 }}</div>
                                    {{-- Role badge could go here --}}
                                </div>
                            </div>
                        </div>

                        <div class="col"> {{-- Post content column --}}
                            <div class="d-flex justify-between items-start">
                                <div class="text-14 lh-13 text-light-1">Posted: {{ $post['created_at_formatted'] ?? 'Recently' }}</div>
                                <div class="d-flex x-gap-15">
                                    {{-- Teacher can edit/delete any post --}}
                                    @if($post['can_edit_by_teacher'] ?? false)
                                    {{-- <a href="{{ route('teacher.forums.post.edit', ['post' => $post['id']]) }}" class="text-14 text-blue-1">Edit Post</a> --}}
                                    <a href="#" class="text-14 text-blue-1">Edit Post</a>{{-- Placeholder: Edit post route --}}
                                    @endif
                                    @if($post['can_delete_by_teacher'] ?? false)
                                    <form action="{{-- route('teacher.forums.post.destroy', ['post' => $post['id']]) --}}" method="POST" onsubmit="return confirm('Are you sure you want to delete this post?');" style="display: inline;">
                                        @csrf
                                        @method('DELETE')
                                        <button type="submit" class="button -icon text-14 text-red-1 p-0 border-none bg-transparent hover-underline">Delete Post</button>
                                    </form>
                                    @endif
                                    {{-- <a href="#" class="text-14 text-purple-1">Quote</a> --}}
                                </div>
                            </div>

                            <div class="forum-post-content text-15 text-dark-1 mt-15 pr-30">
                                {!! $post['content'] ?? '<p>No content.</p>' !!} {{-- Use {!! !!} if content contains HTML, ensure it's sanitized --}}
                            </div>
                            
                            {{-- Signature if exists
                            <div class="border-top-light mt-20 pt-15">
                                <div class="text-13 lh-1">Signature: Learning everyday!</div>
                            </div>
                            --}}
                        </div>
                    </div>
                </div>
                @empty
                <div class="text-center py-50">
                    <i class="icon-message-off text-60 text-light-4"></i>
                    <h4 class="text-20 fw-500 mt-15">No posts in this thread yet.</h4>
                </div>
                @endforelse
                {{-- End Forum Posts Loop --}}

                {{-- Pagination for posts --}}
                {{-- <div class="row justify-start y-gap-20 items-center pt-30 mt-20 border-top-light">
                     <div class="col-auto"><button class="button -sm -outline-purple-1 text-purple-1">Previous</button></div>
                     <div class="col-auto"><div class="pagination__count">Page <span class="fw-500">1</span> of <span class="fw-500">3</span></div></div>
                     <div class="col-auto"><button class="button -sm -outline-purple-1 text-purple-1">Next</button></div>
                </div> --}}

                {{-- Reply Form for Teacher --}}
                @if(!($thread->is_locked ?? false))
                <div class="border-top-light pt-30 mt-30">
                    <h4 class="text-17 fw-500 mb-25">Post a Reply</h4>
                    <form action="{{-- route('teacher.forums.thread.reply.store', ['thread' => $threadId]) --}}" method="POST" class="row y-gap-20 contact-form">
                        @csrf
                        <div class="col-12">
                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="reply_content">Your Reply</label>
                            <textarea id="reply_content" name="content" placeholder="Compose your reply..." rows="7" class="form-control" required></textarea>
                            {{-- Rich text editor should be applied here too --}}
                        </div>
                        <div class="col-12 d-flex items-center">
                            <button type="submit" class="button -md -purple-1 text-white">
                                <i class="icon-send mr-10"></i> Submit Reply
                            </button>
                        </div>
                    </form>
                </div>
                @else
                <div class="border-top-light pt-30 mt-30 text-center">
                    <i class="icon-lock text-40 text-orange-1 mb-10"></i>
                    <h4 class="text-17 fw-500">This thread is locked.</h4>
                    <p class="text-14 text-light-1 mt-5">No new replies can be posted.</p>
                </div>
                @endif
                {{-- End Reply Form --}}
            </div>
        </div>
    </div>
    
    @push('scripts')
    {{-- Placeholder for Rich Text Editor for reply --}}
    @endpush
</x-dashboard-layout> 