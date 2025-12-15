@props(['lesson', 'lessonType', 'course', 'section', 'errors', 'availableAssignments'])

<div class="space-y-4">
    <div>
        <label for="assignment_id_{{ $lessonType }}" class="block text-sm font-medium text-gray-700">Select Assignment</label>
        <select name="assignment_id" id="assignment_id_{{ $lessonType }}"
                class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
            <option value="">-- Select an Assignment --</option>
            @if(isset($availableAssignments) && $availableAssignments->count() > 0)
                @foreach($availableAssignments as $assignment)
                    <option value="{{ $assignment->id }}" {{ old('assignment_id', $lesson->assignment_id ?? '') == $assignment->id ? 'selected' : '' }}>
                        {{ $assignment->title }} (ID: {{ $assignment->id }})
                    </option>
                @endforeach
            @else
                <option value="" disabled>No assignments available in this course. Create one first.</option>
            @endif
        </select>
        @error('assignment_id')
        <p class="mt-2 text-sm text-red-600">{{ $message }}</p>
        @enderror
        <p class="mt-1 text-sm text-gray-500">Only assignments belonging to this course can be linked.</p>
    </div>

    <div>
        <label for="instructions_assignment_link_{{ $lessonType }}" class="block text-sm font-medium text-gray-700">Instructions (Optional)</label>
        <textarea name="instructions" id="instructions_assignment_link_{{ $lessonType }}" rows="5" placeholder="Enter any specific instructions for this linked assignment..."
                  class="rich-text-editor mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">{{ old('instructions', $lesson->instructions ?? '') }}</textarea>
        @error('instructions')
        <p class="mt-2 text-sm text-red-600">{{ $message }}</p>
        @enderror
    </div>
</div> 