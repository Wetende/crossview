<?php

declare(strict_types=1);

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\View\View;

final class ForumController extends Controller
{
    /**
     * Display a listing of forums or recent activity.
     */
    public function index(Request $request): View
    {


        return view('student.forums.index');
    }

    /**
     * Display a specific forum thread.
     *
     * @param string $threadId // Or use route model binding if you have a Thread model
     */
    public function showThread(Request $request, string $threadId): View
    {


        return view('student.forums.thread', ['threadId' => $threadId]);
    }
}
