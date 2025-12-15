@props(['lesson', 'lessonType', 'course', 'section', 'errors', 'availableQuizzes'])

<div class="space-y-4">
    <div>
        <label for="quiz_id_{{ $lessonType }}" class="block text-sm font-medium text-gray-700">Select Quiz</label>
        <select name="quiz_id" id="quiz_id_{{ $lessonType }}"
                class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
            <option value="">-- Select a Quiz --</option>
            @if(isset($availableQuizzes) && $availableQuizzes->count() > 0)
                @foreach($availableQuizzes as $quiz)
                    <option value="{{ $quiz->id }}" {{ old('quiz_id', $lesson->quiz_id ?? '') == $quiz->id ? 'selected' : '' }}>
                        {{ $quiz->title }} (ID: {{ $quiz->id }})
                    </option>
                @endforeach
            @else
                <option value="" disabled>No quizzes available in this course. Create one first.</option>
            @endif
        </select>
        @error('quiz_id')
        <p class="mt-2 text-sm text-red-600">{{ $message }}</p>
        @enderror
        <p class="mt-1 text-sm text-gray-500">Only quizzes belonging to this course can be linked.</p>
    </div>

    <div>
        <label for="instructions_quiz_link_{{ $lessonType }}" class="block text-sm font-medium text-gray-700">Instructions (Optional)</label>
        <textarea name="instructions" id="instructions_quiz_link_{{ $lessonType }}" rows="5" placeholder="Enter any specific instructions for this linked quiz..."
                  class="rich-text-editor mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">{{ old('instructions', $lesson->instructions ?? '') }}</textarea>
        @error('instructions')
        <p class="mt-2 text-sm text-red-600">{{ $message }}</p>
        @enderror
    </div>
</div> 