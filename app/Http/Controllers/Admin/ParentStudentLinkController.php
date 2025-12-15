<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\View\View;

final class ParentStudentLinkController extends Controller
{
    /**
     * Display a listing of parent-student connections.
     */
    public function index(Request $request): View
    {
        $query = DB::table('parent_student')
            ->join('users as parents', 'parent_student.parent_user_id', '=', 'parents.id')
            ->join('users as students', 'parent_student.student_user_id', '=', 'students.id')
            ->select(
                'parent_student.*',
                'parents.name as parent_name',
                'parents.email as parent_email',
                'students.name as student_name',
                'students.email as student_email'
            );


        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('parents.name', 'like', "%{$search}%")
                    ->orWhere('parents.email', 'like', "%{$search}%")
                    ->orWhere('students.name', 'like', "%{$search}%")
                    ->orWhere('students.email', 'like', "%{$search}%");
            });
        }

        if ($request->has('status') && $request->input('status') !== '') {
            $query->where('parent_student.status', $request->input('status'));
        }

        $connections = $query->orderBy('parent_student.created_at', 'desc')
            ->paginate(15);

        return view('admin.parent-student.index', [
            'connections' => $connections,
        ]);
    }

    /**
     * Show the form for creating a new connection.
     */
    public function create(): View
    {
        $parents = User::whereHas('roles', function ($query) {
            $query->where('name', 'parent');
        })->get();

        $students = User::whereHas('roles', function ($query) {
            $query->where('name', 'student');
        })->get();

        return view('admin.parent-student.create', [
            'parents' => $parents,
            'students' => $students,
        ]);
    }

    /**
     * Store a newly created connection in storage.
     */
    public function store(Request $request): \Illuminate\Http\RedirectResponse
    {
        $request->validate([
            'parent_id' => 'required|exists:users,id',
            'student_id' => 'required|exists:users,id',
        ]);

        $parentId = $request->input('parent_id');
        $studentId = $request->input('student_id');


        $parent = User::findOrFail($parentId);
        if (!$parent->hasRole('parent')) {
            return redirect()->back()->with('error', 'Selected user must have a parent role');
        }


        $student = User::findOrFail($studentId);
        if (!$student->hasRole('student')) {
            return redirect()->back()->with('error', 'Selected user must have a student role');
        }


        $existingConnection = DB::table('parent_student')
            ->where('parent_user_id', $parentId)
            ->where('student_user_id', $studentId)
            ->first();

        if ($existingConnection) {
            return redirect()->back()->with('error', 'This parent-student connection already exists');
        }

        try {

            DB::table('parent_student')->insert([
                'parent_user_id' => $parentId,
                'student_user_id' => $studentId,
                'status' => 'active',
                'requested_at' => now(),
                'actioned_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return redirect()->route('admin.parent-student.index')
                ->with('success', 'Parent-student connection created successfully');
        } catch (\Exception $e) {
            Log::error('Failed to create parent-student connection: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to create connection: ' . $e->getMessage());
        }
    }

    /**
     * Search for parents based on query.
     */
    public function searchParents(Request $request): \Illuminate\Http\JsonResponse
    {
        $query = $request->input('query');
        $parents = User::whereHas('roles', function ($q) {
            $q->where('name', 'parent');
        })
        ->where(function ($q) use ($query) {
            $q->where('name', 'like', "%{$query}%")
                ->orWhere('email', 'like', "%{$query}%");
        })
        ->take(10)
        ->get(['id', 'name', 'email']);

        return response()->json($parents);
    }

    /**
     * Search for students based on query.
     */
    public function searchStudents(Request $request): \Illuminate\Http\JsonResponse
    {
        $query = $request->input('query');
        $students = User::whereHas('roles', function ($q) {
            $q->where('name', 'student');
        })
        ->where(function ($q) use ($query) {
            $q->where('name', 'like', "%{$query}%")
                ->orWhere('email', 'like', "%{$query}%");
        })
        ->take(10)
        ->get(['id', 'name', 'email']);

        return response()->json($students);
    }

    /**
     * Show details of a parent-student connection.
     */
    public function show(int $parentId, int $studentId): View
    {
        $connection = DB::table('parent_student')
            ->where('parent_user_id', $parentId)
            ->where('student_user_id', $studentId)
            ->first();

        if (!$connection) {
            abort(404, 'Connection not found');
        }

        $parent = User::findOrFail($parentId);
        $student = User::findOrFail($studentId);

        return view('admin.parent-student.show', [
            'connection' => $connection,
            'parent' => $parent,
            'student' => $student,
        ]);
    }

    /**
     * Update the status of a parent-student connection.
     */
    public function updateStatus(Request $request, int $parentId, int $studentId): \Illuminate\Http\RedirectResponse
    {
        $request->validate([
            'status' => 'required|in:active,pending,rejected',
        ]);

        try {
            DB::table('parent_student')
                ->where('parent_user_id', $parentId)
                ->where('student_user_id', $studentId)
                ->update([
                    'status' => $request->input('status'),
                    'updated_at' => now(),
                    'actioned_at' => $request->input('status') === 'active' ? now() : null,
                ]);

            return redirect()->route('admin.parent-student.index')
                ->with('success', 'Connection status updated successfully');
        } catch (\Exception $e) {
            Log::error('Failed to update connection status: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to update status: ' . $e->getMessage());
        }
    }

    /**
     * Remove a parent-student connection.
     */
    public function destroy(int $parentId, int $studentId): \Illuminate\Http\RedirectResponse
    {
        try {
            DB::table('parent_student')
                ->where('parent_user_id', $parentId)
                ->where('student_user_id', $studentId)
                ->delete();

            return redirect()->route('admin.parent-student.index')
                ->with('success', 'Parent-student connection deleted successfully');
        } catch (\Exception $e) {
            Log::error('Failed to delete parent-student connection: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to delete connection: ' . $e->getMessage());
        }
    }
}
