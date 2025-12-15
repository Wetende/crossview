<?php

declare(strict_types=1);

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\ConnectionApprovedNotification;
use App\Notifications\ConnectionRejectedNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\View\View;

final class ConnectionRequestController extends Controller
{
    /**
     * Display a list of all pending connection requests.
     */
    public function index(Request $request): View
    {
        $student = $request->user();

        $connections = DB::table('parent_student')
            ->join('users', 'parent_student.parent_user_id', '=', 'users.id')
            ->where('parent_student.student_user_id', $student->id)
            ->select('parent_student.*', 'users.name as parent_name', 'users.email as parent_email')
            ->orderBy('parent_student.created_at', 'desc')
            ->paginate(10);

        return view('student.connections.index', [
            'connections' => $connections,
        ]);
    }

    /**
     * Approve a parent connection request.
     */
    public function approve(Request $request, int $parentId): \Illuminate\Http\RedirectResponse
    {
        $student = $request->user();

        $connection = DB::table('parent_student')
            ->where('parent_user_id', $parentId)
            ->where('student_user_id', $student->id)
            ->first();

        if (!$connection) {
            return redirect()->route('student.connections.requests')->with('error', 'Connection request not found');
        }

        if ($connection->status === 'active') {
            return redirect()->route('student.connections.requests')->with('error', 'This connection is already active');
        }

        try {

            DB::table('parent_student')
                ->where('parent_user_id', $parentId)
                ->where('student_user_id', $student->id)
                ->update([
                    'status' => 'active',
                    'actioned_at' => now(),
                    'updated_at' => now(),
                ]);


            $parent = User::findOrFail($parentId);
            $parent->notify(new ConnectionApprovedNotification($student));

            return redirect()->route('student.connections.requests')
                ->with('success', 'Connection request approved successfully');
        } catch (\Exception $e) {
            Log::error('Failed to approve connection request: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to approve connection request: ' . $e->getMessage());
        }
    }

    /**
     * Reject a parent connection request.
     */
    public function reject(Request $request, int $parentId): \Illuminate\Http\RedirectResponse
    {
        $student = $request->user();

        $connection = DB::table('parent_student')
            ->where('parent_user_id', $parentId)
            ->where('student_user_id', $student->id)
            ->first();

        if (!$connection) {
            return redirect()->route('student.connections.requests')->with('error', 'Connection request not found');
        }

        if ($connection->status === 'rejected') {
            return redirect()->route('student.connections.requests')->with('error', 'This connection is already rejected');
        }

        try {

            DB::table('parent_student')
                ->where('parent_user_id', $parentId)
                ->where('student_user_id', $student->id)
                ->update([
                    'status' => 'rejected',
                    'updated_at' => now(),
                ]);


            $parent = User::findOrFail($parentId);
            $parent->notify(new ConnectionRejectedNotification($student));

            return redirect()->route('student.connections.requests')
                ->with('success', 'Connection request rejected successfully');
        } catch (\Exception $e) {
            Log::error('Failed to reject connection request: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to reject connection request: ' . $e->getMessage());
        }
    }

    /**
     * Remove a parent connection.
     */
    public function destroy(Request $request, int $parentId): \Illuminate\Http\RedirectResponse
    {
        $student = $request->user();

        try {
            DB::table('parent_student')
                ->where('parent_user_id', $parentId)
                ->where('student_user_id', $student->id)
                ->delete();

            return redirect()->route('student.connections.requests')
                ->with('success', 'Connection deleted successfully');
        } catch (\Exception $e) {
            Log::error('Failed to delete connection: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to delete connection: ' . $e->getMessage());
        }
    }
}
