<style>
.faq-item {
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    background-color: white;
}
.faq-header {
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    cursor: move;
}
.faq-body {
    padding: 1rem;
}
.drag-handle {
    cursor: move;
    padding: 0.25rem 0.5rem;
    margin-right: 0.5rem;
    color: #6b7280;
}
.faq-actions {
    margin-left: auto;
}
</style>

<div id="faqTab" class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
    <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
        <h2 class="text-17 fw-500">Frequently Asked Questions</h2>
        <button type="button" class="button -md -purple-1 text-white" data-bs-toggle="modal" data-bs-target="#addFaqModal">
            Add New FAQ
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

        <div class="mb-10">
            <p class="text-14 lh-1 text-light-1">
                Add frequently asked questions to help students understand what your course offers. 
                Good FAQs can help increase enrollment by addressing common concerns.
            </p>
        </div>

        <div id="faqList">
            @if($faqs->count() > 0)
                @foreach($faqs as $faq)
                    <div class="faq-item" id="faq-{{ $faq->id }}" data-id="{{ $faq->id }}">
                        <div class="faq-header bg-light-3">
                            <div class="drag-handle">
                                <i class="icon-menu text-16"></i>
                            </div>
                            <h3 class="text-16 fw-500">{{ $faq->question }}</h3>
                            <div class="faq-actions">
                                <button class="button -sm -light-7 text-purple-1 mr-10" 
                                    data-bs-toggle="modal" 
                                    data-bs-target="#editFaqModal-{{ $faq->id }}">
                                    <i class="icon-edit text-16 mr-5"></i>
                                    Edit
                                </button>
                                
                                <form action="{{ route('teacher.faq.destroy', $faq) }}" method="POST" class="d-inline-block" 
                                      onsubmit="return confirm('Are you sure you want to delete this FAQ?')">
                                    @csrf
                                    @method('DELETE')
                                    <button type="submit" class="button -sm -light-7 text-purple-1">
                                        <i class="icon-trash-2 text-16 mr-5"></i>
                                        Delete
                                    </button>
                                </form>
                            </div>
                        </div>
                        <div class="faq-body">
                            <div class="mb-20">
                                <label class="text-14 lh-1 text-dark-1 fw-500 mb-10">Answer:</label>
                                <div class="faq-answer">
                                    {!! $faq->answer !!}
                                </div>
                            </div>

                            <div class="d-flex items-center">
                                <div class="badge {{ $faq->is_published ? 'bg-green-1' : 'bg-light-3' }}">
                                    {{ $faq->is_published ? 'Published' : 'Hidden' }}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Edit FAQ Modal -->
                    <div class="modal fade" id="editFaqModal-{{ $faq->id }}" tabindex="-1" aria-labelledby="editFaqModalLabel-{{ $faq->id }}" aria-hidden="true">
                        <div class="modal-dialog modal-lg">
                            <div class="modal-content">
                                <form action="{{ route('teacher.faq.update', $faq) }}" method="POST">
                                    @csrf
                                    @method('PUT')
                                    
                                    <div class="modal-header">
                                        <h5 class="modal-title" id="editFaqModalLabel-{{ $faq->id }}">Edit FAQ</h5>
                                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                    </div>
                                    
                                    <div class="modal-body">
                                        <div class="row y-gap-20">
                                            <div class="col-12">
                                                <label class="form-label">Question</label>
                                                <input type="text" name="question" class="form-control" value="{{ $faq->question }}" required>
                                                @error('question')
                                                    <div class="text-danger mt-1">{{ $message }}</div>
                                                @enderror
                                            </div>
                                            
                                            <div class="col-12">
                                                <label class="form-label">Answer</label>
                                                <textarea name="answer" class="form-control js-tinymce">{{ $faq->answer }}</textarea>
                                                @error('answer')
                                                    <div class="text-danger mt-1">{{ $message }}</div>
                                                @enderror
                                            </div>
                                            
                                            <div class="col-12">
                                                <div class="form-check">
                                                    <input class="form-check-input" type="checkbox" id="is_published-{{ $faq->id }}" name="is_published" {{ $faq->is_published ? 'checked' : '' }}>
                                                    <label class="form-check-label" for="is_published-{{ $faq->id }}">
                                                        Published
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="modal-footer">
                                        <button type="button" class="button -md -outline-purple-1 text-purple-1" data-bs-dismiss="modal">Cancel</button>
                                        <button type="submit" class="button -md -purple-1 text-white">Update FAQ</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                @endforeach
            @else
                <div class="text-center py-50">
                    <div class="icon-help-circle text-60 text-light-1 mb-10"></div>
                    <h4 class="text-18 fw-500">No FAQs added yet</h4>
                    <p class="mt-10">Add frequently asked questions to help your students understand what your course offers</p>
                </div>
            @endif
        </div>
    </div>
</div>

<!-- Add FAQ Modal -->
<div class="modal fade" id="addFaqModal" tabindex="-1" aria-labelledby="addFaqModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <form action="{{ route('teacher.faq.store') }}" method="POST">
                @csrf
                <input type="hidden" name="course_id" value="{{ $course->id }}">
                
                <div class="modal-header">
                    <h5 class="modal-title" id="addFaqModalLabel">Add New FAQ</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                
                <div class="modal-body">
                    <div class="row y-gap-20">
                        <div class="col-12">
                            <label class="form-label">Question</label>
                            <input type="text" name="question" class="form-control" required>
                            @error('question')
                                <div class="text-danger mt-1">{{ $message }}</div>
                            @enderror
                        </div>
                        
                        <div class="col-12">
                            <label class="form-label">Answer</label>
                            <textarea name="answer" class="form-control js-tinymce"></textarea>
                            @error('answer')
                                <div class="text-danger mt-1">{{ $message }}</div>
                            @enderror
                        </div>
                        
                        <div class="col-12">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="is_published" name="is_published" checked>
                                <label class="form-check-label" for="is_published">
                                    Published
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="button -md -outline-purple-1 text-purple-1" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="button -md -purple-1 text-white">Add FAQ</button>
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
        
        // Initialize draggable for FAQ reordering
        if (typeof Sortable !== 'undefined') {
            Sortable.create(document.getElementById('faqList'), {
                handle: '.drag-handle',
                animation: 150,
                onEnd: function(evt) {
                    const itemId = evt.item.getAttribute('data-id');
                    const newPosition = evt.newIndex;
                    
                    // Send AJAX request to update order
                    fetch('{{ route("teacher.faq.reorder") }}', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                        },
                        body: JSON.stringify({
                            id: itemId,
                            position: newPosition
                        })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            
                        }
                    })
                    .catch(error => {
                        
                    });
                }
            });
        }
    });
</script> 