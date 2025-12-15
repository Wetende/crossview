<?php

declare(strict_types=1);

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\View\View;

final class ActivityController extends Controller
{
    /**
     * Display a listing of the student's quizzes and assignments.
     */
    public function index(Request $request): View
    {


        return view('student.assessments.index');
    }

    /**
     * Display a specific quiz or assignment, or the interface to take/submit it.
     *
     * @param string $activityId // Or use route model binding for Activity/Quiz/Assignment model
     */
    public function show(Request $request, string $activityId): View
    {




        return view('student.assessments.show', ['activityId' => $activityId]);
    }
}
