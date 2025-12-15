<?php

declare(strict_types=1);

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Services\RecommendationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

final class RecommendationController extends Controller
{
    public function __construct(
        private readonly RecommendationService $recommendationService
    ) {
    }

    /**
     * Display recommended courses for the authenticated student.
     */
    public function index(Request $request): View
    {
        $limit = $request->query('limit', 6);
        $recommendations = $this->recommendationService->getRecommendedCourses(
            Auth::user(),
            (int) $limit
        );

        return view('student.recommendations.index', [
            'recommendations' => $recommendations,
            'title' => 'Recommended For You'
        ]);
    }

    /**
     * Display the "You Might Also Like" section for a specific course.
     */
    public function similarCourses(Request $request, Course $course): View
    {
        $limit = $request->query('limit', 4);
        $similarCourses = $this->recommendationService->getSimilarCourses(
            $course,
            (int) $limit
        );

        return view('student.recommendations.similar', [
            'course' => $course,
            'recommendations' => $similarCourses,
            'title' => 'You Might Also Like'
        ]);
    }

    /**
     * API endpoint to get recommended courses (for AJAX requests if needed).
     */
    public function getRecommendedCourses(Request $request)
    {
        $limit = $request->query('limit', 6);
        $recommendations = $this->recommendationService->getRecommendedCourses(
            Auth::user(),
            (int) $limit
        );

        return response()->json([
            'courses' => $recommendations->map(function ($course) {
                return [
                    'id' => $course->id,
                    'title' => $course->title,
                    'slug' => $course->slug,
                    'thumbnail' => $course->thumbnail_path,
                    'price' => $course->price,
                    'category' => $course->category?->name,
                    'teacher' => $course->user?->name,
                    'score' => $course->recommendation_score ?? 0,
                ];
            }),
        ]);
    }

    /**
     * API endpoint to get similar courses (for AJAX requests if needed).
     */
    public function getSimilarCourses(Request $request, Course $course)
    {
        $limit = $request->query('limit', 6);
        $similarCourses = $this->recommendationService->getSimilarCourses(
            $course,
            (int) $limit
        );

        return response()->json([
            'courses' => $similarCourses->map(function ($similarCourse) {
                return [
                    'id' => $similarCourse->id,
                    'title' => $similarCourse->title,
                    'slug' => $similarCourse->slug,
                    'thumbnail' => $similarCourse->thumbnail_path,
                    'price' => $similarCourse->price,
                    'category' => $similarCourse->category?->name,
                    'teacher' => $similarCourse->user?->name,
                    'score' => $similarCourse->similarity_score ?? 0,
                ];
            }),
        ]);
    }
}
