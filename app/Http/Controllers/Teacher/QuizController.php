<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Quiz;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Http\Requests\Teacher\StoreQuizRequest;
use App\Http\Requests\Teacher\UpdateQuizRequest;
use Illuminate\Http\Request;
use Illuminate\View\View;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;
use App\Models\QuizCategory;



final class QuizController extends Controller
{
    /**
     * Store a newly created quiz within a course section.
     * This method will be mapped by Route::resource('courses.sections.quizzes', ...) ->name('...store')
     */
    public function store(StoreQuizRequest $request, Course $course, CourseSection $section): JsonResponse
    {
        $this->authorize('update', $section);

        $validated = $request->validated();

        /** @var User $teacher */
        $teacher = Auth::user();
        $maxOrder = $section->quizzes()->max('order') ?? 0;

        $quizData = [
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'course_section_id' => $section->id, 
            'user_id' => $teacher->id,
            'order' => $maxOrder + 1,
            'time_limit' => $validated['time_limit'] ?? null,
            'time_limit_unit' => $validated['time_limit_unit'] ?? 'minutes',
            'passing_grade' => $validated['passing_grade'] ?? 70,
            'max_attempts' => $validated['max_attempts'] ?? null,
            'is_published' => $validated['is_published'] ?? false,
            'randomize_questions' => $validated['randomize_questions'] ?? false,
            'show_correct_answer' => $validated['show_correct_answer'] ?? 'never',
        ];

        try {
            $quiz = $section->quizzes()->create($quizData); 

            if (isset($validated['questions']) && is_array($validated['questions'])) {
                foreach ($validated['questions'] as $index => $questionData) {
                    $question = $quiz->questions()->create([
                        'text' => $questionData['text'],
                        'question_type' => $questionData['type'],
                        'order' => $index + 1,
                        'points' => $questionData['points'] ?? 1,
                        'explanation' => $questionData['feedback'] ?? null,
                    ]);

                    if (in_array($question->question_type, ['multiple_choice', 'single_choice'], true) && !empty($questionData['options'])) {
                        foreach ($questionData['options'] as $optionIndex => $optionData) {
                            $question->options()->create([
                                'text' => $optionData['text'],
                                'is_correct' => $optionData['is_correct'] ?? false,
                                'order' => $optionIndex + 1,
                            ]);
                        }
                    }
                }
            }
            $quiz->refresh()->load(['questions.options']);
            return response()->json(['message' => 'Quiz created successfully.', 'quiz' => $quiz], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to create quiz: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified quiz (preview or detailed view for course context).
     */
    public function show(Course $course, CourseSection $section, Quiz $quiz, Request $request): JsonResponse|View
    {
        $this->authorize('view', $quiz);

        if ($request->wantsJson() || $request->query('format') === 'json') {
            $quiz->load(['questions' => function ($query) {
                $query->orderBy('order')->with(['options' => function ($q) { $q->orderBy('order'); }]);
            }]);
            return response()->json($quiz);
        }

        
        if ((int)$quiz->courseSection->course_id !== (int)$course->id || (int)$quiz->course_section_id !== (int)$section->id) {
            abort(404, 'Quiz not found in this section.');
        }
        $questions = $quiz->questions()->with('options')->orderBy('order')->get();
        return view('teacher.quizzes.show', compact('course', 'section', 'quiz', 'questions'));
    }

    /**
     * Show the form for editing the specified quiz.
     *
     * @return \Illuminate\Http\Response
     */
    public function edit(Course $course, Quiz $quiz)
    {
        $this->authorize('update', $course);

        
        if (request()->ajax() || request()->wantsJson() || request()->get('format') === 'json') {
            
            $quizData = $quiz->toArray();
            $quizData['questions'] = $quiz->questions()->with('options')->get()->toArray();

            return response()->json($quizData);
        }

        
        $categories = QuizCategory::orderBy('name')->get();
        $questions = $quiz->questions()->with('options')->get();

        return view('teacher.quizzes.edit', compact('course', 'quiz', 'questions', 'categories'));
    }



    /**
     * Update the specified quiz within a course section.
     * This method will be mapped by Route::resource('courses.sections.quizzes', ...) ->name('...update')
     */
    public function update(UpdateQuizRequest $request, Course $course, CourseSection $section, Quiz $quiz): JsonResponse
    {
        $this->authorize('update', $quiz);
        if ((int)$quiz->courseSection->course_id !== (int)$course->id || (int)$quiz->course_section_id !== (int)$section->id) {
            return response()->json(['message' => 'Quiz does not belong to the specified course or section.'], 403);
        }

        $validated = $request->validated();

        $quizData = [
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            
            'time_limit' => $validated['time_limit'] ?? null,
            'time_limit_unit' => $validated['time_limit_unit'] ?? 'minutes',
            'passing_grade' => $validated['passing_grade'] ?? 70,
            'max_attempts' => $validated['max_attempts'] ?? null,
            'is_published' => $validated['is_published'] ?? false,
            'randomize_questions' => $validated['randomize_questions'] ?? false,
            'show_correct_answer' => $validated['show_correct_answer'] ?? 'never',
        ];

        try {
            $quiz->update($quizData);

            $incomingQuestions = collect($validated['questions'] ?? []);
            $existingQuestionIds = $quiz->questions()->pluck('id')->all();
            $incomingQuestionIds = $incomingQuestions->pluck('id')->filter()->all();

            $questionsToDelete = array_diff($existingQuestionIds, $incomingQuestionIds);
            if (!empty($questionsToDelete)) {
                QuestionOption::whereIn('question_id', $questionsToDelete)->delete();
                Question::whereIn('id', $questionsToDelete)->delete();
            }

            foreach ($incomingQuestions as $index => $questionData) {
                $questionType = $questionData['type'];
                $questionPayload = [
                    'text' => $questionData['text'],
                    'question_type' => $questionType,
                    'order' => $index + 1,
                    'points' => $questionData['points'] ?? 1,
                    'explanation' => $questionData['feedback'] ?? null,
                ];

                $currentQuestion = null;
                if (!empty($questionData['id'])) {
                    $currentQuestion = Question::where('id', $questionData['id'])->where('quiz_id', $quiz->id)->first();
                    if ($currentQuestion) {
                        $currentQuestion->update($questionPayload);
                    }
                }

                if (!$currentQuestion) {
                    $currentQuestion = $quiz->questions()->create($questionPayload);
                }

                if (in_array($questionType, ['multiple_choice', 'single_choice'], true)) {
                    $incomingOptions = collect($questionData['options'] ?? []);
                    $existingOptionIds = $currentQuestion->options()->pluck('id')->all();
                    $incomingOptionIds = $incomingOptions->pluck('id')->filter()->all();

                    $optionsToDelete = array_diff($existingOptionIds, $incomingOptionIds);
                    if (!empty($optionsToDelete)) {
                        QuestionOption::whereIn('id', $optionsToDelete)->delete();
                    }

                    foreach ($incomingOptions as $optionIndex => $optionData) {
                        $optionPayload = [
                            'text' => $optionData['text'],
                            'is_correct' => $optionData['is_correct'] ?? false,
                            'order' => $optionIndex + 1,
                        ];
                        if (!empty($optionData['id'])) {
                            $option = QuestionOption::where('id', $optionData['id'])->where('question_id', $currentQuestion->id)->first();
                            if ($option) {
                                $option->update($optionPayload);
                            } else {
                                $currentQuestion->options()->create($optionPayload);
                            }
                        } else {
                            $currentQuestion->options()->create($optionPayload);
                        }
                    }
                } else {
                    $currentQuestion->options()->delete();
                }
            }

            $quiz->refresh()->load(['questions.options']);
            return response()->json(['message' => 'Quiz updated successfully.', 'quiz' => $quiz]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to update quiz: ' . $e->getMessage()], 500);
        }
    }



    /**
     * Remove the specified quiz from a course section.
     * This method will be mapped by Route::resource('courses.sections.quizzes', ...) ->name('...destroy')
     */
    public function destroy(Course $course, CourseSection $section, Quiz $quiz): JsonResponse
    {
        $this->authorize('delete', $quiz);
        if ((int)$quiz->courseSection->course_id !== (int)$course->id || (int)$quiz->course_section_id !== (int)$section->id) {
            return response()->json(['message' => 'Quiz does not belong to the specified course or section.'], 403);
        }

        try {
            $quiz->questions()->each(function (Question $question) {
                $question->options()->delete();
            });
            $quiz->questions()->delete();
            $quiz->delete();
            return response()->json(['message' => 'Quiz deleted successfully.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to delete quiz: ' . $e->getMessage()], 500);
        }
    }



    /**
     * Reorder quizzes within a section.
     */
    public function reorder(Request $request, Course $course, CourseSection $section): JsonResponse
    {
        $this->authorize('update', $section);
        $orderedQuizIds = $request->input('ordered_ids');

        if (!is_array($orderedQuizIds)) {
            return response()->json(['message' => 'Invalid data provided.'], 400);
        }

        try {
            foreach ($orderedQuizIds as $index => $quizId) {
                $quiz = $section->quizzes()->find($quizId);
                if ($quiz) {
                    $quiz->order = $index + 1;
                    $quiz->save();
                }
            }
            return response()->json(['message' => 'Quizzes reordered successfully.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to reorder quizzes: ' . $e->getMessage()], 500);
        }
    }
}
