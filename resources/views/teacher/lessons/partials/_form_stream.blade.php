{{-- Stream Lesson Specific Fields --}}
{{-- $lesson is passed --}}

@props(['lesson', 'lessonType', 'course', 'section', 'errors'])

<div class="card mt-4 mb-4 -dark-bg-light-2">
    <div class="card-header bg-light-4">
        <h6 class="mb-0 text-dark-1">Live Stream Details</h6>
    </div>
    <div class="card-body">
        <div class="row">
            <div class="col-md-8">
                <div class="mb-3">
                    <label for="streamUrl" class="form-label text-dark-1">Stream URL <span class="text-red-1">*</span></label>
                    <input type="url" class="form-control" id="streamUrl" name="stream_url" placeholder="e.g., https://zoom.us/j/123456789" value="{{ old('stream_url', $lesson->stream_url) }}">
                    <small class="text-muted">The URL for your Zoom, Google Meet, or other live streaming platform.</small>
                    @error('stream_url') <div class="text-danger mt-1 text-13">{{ $message }}</div> @enderror
                </div>
            </div>
            <div class="col-md-4">
                <div class="mb-3">
                    <label for="streamPassword" class="form-label text-dark-1">Stream Password (Optional)</label>
                    <input type="text" class="form-control" id="streamPassword" name="stream_password" value="{{ old('stream_password', $lesson->stream_password) }}">
                    <small class="text-muted">Password required to join the stream, if any.</small>
                    @error('stream_password') <div class="text-danger mt-1 text-13">{{ $message }}</div> @enderror
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col-md-4">
                <div class="mb-3">
                    <label for="streamStartTime" class="form-label text-dark-1">Stream Start Time <span class="text-red-1">*</span></label>
                    <input type="datetime-local" class="form-control" id="streamStartTime" name="stream_start_time" value="{{ old('stream_start_time', $lesson->stream_start_time ? $lesson->stream_start_time->format('Y-m-d\TH:i') : '') }}">
                    <small class="text-muted">When the live stream will begin.</small>
                    @error('stream_start_time') <div class="text-danger mt-1 text-13">{{ $message }}</div> @enderror
                </div>
            </div>
            <div class="col-md-4">
                <div class="mb-3">
                    <label for="lessonDuration" class="form-label text-dark-1">Expected Duration <span class="text-red-1">*</span></label>
                    <input type="number" class="form-control" id="lessonDuration" name="lesson_duration" min="5" placeholder="Duration in minutes" value="{{ old('lesson_duration', $lesson->lesson_duration) }}">
                    <small class="text-muted">Estimated length of the stream in minutes.</small>
                    @error('lesson_duration') <div class="text-danger mt-1 text-13">{{ $message }}</div> @enderror
                </div>
            </div>
        </div>

        <div class="mb-3">
            <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" role="switch" id="isRecorded" name="is_recorded" value="1" {{ old('is_recorded', $lesson->is_recorded) ? 'checked' : '' }} onchange="toggleRecordingField()">
                <label class="form-check-label text-dark-1" for="isRecorded">Stream will be recorded</label>
            </div>
            <small class="text-muted">Check if you'll be providing a recording of the stream later.</small>
            @error('is_recorded') <div class="text-danger mt-1 text-13">{{ $message }}</div> @enderror
        </div>

        <div class="mb-3 {{ old('is_recorded', $lesson->is_recorded) ? '' : 'd-none' }}" id="recordingUrlField">
            <label for="recordingUrl" class="form-label text-dark-1">Recording URL</label>
            <input type="url" class="form-control" id="recordingUrl" name="recording_url" placeholder="URL to the recorded session" value="{{ old('recording_url', $lesson->recording_url) }}">
            <small class="text-muted">You can add this later after the stream is completed.</small>
            @error('recording_url') <div class="text-danger mt-1 text-13">{{ $message }}</div> @enderror
        </div>

        <div class="mb-3">
            <label for="streamDetails" class="form-label text-dark-1">Stream Details</label>
            <textarea class="form-control rich-text-editor" id="streamDetails" name="stream_details" rows="8">{{ old('stream_details', $lesson->stream_details) }}</textarea>
            <small class="text-muted">Explain what students should expect and how to prepare for this live session.</small>
            @error('stream_details') <div class="text-danger mt-1 text-13">{{ $message }}</div> @enderror
        </div>

        <div class="mb-3">
            <label for="shortDescription" class="form-label text-dark-1">Short Description</label>
            <textarea class="form-control" id="shortDescription" name="short_description" rows="3" maxlength="500">{{ old('short_description', $lesson->short_description) }}</textarea>
            <small class="text-muted">Brief summary shown in the course outline (max 500 characters).</small>
            @error('short_description') <div class="text-danger mt-1 text-13">{{ $message }}</div> @enderror
        </div>
    </div>
</div>

@push('scripts')
<script>
    function toggleRecordingField() {
        const isRecorded = document.getElementById('isRecorded').checked;
        const recordingUrlField = document.getElementById('recordingUrlField');
        
        if (isRecorded) {
            recordingUrlField.classList.remove('d-none');
        } else {
            recordingUrlField.classList.add('d-none');
        }
    }
    
    document.addEventListener('DOMContentLoaded', function() {
        // Initialize on page load
        toggleRecordingField();
    });
</script>
@endpush 