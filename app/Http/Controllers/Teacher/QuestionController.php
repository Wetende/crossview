<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Quiz;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Http\Requests\Teacher\StoreQuestionRequest;
use App\Http\Requests\Teacher\UpdateQuestionRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;
use Illuminate\Http\JsonResponse;

final class QuestionController extends Controller
{
    /**
     * Show the form for creating a new question within a quiz.
     */
    public function create(Course $course, CourseSection $section, Quiz $quiz, Request $request): View
    {
        $question = new Question();
        $questionType = $request->query('question_type', 'single_choice');


        $subjectTopics = [];
        if ($quiz->subject_id) {
            $subjectTopics = \App\Models\SubjectTopic::where('subject_id', $quiz->subject_id)
                ->orderBy('name')
                ->get();
        }

        return view('teacher.questions.create', compact(
            'course',
            'section',
            'quiz',
            'question',
            'questionType',
            'subjectTopics'
        ));
    }

    /**
     * Store a newly created question in storage.
     */
    public function store(StoreQuestionRequest $request, Course $course, CourseSection $section, Quiz $quiz): RedirectResponse
    {
        $validated = $request->validated();

        DB::beginTransaction();

        try {
            $maxOrder = $quiz->questions()->max('order') ?? 0;

            $questionData = [
                'quiz_id' => $quiz->id,
                'text' => $validated['text'],
                'question_type' => $validated['question_type'],
                'points' => $validated['points'] ?? 1,
                'order' => $maxOrder + 1,
                'hint' => $validated['hint'] ?? null,
                'explanation' => $validated['explanation'] ?? null,
                'add_to_my_library' => $validated['add_to_my_library'] ?? false,
                'subject_topic_id' => $validated['subject_topic_id'] ?? null,
            ];

            
            if ($request->hasFile('image')) {
                $path = $request->file('image')->store('public/quizzes/' . $quiz->id . '/questions');
                $questionData['image_path'] = \Illuminate\Support\Facades\Storage::url($path);
            }

            $question = $quiz->questions()->create($questionData);

            
            if (in_array($validated['question_type'], ['single_choice', 'multiple_choice', 'true_false'], true)) {
                $this->processOptions($question, $validated, $request);
            } elseif ($validated['question_type'] === 'matching') {
                $this->processMatchingPairs($question, $validated);
            } elseif ($validated['question_type'] === 'image_matching') {
                $this->processImageMatchingPairs($question, $validated, $request);
            } elseif ($validated['question_type'] === 'keywords') {
                $this->processKeywords($question, $validated);
            } elseif ($validated['question_type'] === 'fill_gap') {
                $this->processGapAnswers($question, $validated);
            }

            DB::commit();

            return redirect()->route('teacher.courses.quizzes.edit', [$course, $section, $quiz])
                ->with('success', 'Question added successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withInput()->withErrors(['message' => 'Failed to create question: ' . $e->getMessage()]);
        }
    }

    /**
     * Show the form for editing the specified question.
     */
    public function edit(Course $course, CourseSection $section, Quiz $quiz, Question $question): View
    {
        $questionType = $question->question_type;
        $options = $question->options;


        $subjectTopics = [];
        if ($quiz->subject_id) {
            $subjectTopics = \App\Models\SubjectTopic::where('subject_id', $quiz->subject_id)
                ->orderBy('name')
                ->get();
        }

        return view('teacher.questions.edit', compact(
            'course',
            'section',
            'quiz',
            'question',
            'questionType',
            'options',
            'subjectTopics'
        ));
    }

    /**
     * Update the specified question in storage.
     */
    public function update(UpdateQuestionRequest $request, Course $course, CourseSection $section, Quiz $quiz, Question $question): RedirectResponse
    {
        $validated = $request->validated();

        DB::beginTransaction();

        try {
            $questionData = [
                'text' => $validated['text'],
                
                'points' => $validated['points'] ?? 1,
                'hint' => $validated['hint'] ?? null,
                'explanation' => $validated['explanation'] ?? null,
                'add_to_my_library' => $validated['add_to_my_library'] ?? false,
                'subject_topic_id' => $validated['subject_topic_id'] ?? null,
            ];

            
            if ($request->hasFile('image')) {
                
                if ($question->image_path) {
                    $oldPath = str_replace('/storage', 'public', $question->image_path);
                    \Illuminate\Support\Facades\Storage::delete($oldPath);
                }

                $path = $request->file('image')->store('public/quizzes/' . $quiz->id . '/questions');
                $questionData['image_path'] = \Illuminate\Support\Facades\Storage::url($path);
            } elseif ($validated['remove_image'] ?? false) {
                
                if ($question->image_path) {
                    $oldPath = str_replace('/storage', 'public', $question->image_path);
                    \Illuminate\Support\Facades\Storage::delete($oldPath);
                    $questionData['image_path'] = null;
                }
            }

            $question->update($questionData);

            
            if (in_array($question->question_type, ['single_choice', 'multiple_choice', 'true_false'], true)) {
                
                $question->options()->delete();
                
                $this->processOptions($question, $validated, $request);
            } elseif ($question->question_type === 'matching') {
                
                $question->matchingPairs()->delete();
                
                $this->processMatchingPairs($question, $validated);
            } elseif ($question->question_type === 'image_matching') {
                
                $existingImagePairs = $question->matchingPairs()->get();
                $unusedImageUrls = $existingImagePairs->pluck('prompt_image_url')->toArray();

                
                $this->processImageMatchingPairs($question, $validated, $request, $unusedImageUrls);

                
                $question->matchingPairs()->whereIn('prompt_image_url', $unusedImageUrls)->delete();
            } elseif ($question->question_type === 'keywords') {
                
                $question->keywordAnswers()->delete();
                
                $this->processKeywords($question, $validated);
            } elseif ($question->question_type === 'fill_gap') {
                
                $question->gapAnswers()->delete();
                
                $this->processGapAnswers($question, $validated);
            }

            DB::commit();

            return redirect()->route('teacher.courses.quizzes.edit', [$course, $section, $quiz])
                ->with('success', 'Question updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withInput()->withErrors(['message' => 'Failed to update question: ' . $e->getMessage()]);
        }
    }

    /**
     * Remove the specified question from storage.
     */
    public function destroy(Course $course, CourseSection $section, Quiz $quiz, Question $question): RedirectResponse
    {
        $question->delete();

        return redirect()->route('teacher.courses.quizzes.edit', [$course, $section, $quiz])
            ->with('success', 'Question deleted successfully.');
    }

    /**
     * Reorder questions within a quiz.
     */
    public function reorder(Request $request, Course $course, CourseSection $section, Quiz $quiz): RedirectResponse
    {
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|integer|exists:questions,id',
            'items.*.order' => 'required|integer|min:0',
        ]);

        foreach ($validated['items'] as $item) {
            $question = Question::findOrFail($item['id']);
            $question->update(['order' => $item['order']]);
        }

        return back()->with('success', 'Question order updated successfully.');
    }

