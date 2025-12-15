<?php

declare(strict_types=1);

namespace App\Http\Controllers\Parent;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\ConnectionRequestNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\View\View;

final class ConnectionRequestController extends Controller
{
    /**
     * Display a form for creating a new connection request.
     */
    public function create(): View
    {
        return view('parent.connection.create');
    }

    /**
     * Store a new connection request in storage.
     */
    public function store(Request $request): \Illuminate\Http\RedirectResponse
    {
        $request->validate([
            'student_email' => 'required|email|exists:users,email',
        ]);

        $parent = $request->user();
        $studentEmail = $request->input('student_email');


        if (!$parent->hasRole('parent')) {
            return redirect()->back()->with('error', 'You must have a parent role to create connection requests');
        }


        $student = User::where('email', $studentEmail)->first();


        if (!$student->hasRole('student')) {
            return redirect()->back()->with('error', 'The provided email must belong to a student account');
        }


        $existingConnection = DB::table('parent_student')
            ->where('parent_user_id', $parent->id)
            ->where('student_user_id', $student->id)
            ->first();

        if ($existingConnection) {
            if ($existingConnection->status === 'active') {
                return redirect()->back()->with('error', 'You are already connected to this student');
            } elseif ($existingConnection->status === 'pending') {
                return redirect()->back()->with('error', 'A connection request to this student is already pending');
            } elseif ($existingConnection->status === 'rejected') {
                return redirect()->back()->with('error', 'Your previous connection request to this student was rejected');
            }
        }

        try {

            DB::table('parent_student')->insert([
                'parent_user_id' => $parent->id,
                'student_user_id' => $student->id,
                'status' => 'pending',
                'requested_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);


            try {
                $student->notify(new ConnectionRequestNotification($parent));
            } catch (\Exception $e) {
                Log::error('Failed to send connection request notification: ' . $e->getMessage());

            }

            return redirect()->route('parent.dashboard')
                ->with('success', 'Connection request sent to student successfully. Waiting for approval.');
        } catch (\Exception $e) {
            Log::error('Failed to create connection request: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to create connection request: ' . $e->getMessage());
        }
    }

    /**
     * Display a list of all connection requests made by the parent.
     */
    public function index(Request $request): View
    {
        $parent = $request->user();

        $connections = DB::table('parent_student')
            ->join('users', 'parent_student.student_user_id', '=', 'users.id')
            ->where('parent_student.parent_user_id', $parent->id)
            ->select('parent_student.*', 'users.name as student_name', 'users.email as student_email')
            ->orderBy('parent_student.created_at', 'desc')
            ->paginate(10);

        return view('parent.connection.index', [
            'connections' => $connections,
        ]);
    }
}
