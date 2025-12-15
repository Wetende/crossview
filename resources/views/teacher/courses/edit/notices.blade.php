<style>
.notice-card {
    border-left: 4px solid #3b82f6;
    margin-bottom: 1rem;
}
.notice-card.info { border-left-color: #3b82f6; }
.notice-card.warning { border-left-color: #f59e0b; }
.notice-card.danger { border-left-color: #ef4444; }
.notice-card.success { border-left-color: #10b981; }
</style>

<div id="noticesTab" class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
    <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
        <h2 class="text-17 fw-500">@lmsterm('Study Material') Notices</h2>
        <button type="button" class="button -md -purple-1 text-white" data-bs-toggle="modal" data-bs-target="#addNoticeModal">
            Add New Notice
        </button>
    </div>

    <div class="py-30 px-30">
        @if(session('success'))
            <div class="alert alert-success">
                {{ session('success') }}
            </div>
        @endif

        @if(session('error'))
            <div class="alert alert-danger">
                {{ session('error') }}
            </div>
        @endif

        <div class="notice-list">
            @if($notices->count() > 0)
                @foreach($notices as $notice)
                    <div class="notice-card {{ $notice->type }}" id="notice-{{ $notice->id }}">
                        <div class="row px-30 py-20">
                            <div class="col-md-10">
                                <div class="d-flex items-center">
                                    @if($notice->type === 'info')
                                        <div class="icon-info-circle text-blue-1 text-20 mr-10"></div>
                                    @elseif($notice->type === 'warning')
                                        <div class="icon-warning text-yellow-1 text-20 mr-10"></div>
                                    @elseif($notice->type === 'danger')
                                        <div class="icon-alert-triangle text-red-1 text-20 mr-10"></div>
                                    @elseif($notice->type === 'success')
                                        <div class="icon-check-circle text-green-1 text-20 mr-10"></div>
                                    @endif
                                    <h3 class="text-18 fw-500">{{ $notice->title }}</h3>
                                </div>
                                
                                <div class="notice-content mt-10">
                                    {!! $notice->content !!}
                                </div>
                                
                                <div class="mt-10 d-flex items-center">
                                    <div class="text-14 lh-1 text-light-1">
                                        @if($notice->display_from || $notice->display_until)
                                            Display: 
                                            {{ $notice->display_from ? $notice->display_from->format('M d, Y') : 'Always' }}
                                            -
                                            {{ $notice->display_until ? $notice->display_until->format('M d, Y') : 'Forever' }}
                                        @endif
                                    </div>
                                    
                                    <div class="d-flex items-center ml-30">
                                        <div class="badge {{ $notice->is_active ? 'bg-green-1' : 'bg-light-3' }}">
                                            {{ $notice->is_active ? 'Active' : 'Inactive' }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="col-md-2 d-flex items-center justify-end">
                                <div class="d-flex items-center">
                                    <button class="button -sm -light-7 text-purple-1 mr-10" 
                                        data-bs-toggle="modal" 
                                        data-bs-target="#editNoticeModal-{{ $notice->id }}">
                                        <i class="icon-edit text-16 mr-5"></i>
                                        Edit
                                    </button>
                                    
                                    <form action="{{ route('teacher.notices.destroy', $notice) }}" method="POST" onsubmit="return confirm('Are you sure you want to delete this notice?')">
                                        @csrf
                                        @method('DELETE')
                                        <button type="submit" class="button -sm -light-7 text-purple-1">
                                            <i class="icon-trash-2 text-16 mr-5"></i>
                                            Delete
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Edit Notice Modal -->
                    <div class="modal fade" id="editNoticeModal-{{ $notice->id }}" tabindex="-1" aria-labelledby="editNoticeModalLabel-{{ $notice->id }}" aria-hidden="true">
                        <div class="modal-dialog modal-lg">
                            <div class="modal-content">
                                <form action="{{ route('teacher.notices.update', $notice) }}" method="POST">
                                    @csrf
                                    @method('PUT')
                                    
                                    <div class="modal-header">
                                        <h5 class="modal-title" id="editNoticeModalLabel-{{ $notice->id }}">Edit Notice</h5>
                                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                    </div>
                                    
                                    <div class="modal-body">
                                        <div class="row y-gap-20">
                                            <div class="col-12">
                                                <label class="form-label">Notice Title</label>
                                                <input type="text" name="title" class="form-control" value="{{ $notice->title }}" required>
                                                @error('title')
                                                    <div class="text-danger mt-1">{{ $message }}</div>
                                                @enderror
                                            </div>
                                            
                                            <div class="col-12">
                                                <label class="form-label">Notice Type</label>
                                                <select name="type" class="form-control">
                                                    <option value="info" {{ $notice->type === 'info' ? 'selected' : '' }}>Information</option>
                                                    <option value="warning" {{ $notice->type === 'warning' ? 'selected' : '' }}>Warning</option>
                                                    <option value="danger" {{ $notice->type === 'danger' ? 'selected' : '' }}>Alert</option>
                                                    <option value="success" {{ $notice->type === 'success' ? 'selected' : '' }}>Success</option>
                                                </select>
                                                @error('type')
                                                    <div class="text-danger mt-1">{{ $message }}</div>
                                                @enderror
                                            </div>
                                            
                                            <div class="col-12">
                                                <label class="form-label">Notice Content</label>
                                                <textarea name="content" class="form-control js-tinymce">{{ $notice->content }}</textarea>
                                                @error('content')
                                                    <div class="text-danger mt-1">{{ $message }}</div>
                                                @enderror
                                            </div>
                                            
                                            <div class="col-md-6">
                                                <label class="form-label">Display From (Optional)</label>
                                                <input type="date" name="display_from" class="form-control" value="{{ $notice->display_from ? $notice->display_from->format('Y-m-d') : '' }}">
                                                @error('display_from')
                                                    <div class="text-danger mt-1">{{ $message }}</div>
                                                @enderror
                                            </div>
                                            
                                            <div class="col-md-6">
                                                <label class="form-label">Display Until (Optional)</label>
                                                <input type="date" name="display_until" class="form-control" value="{{ $notice->display_until ? $notice->display_until->format('Y-m-d') : '' }}">
                                                @error('display_until')
                                                    <div class="text-danger mt-1">{{ $message }}</div>
                                                @enderror
                                            </div>
                                            
                                            <div class="col-12">
                                                <div class="form-check">
                                                    <input class="form-check-input" type="checkbox" id="is_active-{{ $notice->id }}" name="is_active" {{ $notice->is_active ? 'checked' : '' }}>
                                                    <label class="form-check-label" for="is_active-{{ $notice->id }}">
                                                        Active
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="modal-footer">
                                        <button type="button" class="button -md -outline-purple-1 text-purple-1" data-bs-dismiss="modal">Cancel</button>
                                        <button type="submit" class="button -md -purple-1 text-white">Update Notice</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                @endforeach
            @else
                <div class="text-center py-50">
                    <div class="icon-bell text-60 text-light-1 mb-10"></div>
                    <h4 class="text-18 fw-500">No notices added yet</h4>
                    <p class="mt-10">Add notices to communicate important information to your students</p>
                </div>
            @endif
        </div>
    </div>
</div>

<!-- Add Notice Modal -->
<div class="modal fade" id="addNoticeModal" tabindex="-1" aria-labelledby="addNoticeModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <form action="{{ route('teacher.notices.store') }}" method="POST">
                @csrf
                <input type="hidden" name="course_id" value="{{ $course->id }}">
                
                <div class="modal-header">
                    <h5 class="modal-title" id="addNoticeModalLabel">Add New Notice</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                
                <div class="modal-body">
                    <div class="row y-gap-20">
                        <div class="col-12">
                            <label class="form-label">Notice Title</label>
                            <input type="text" name="title" class="form-control" required>
                            @error('title')
                                <div class="text-danger mt-1">{{ $message }}</div>
                            @enderror
                        </div>
                        
                        <div class="col-12">
                            <label class="form-label">Notice Type</label>
                            <select name="type" class="form-control">
                                <option value="info">Information</option>
                                <option value="warning">Warning</option>
                                <option value="danger">Alert</option>
                                <option value="success">Success</option>
                            </select>
                            @error('type')
                                <div class="text-danger mt-1">{{ $message }}</div>
                            @enderror
                        </div>
                        
                        <div class="col-12">
                            <label class="form-label">Notice Content</label>
                            <textarea name="content" class="form-control js-tinymce"></textarea>
                            @error('content')
                                <div class="text-danger mt-1">{{ $message }}</div>
                            @enderror
                        </div>
                        
                        <div class="col-md-6">
                            <label class="form-label">Display From (Optional)</label>
                            <input type="date" name="display_from" class="form-control">
                            @error('display_from')
                                <div class="text-danger mt-1">{{ $message }}</div>
                            @enderror
                        </div>
                        
                        <div class="col-md-6">
                            <label class="form-label">Display Until (Optional)</label>
                            <input type="date" name="display_until" class="form-control">
                            @error('display_until')
                                <div class="text-danger mt-1">{{ $message }}</div>
                            @enderror
                        </div>
                        
                        <div class="col-12">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="is_active" name="is_active" checked>
                                <label class="form-check-label" for="is_active">
                                    Active
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="button -md -outline-purple-1 text-purple-1" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="button -md -purple-1 text-white">Add Notice</button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
    document.addEventListener('DOMContentLoaded', function() {
        // Initialize TinyMCE
        if (typeof tinymce !== 'undefined') {
            tinymce.init({
                selector: '.js-tinymce',
                height: 300,
                menubar: false,
                plugins: [
                    'advlist autolink lists link image charmap print preview anchor',
                    'searchreplace visualblocks code fullscreen',
                    'insertdatetime media table paste code help wordcount'
                ],
                toolbar: 'undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help',
                content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif; font-size: 14px; }'
            });
        }
    });
</script> 