    /**
     * Import questions from the library to the quiz.
     */
    public function import(Request $request, Course $course, CourseSection $section, Quiz $quiz): JsonResponse
    {
        $validated = $request->validate([
            'question_ids' => 'required|array',
            'question_ids.*' => 'required|integer|exists:questions,id',
        ]);

        $maxOrder = $quiz->questions()->max('order') ?? 0;
        $importedCount = 0;

        DB::beginTransaction();

        try {
            foreach ($validated['question_ids'] as $questionId) {
                
                $originalQuestion = Question::with([
                    'options',
                    'matchingPairs',
                    'keywordAnswers',
                    'gapAnswers'
                ])->findOrFail($questionId);

                
                $newQuestion = $originalQuestion->replicate();
                $newQuestion->quiz_id = $quiz->id;
                $newQuestion->order = ++$maxOrder;
                $newQuestion->save();

                
                if (in_array($originalQuestion->question_type, ['single_choice', 'multiple_choice', 'true_false'], true)) {
                    foreach ($originalQuestion->options as $option) {
                        $newOption = $option->replicate();
                        $newOption->question_id = $newQuestion->id;
                        $newOption->save();
                    }
                } elseif ($originalQuestion->question_type === 'matching') {
                    foreach ($originalQuestion->matchingPairs as $pair) {
                        $newPair = $pair->replicate();
                        $newPair->question_id = $newQuestion->id;
                        $newPair->save();
                    }
                } elseif ($originalQuestion->question_type === 'keywords') {
                    foreach ($originalQuestion->keywordAnswers as $keyword) {
                        $newKeyword = $keyword->replicate();
                        $newKeyword->question_id = $newQuestion->id;
                        $newKeyword->save();
                    }
                } elseif ($originalQuestion->question_type === 'fill_gap') {
                    foreach ($originalQuestion->gapAnswers as $gap) {
                        $newGap = $gap->replicate();
                        $newGap->question_id = $newQuestion->id;
                        $newGap->save();
                    }
                }

                $importedCount++;
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "{$importedCount} questions imported successfully.",
                'imported_count' => $importedCount
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => "Failed to import questions: {$e->getMessage()}"
            ], 500);
        }
    }

    /**
     * Process and save question options from the request data.
     */
    private function processOptions(Question $question, array $validated, Request $request): void
    {
        $options = $validated['options'] ?? [];
        $isCorrect = $validated['is_correct'] ?? [];

        foreach ($options as $key => $text) {
            if (empty($text) && !$request->hasFile("option_images.$key")) {
                continue; 
            }

            $optionData = [
                'question_id' => $question->id,
                'text' => $text,
                'is_correct' => in_array($key, $isCorrect, true),
                'order' => $key,
            ];

            
            if ($request->hasFile("option_images.$key")) {
                $path = $request->file("option_images.$key")->store('public/quizzes/' . $question->quiz_id . '/options');
                $optionData['image_url'] = \Illuminate\Support\Facades\Storage::url($path);
            }

            QuestionOption::create($optionData);
        }
    }

    /**
     * Process and save matching pairs for a matching question
     */
    private function processMatchingPairs(Question $question, array $validated): void
    {
        $matchingPairs = $validated['matching_pairs'] ?? [];

        foreach ($matchingPairs as $index => $pair) {
            if (empty($pair['left_text']) && empty($pair['right_text'])) {
                continue; 
            }

            $question->matchingPairs()->create([
                'matching_pair_key' => uniqid('pair_'),
                'prompt_text' => $pair['left_text'],
                'answer_text' => $pair['right_text'],
                'order' => $index,
                'points' => 1, 
            ]);
        }
    }

    /**
     * Process and save image matching pairs for an image matching question
     *
     * @param array $unusedImageUrls Optional list of existing image URLs that can be reused
     */
    private function processImageMatchingPairs(Question $question, array $validated, Request $request, array $unusedImageUrls = []): void
    {
        $imagePairs = $validated['image_matching_pairs'] ?? [];

        foreach ($imagePairs as $index => $pair) {
            if (empty($pair['text']) && !$request->hasFile("image_matching_pairs.{$index}.image") && empty($pair['existing_image'])) {
                continue; 
            }

            $pairData = [
                'matching_pair_key' => uniqid('img_pair_'),
                'answer_text' => $pair['text'] ?? '',
                'order' => $index,
                'points' => 1, 
            ];

            
            if (!empty($pair['existing_image']) && in_array($pair['existing_image'], $unusedImageUrls, true)) {
                $pairData['prompt_image_url'] = $pair['existing_image'];
                
                $unusedImageUrls = array_diff($unusedImageUrls, [$pair['existing_image']]);
            }
            
            elseif ($request->hasFile("image_matching_pairs.{$index}.image")) {
                $path = $request->file("image_matching_pairs.{$index}.image")->store(
                    'public/quizzes/' . $question->quiz_id . '/image_matching'
                );
                $pairData['prompt_image_url'] = \Illuminate\Support\Facades\Storage::url($path);
            }

            $question->matchingPairs()->create($pairData);
        }

        
        foreach ($unusedImageUrls as $imageUrl) {
            if ($imageUrl) {
                $path = str_replace('/storage', 'public', $imageUrl);
                \Illuminate\Support\Facades\Storage::delete($path);
            }
        }
    }

    /**
     * Process and save keywords for a keyword question
     */
    private function processKeywords(Question $question, array $validated): void
    {
        $keywords = $validated['keywords'] ?? [];
        $caseSensitive = $validated['case_sensitive'] ?? false;

        foreach ($keywords as $keyword) {
            if (empty($keyword)) {
                continue; 
            }

            $question->keywordAnswers()->create([
                'acceptable_keyword' => $keyword,
                'case_sensitive' => $caseSensitive,
                'points_per_keyword' => 1, 
            ]);
        }
    }

    /**
     * Process and save gap answers for a fill in the gap question
     */
    private function processGapAnswers(Question $question, array $validated): void
    {
        $gaps = $validated['gaps'] ?? [];

        foreach ($gaps as $gapId => $answers) {
            if (empty($answers)) {
                continue;
            }

            
            if (is_array($answers)) {
                foreach ($answers as $answer) {
                    if (empty($answer)) {
                        continue;
                    }

                    $question->gapAnswers()->create([
                        'gap_identifier' => $gapId,
                        'correct_text' => $answer,
                        'case_sensitive' => $validated['gap_case_sensitive'] ?? false,
                        'points' => 1, 
                    ]);
                }
            } else {
                $question->gapAnswers()->create([
                    'gap_identifier' => $gapId,
                    'correct_text' => $answers,
                    'case_sensitive' => $validated['gap_case_sensitive'] ?? false,
                    'points' => 1, 
                ]);
            }
        }
    }
}
