{{-- Text Lesson Specific Fields --}}
{{-- $lesson is passed --}}

<div class="card mt-4 mb-4 -dark-bg-light-2">
    <div class="card-header bg-light-4">
        <h6 class="mb-0 text-dark-1">Text Lesson Content</h6>
    </div>
    <div class="card-body">
        <div class="mb-3">
            <label for="lessonShortDescriptionText" class="form-label text-dark-1">Short Description (Optional Summary)</label>
            <textarea class="form-control" id="lessonShortDescriptionText" name="short_description" rows="3" maxlength="500">{{ old('short_description', $lesson->short_description) }}</textarea>
            <small class="text-muted">Brief summary shown in the course outline (max 500 characters).</small>
            @error('short_description') <div class="text-danger mt-1 text-13">{{ $message }}</div> @enderror
        </div>

        <div class="mb-3">
            <label for="lessonContentText" class="form-label text-dark-1">Main Content <span class="text-red-1">*</span></label>
            <textarea class="form-control rich-text-editor" id="lessonContentText" name="content" rows="12">{{ old('content', $lesson->content) }}</textarea>
            <small class="text-muted">Use the editor tools to format text, add images, links, tables, and more.</small>
            @error('content') <div class="text-danger mt-1 text-13">{{ $message }}</div> @enderror
        </div>
    </div>
</div>

{{-- Attachments section will be added in Phase 2 --}} 