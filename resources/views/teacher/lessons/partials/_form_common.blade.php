{{-- Common Lesson Fields --}}
{{-- Passed variables: $course, $section, $lesson (new or existing), $lessonType --}}

{{-- Hidden field for lesson type --}}
<input type="hidden" name="lesson_type" value="{{ $lessonType }}">

<div class="row">
    <div class="col-md-8">
        <div class="mb-3">
            <label for="lessonTitle" class="form-label text-dark-1">Lesson Title <span class="text-red-1">*</span></label>
            <input type="text" class="form-control" id="lessonTitle" name="title" required value="{{ old('title', $lesson->title) }}">
            @error('title') <div class="text-danger mt-1 text-13">{{ $message }}</div> @enderror
        </div>
    </div>
    <div class="col-md-4">
        <div class="mb-3">
            <label for="lessonDuration" class="form-label text-dark-1">Lesson Duration</label>
            <input type="text" class="form-control" id="lessonDuration" name="lesson_duration" value="{{ old('lesson_duration', $lesson->lesson_duration) }}" placeholder="e.g., 10 min, 1 hour">
            @error('lesson_duration') <div class="text-danger mt-1 text-13">{{ $message }}</div> @enderror
        </div>
    </div>
</div>

{{-- Dynamic inclusion of type-specific fields --}}
@includeFirst([
    'teacher.lessons.partials._form_' . $lessonType,
    'teacher.lessons.partials._form_default' {{-- Fallback if a specific form doesn't exist --}}
], ['lesson' => $lesson, 'course' => $course, 'section' => $section, 'availableQuizzes' => $availableQuizzes ?? [], 'availableAssignments' => $availableAssignments ?? []])

<hr class="my-4">

<h6 class="fw-500 text-dark-1 mb-3">Settings</h6>
<div class="row">
    <div class="col-md-4 mb-3">
        <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" role="switch" id="isPreviewAllowed" name="is_preview_allowed" value="1" {{ old('is_preview_allowed', $lesson->is_preview_allowed) ? 'checked' : '' }}>
            <label class="form-check-label text-dark-1" for="isPreviewAllowed">Allow Preview (Free Access)</label>
            @error('is_preview_allowed') <div class="text-danger mt-1 text-13">{{ $message }}</div> @enderror
        </div>
    </div>
</div>

<div class="row">
    <div class="col-md-4 mb-3">
        <label for="lessonUnlockDate" class="form-label text-dark-1">Unlock Date (Absolute)</label>
        <input type="datetime-local" class="form-control" id="lessonUnlockDate" name="unlock_date" value="{{ old('unlock_date', $lesson->unlock_date ? $lesson->unlock_date->format('Y-m-d\TH:i') : '') }}">
        <small class="text-muted text-12 d-block mt-1">Overrides relative drip if set and later.</small>
        @error('unlock_date') <div class="text-danger mt-1 text-13">{{ $message }}</div> @enderror
    </div>
    <div class="col-md-4 mb-3">
        <label for="lessonUnlockAfterPurchaseDays" class="form-label text-dark-1">Unlock After Purchase (Relative Days)</label>
        <input type="number" class="form-control" id="lessonUnlockAfterPurchaseDays" name="unlock_after_purchase_days" min="0" value="{{ old('unlock_after_purchase_days', $lesson->unlock_after_purchase_days) }}">
        <small class="text-muted text-12 d-block mt-1">Days after direct course purchase. Ignored if course accessed via subscription.</small>
        @error('unlock_after_purchase_days') <div class="text-danger mt-1 text-13">{{ $message }}</div> @enderror
    </div>
    <div class="col-md-4 mb-3">
        <label for="lessonStartDatetime" class="form-label text-dark-1">Lesson Start Date/Time (Absolute)</label>
        <input type="datetime-local" class="form-control" id="lessonStartDatetime" name="lesson_start_datetime" value="{{ old('lesson_start_datetime', $lesson->lesson_start_datetime ? $lesson->lesson_start_datetime->format('Y-m-d\TH:i') : '') }}">
        <small class="text-muted text-12 d-block mt-1">Overrides drip if later. Both conditions must be met.</small>
        @error('lesson_start_datetime') <div class="text-danger mt-1 text-13">{{ $message }}</div> @enderror
    </div>
</div> 