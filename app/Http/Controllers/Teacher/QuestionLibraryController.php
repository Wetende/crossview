<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Question;
use App\Models\Subject;
use App\Models\SubjectTopic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

final class QuestionLibraryController extends Controller
{
    /**
     * Display the question library.
     */
    public function index(): View
    {
        $user = Auth::user();
        $subjects = Subject::orderBy('name')->get();
        $questionTypes = [
            'single_choice' => __('Single Choice'),
            'multiple_choice' => __('Multiple Choice'),
            'true_false' => __('True/False'),
            'matching' => __('Matching'),
            'image_matching' => __('Image Matching'),
            'keywords' => __('Keywords'),
            'fill_gap' => __('Fill in the Gap')
        ];

        return view('teacher.questions.library', compact('subjects', 'questionTypes'));
    }

    /**
     * Search for questions in the library.
     */
    public function search(Request $request): JsonResponse
    {
        $user = Auth::user();
        $query = Question::with(['quiz', 'quiz.course', 'subjectTopic'])
            ->where(function ($q) use ($user) {
                
                $q->where('add_to_my_library', true)
                  ->orWhereHas('quiz', function ($qb) use ($user) {
                      $qb->whereHas('course', function ($c) use ($user) {
                          $c->where('user_id', $user->id);
                      });
                  });
            });

        
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('text', 'like', "%{$search}%")
                  ->orWhere('hint', 'like', "%{$search}%")
                  ->orWhere('explanation', 'like', "%{$search}%");
            });
        }

        if ($request->filled('type')) {
            $query->where('question_type', $request->input('type'));
        }

        if ($request->filled('subject_id')) {
            $subjectId = $request->input('subject_id');
            $query->whereHas('subjectTopic', function ($q) use ($subjectId) {
                $q->where('subject_id', $subjectId);
            });
        }

        if ($request->filled('subject_topic_id')) {
            $query->where('subject_topic_id', $request->input('subject_topic_id'));
        }


        $questions = $query->orderBy('created_at', 'desc')
            ->paginate(10);

        
        $formattedQuestions = $questions->map(function ($question) {
            $source = $question->quiz?->course?->title ?? __('My Library');

            return [
                'id' => $question->id,
                'text' => strip_tags($question->text), 
                'question_type' => $question->question_type,
                'points' => $question->points,
                'source' => $source,
                'subject_topic' => $question->subjectTopic?->name,
                'created_at' => $question->created_at->format('Y-m-d')
            ];
        });

        return response()->json([
            'questions' => $formattedQuestions,
            'pagination' => [
                'total' => $questions->total(),
                'per_page' => $questions->perPage(),
                'current_page' => $questions->currentPage(),
                'last_page' => $questions->lastPage()
            ]
        ]);
    }

    /**
     * Get subject topics for a specific subject.
     */
    public function getSubjectTopics(Request $request, int $subjectId): JsonResponse
    {
        $topics = SubjectTopic::where('subject_id', $subjectId)
            ->orderBy('name')
            ->get(['id', 'name']);

        return response()->json($topics);
    }
}
