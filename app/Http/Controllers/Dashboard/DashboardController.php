<?php

declare(strict_types=1);

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\View\View;

final class DashboardController extends Controller
{
    public function overview(): View
    {
        return view('dashboard.overview');
    }

    public function myCourses(): View
    {
        return view('dashboard.my-courses');
    }

    public function bookmarks(): View
    {
        return view('dashboard.bookmarks');
    }

    public function messages(): View
    {
        return view('dashboard.messages');
    }

    public function settings(): View
    {
        return view('dashboard.settings');
    }

    public function createCourseForm(): View
    {


        return view('dashboard.create-course');
    }

    public function listReviews(): View
    {

        return view('dashboard.reviews');
    }


    public function searchMessages(Request $request)
    {


        return redirect()->back()->with('info', 'Message search functionality not yet implemented.');
    }

    public function sendMessage(Request $request)
    {


        return redirect()->back()->with('info', 'Send message functionality not yet implemented.');
    }
}
