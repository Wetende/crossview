{{-- Video Lesson Specific Fields --}}
{{-- $lesson is passed --}}

<div class="card mt-4 mb-4 -dark-bg-light-2">
    <div class="card-header bg-light-4">
        <h6 class="mb-0 text-dark-1">Video Lesson Content</h6>
    </div>
    <div class="card-body">
        <div class="row mb-3">
            <div class="col-md-4">
                <label for="videoSource" class="form-label text-dark-1">Video Source <span class="text-red-1">*</span></label>
                <select class="form-select" id="videoSource" name="video_source">
                    <option value="youtube" {{ old('video_source', $lesson->video_source) == 'youtube' ? 'selected' : '' }}>YouTube</option>
                    <option value="vimeo" {{ old('video_source', $lesson->video_source) == 'vimeo' ? 'selected' : '' }}>Vimeo</option>
                    <option value="html5" {{ old('video_source', $lesson->video_source) == 'html5' ? 'selected' : '' }}>HTML5 (Upload)</option>
                    <option value="embed" {{ old('video_source', $lesson->video_source) == 'embed' ? 'selected' : '' }}>Custom Embed Code</option>
                </select>
                <small class="text-muted">Select the source platform for your video.</small>
                @error('video_source') <div class="text-danger mt-1 text-13">{{ $message }}</div> @enderror
            </div>
        </div>

        {{-- YouTube/Vimeo URL field - shown for youtube and vimeo sources --}}
        <div class="mb-3 video-source-field" id="videoUrlField">
            <label for="videoUrl" class="form-label text-dark-1">Video URL <span class="text-red-1">*</span></label>
            <input type="url" class="form-control" id="videoUrl" name="video_url" placeholder="e.g., https://www.youtube.com/watch?v=..." value="{{ old('video_url', $lesson->video_url) }}">
            <small class="text-muted">Enter the full URL of your YouTube or Vimeo video.</small>
            @error('video_url') <div class="text-danger mt-1 text-13">{{ $message }}</div> @enderror
        </div>

        {{-- Upload field - shown for html5 source --}}
        <div class="mb-3 video-source-field d-none" id="videoUploadField">
            <label for="videoUpload" class="form-label text-dark-1">Upload Video <span class="text-red-1">*</span></label>
            <input type="file" class="form-control" id="videoUpload" name="video_upload" accept="video/mp4,video/webm,video/ogg">
            @if($lesson->video_upload_path)
                <p class="mt-1 mb-0">Current video: <a href="{{ $lesson->video_upload_path }}" target="_blank">{{ basename($lesson->video_upload_path) }}</a></p>
            @endif
            <small class="text-muted">Upload MP4, WebM, or OGG video file (max 50MB).</small>
            @error('video_upload') <div class="text-danger mt-1 text-13">{{ $message }}</div> @enderror
        </div>

        {{-- Embed code field - shown for embed source --}}
        <div class="mb-3 video-source-field d-none" id="videoEmbedField">
            <label for="videoEmbedCode" class="form-label text-dark-1">Embed Code <span class="text-red-1">*</span></label>
            <textarea class="form-control" id="videoEmbedCode" name="video_embed_code" rows="5" placeholder="<iframe src='...'></iframe>">{{ old('video_embed_code', $lesson->video_embed_code) }}</textarea>
            <small class="text-muted">Paste the embed code from your video provider.</small>
            @error('video_embed_code') <div class="text-danger mt-1 text-13">{{ $message }}</div> @enderror
        </div>

        <div class="row">
            <div class="col-md-6">
                <div class="mb-3">
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" role="switch" id="enablePIP" name="enable_p_in_p" value="1" {{ old('enable_p_in_p', $lesson->enable_p_in_p) ? 'checked' : '' }}>
                        <label class="form-check-label text-dark-1" for="enablePIP">Enable Picture-in-Picture</label>
                    </div>
                    <small class="text-muted">Allow viewers to watch the video in a floating window.</small>
                    @error('enable_p_in_p') <div class="text-danger mt-1 text-13">{{ $message }}</div> @enderror
                </div>
            </div>
            <div class="col-md-6">
                <div class="mb-3">
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" role="switch" id="enableDownload" name="enable_download" value="1" {{ old('enable_download', $lesson->enable_download) ? 'checked' : '' }}>
                        <label class="form-check-label text-dark-1" for="enableDownload">Enable Download</label>
                    </div>
                    <small class="text-muted">Allow students to download the video (HTML5 only).</small>
                    @error('enable_download') <div class="text-danger mt-1 text-13">{{ $message }}</div> @enderror
                </div>
            </div>
        </div>

        <div class="mb-3">
            <label for="videoShortDescription" class="form-label text-dark-1">Short Description</label>
            <textarea class="form-control" id="videoShortDescription" name="short_description" rows="3" maxlength="500">{{ old('short_description', $lesson->short_description) }}</textarea>
            <small class="text-muted">Brief summary shown in the course outline (max 500 characters).</small>
            @error('short_description') <div class="text-danger mt-1 text-13">{{ $message }}</div> @enderror
        </div>

        <div class="mb-3">
            <label for="videoContent" class="form-label text-dark-1">Additional Content</label>
            <textarea class="form-control rich-text-editor" id="videoContent" name="content" rows="8">{{ old('content', $lesson->content) }}</textarea>
            <small class="text-muted">Additional notes, resources or explanations for the video.</small>
            @error('content') <div class="text-danger mt-1 text-13">{{ $message }}</div> @enderror
        </div>
    </div>
</div>

@push('scripts')
<script>
    document.addEventListener('DOMContentLoaded', function() {
        const videoSource = document.getElementById('videoSource');
        const videoUrlField = document.getElementById('videoUrlField');
        const videoUploadField = document.getElementById('videoUploadField');
        const videoEmbedField = document.getElementById('videoEmbedField');
        
        function toggleVideoFields() {
            const selectedSource = videoSource.value;
            
            // Hide all source-specific fields first
            videoUrlField.classList.add('d-none');
            videoUploadField.classList.add('d-none');
            videoEmbedField.classList.add('d-none');
            
            // Show the appropriate field based on the selected source
            if (selectedSource === 'youtube' || selectedSource === 'vimeo') {
                videoUrlField.classList.remove('d-none');
            } else if (selectedSource === 'html5') {
                videoUploadField.classList.remove('d-none');
            } else if (selectedSource === 'embed') {
                videoEmbedField.classList.remove('d-none');
            }
        }
        
        if (videoSource) {
            videoSource.addEventListener('change', toggleVideoFields);
            // Initialize view based on current selection
            toggleVideoFields();
        }
    });
</script>
@endpush 