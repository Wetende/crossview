<?php

declare(strict_types=1);

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\View\View;

final class GradeController extends Controller
{
    /**
     * Display an overview of the student's grades or a list of courses to view grades for.
     */
    public function index(Request $request): View
    {


        return view('student.grades.index');
    }

    /**
     * Display detailed grades for a specific course.
     *
     * @param string $courseId // Or use route model binding for Course model
     */
    public function course(Request $request, string $courseId): View
    {


        return view('student.grades.course', ['courseId' => $courseId]);
    }
}
