{{-- Lesson Attachments Management --}}
{{-- To be included in lesson edit view --}}

<div class="card mt-4 mb-4 -dark-bg-light-2">
    <div class="card-header bg-light-4 d-flex justify-content-between align-items-center">
        <h6 class="mb-0 text-dark-1">Lesson Attachments</h6>
        <button type="button" class="button -sm -dark-1 text-white" id="btnAddAttachment">
            <i class="feather-plus me-1"></i> Add Attachment
        </button>
    </div>
    <div class="card-body">
        <div id="attachmentsContainer">
            @if($lesson->id && $lesson->attachments->count() > 0)
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th width="40px"></th>
                                <th>Title</th>
                                <th>Filename</th>
                                <th>Size</th>
                                <th width="150px">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="attachmentsList">
                            @foreach($lesson->attachments->sortBy('order') as $attachment)
                                <tr data-attachment-id="{{ $attachment->id }}">
                                    <td class="text-center">
                                        <div class="drag-handle cursor-pointer">
                                            <i class="feather-move text-muted"></i>
                                        </div>
                                    </td>
                                    <td>{{ $attachment->title }}</td>
                                    <td>{{ $attachment->file_name }}</td>
                                    <td>{{ formatBytes($attachment->file_size) }}</td>
                                    <td>
                                        <div class="d-flex gap-2">
                                            <a href="{{ Storage::url($attachment->file_path) }}" target="_blank" class="btn btn-sm btn-outline-primary">
                                                <i class="feather-eye"></i>
                                            </a>
                                            <button type="button" class="btn btn-sm btn-outline-danger btn-delete-attachment" data-attachment-id="{{ $attachment->id }}">
                                                <i class="feather-trash-2"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            @else
                <div class="text-center py-4 bg-light-2 rounded">
                    <i class="feather-file-plus fa-2x text-muted mb-2"></i>
                    <p class="text-muted">No attachments added yet. Click "Add Attachment" to upload files.</p>
                </div>
            @endif
        </div>
    </div>
</div>

{{-- File Upload Modal --}}
<div class="modal fade" id="addAttachmentModal" tabindex="-1" aria-labelledby="addAttachmentModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="addAttachmentModalLabel">Add Attachment</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form id="attachmentForm" enctype="multipart/form-data">
                    <div class="mb-3">
                        <label for="attachmentTitle" class="form-label">Title <span class="text-red-1">*</span></label>
                        <input type="text" class="form-control" id="attachmentTitle" name="title" required>
                    </div>
                    <div class="mb-3">
                        <label for="attachmentDescription" class="form-label">Description (Optional)</label>
                        <textarea class="form-control" id="attachmentDescription" name="description" rows="3"></textarea>
                    </div>
                    <div class="mb-3">
                        <label for="attachmentFile" class="form-label">File <span class="text-red-1">*</span></label>
                        <input type="file" class="form-control" id="attachmentFile" name="file" required>
                        <small class="text-muted">Max size: 50MB. Supported formats: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, ZIP, RAR, JPG, PNG, MP3, MP4</small>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="button -dark-1" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="button -blue-1 text-white" id="btnSubmitAttachment">Upload</button>
            </div>
        </div>
    </div>
</div>

@push('scripts')
<script>
    document.addEventListener('DOMContentLoaded', function() {
        // Initialize variables
        const courseId = '{{ $course->id }}';
        const lessonId = '{{ $lesson->id }}';
        
        // Only enable attachment management if the lesson has been saved
        if (!lessonId) {
            document.getElementById('btnAddAttachment').disabled = true;
            document.getElementById('btnAddAttachment').title = 'Save the lesson first to add attachments';
            return;
        }
        
        // Initialize Sortable for drag and drop reordering
        const attachmentsList = document.getElementById('attachmentsList');
        if (attachmentsList) {
            new Sortable(attachmentsList, {
                handle: '.drag-handle',
                animation: 150,
                onEnd: function() {
                    reorderAttachments();
                }
            });
        }
        
        // Handle Add Attachment button click
        document.getElementById('btnAddAttachment').addEventListener('click', function() {
            document.getElementById('attachmentForm').reset();
            const modal = new bootstrap.Modal(document.getElementById('addAttachmentModal'));
            modal.show();
        });
        
        // Handle attachment upload
        document.getElementById('btnSubmitAttachment').addEventListener('click', function() {
            const form = document.getElementById('attachmentForm');
            const formData = new FormData(form);
            
            // Validate form
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            // Disable submit button and show loading
            this.disabled = true;
            this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Uploading...';
            
            // Upload attachment via AJAX
            fetch(`/teacher/courses/${courseId}/lessons/${lessonId}/attachments`, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                }
            })
            .then(response => response.json())
            .then(data => {
                // Hide modal and reload page to show updated attachments
                bootstrap.Modal.getInstance(document.getElementById('addAttachmentModal')).hide();
                window.location.reload();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to upload attachment. Please try again.');
            })
            .finally(() => {
                // Re-enable submit button
                this.disabled = false;
                this.innerHTML = 'Upload';
            });
        });
        
        // Handle Delete Attachment button click
        document.querySelectorAll('.btn-delete-attachment').forEach(button => {
            button.addEventListener('click', function() {
                if (confirm('Are you sure you want to delete this attachment?')) {
                    const attachmentId = this.dataset.attachmentId;
                    
                    fetch(`/teacher/courses/${courseId}/lessons/${lessonId}/attachments/${attachmentId}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                            'Content-Type': 'application/json'
                        }
                    })
                    .then(response => {
                        if (response.ok) {
                            window.location.reload();
                        } else {
                            throw new Error('Failed to delete attachment');
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        alert('Failed to delete attachment. Please try again.');
                    });
                }
            });
        });
        
        // Function to reorder attachments
        function reorderAttachments() {
            const attachmentIds = Array.from(document.querySelectorAll('#attachmentsList tr'))
                .map(row => row.dataset.attachmentId);
            
            fetch(`/teacher/courses/${courseId}/lessons/${lessonId}/attachments/reorder`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ attachments: attachmentIds })
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to reorder attachments. Please try again.');
            });
        }
    });
</script>
@endpush 