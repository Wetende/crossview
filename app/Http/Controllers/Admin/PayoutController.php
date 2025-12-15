<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TeacherPayout;
use App\Models\TeacherPaymentDetail;
use App\Models\User;
use App\Services\TeacherCompensationService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

final class PayoutController extends Controller
{
    public function __construct(private TeacherCompensationService $compensationService)
    {
    }

    /**
     * Display a listing of the payouts.
     */
    public function index(): View
    {
        $pendingPayouts = TeacherPayout::pending()
            ->with('teacher')
            ->orderBy('created_at')
            ->paginate(20, ['*'], 'pending_page');

        $processingPayouts = TeacherPayout::processing()
            ->with('teacher')
            ->orderBy('updated_at', 'desc')
            ->paginate(10, ['*'], 'processing_page');

        $completedPayouts = TeacherPayout::paid()
            ->with('teacher')
            ->orderBy('updated_at', 'desc')
            ->paginate(10, ['*'], 'completed_page');

        $failedPayouts = TeacherPayout::where('status', 'failed')
            ->orWhere('status', 'cancelled')
            ->with('teacher')
            ->orderBy('updated_at', 'desc')
            ->paginate(10, ['*'], 'failed_page');

        return view('admin.payouts.index', [
            'pendingPayouts' => $pendingPayouts,
            'processingPayouts' => $processingPayouts,
            'completedPayouts' => $completedPayouts,
            'failedPayouts' => $failedPayouts,
        ]);
    }

    /**
     * Show the form for generating new payouts.
     */
    public function create(): View
    {
        $teachers = User::whereHas('roles', function ($query) {
            $query->where('name', 'teacher');
        })
        ->whereHas('paymentDetails', function ($query) {
            $query->where('status', 'verified');
        })
        ->get();

        return view('admin.payouts.create', [
            'teachers' => $teachers,
        ]);
    }

    /**
     * Generate payouts for all eligible teachers or a specific teacher.
     */
    public function generate(Request $request)
    {
        $validated = $request->validate([
            'period_start' => ['required', 'date'],
            'period_end' => ['required', 'date', 'after_or_equal:period_start'],
            'teacher_id' => ['nullable', 'exists:users,id'],
        ]);

        $periodStart = Carbon::parse($validated['period_start']);
        $periodEnd = Carbon::parse($validated['period_end']);

        if (isset($validated['teacher_id'])) {

            $teacher = User::findOrFail($validated['teacher_id']);
            $payout = $this->compensationService->calculatePayoutForTeacher($teacher, $periodStart, $periodEnd);

            if ($payout) {
                return redirect()->route('admin.payouts.show', $payout)
                    ->with('success', "Payout for {$teacher->name} has been generated successfully.");
            }

            return redirect()->route('admin.payouts.create')
                ->with('error', "No payout could be generated for {$teacher->name}. They may not have any eligible revenue in this period or might not have verified payment details.");
        }


        $payouts = $this->compensationService->calculatePayoutsForAllTeachers($periodStart, $periodEnd);

        if ($payouts->isEmpty()) {
            return redirect()->route('admin.payouts.create')
                ->with('error', 'No payouts could be generated. Teachers may not have any eligible revenue in this period or might not have verified payment details.');
        }

        return redirect()->route('admin.payouts.index')
            ->with('success', "{$payouts->count()} payouts have been generated successfully.");
    }

    /**
     * Display the specified payout.
     */
    public function show(TeacherPayout $payout): View
    {
        $payout->load('teacher');

        return view('admin.payouts.show', [
            'payout' => $payout,
        ]);
    }

    /**
     * Show the form for editing the payout status.
     */
    public function edit(TeacherPayout $payout): View
    {
        $payout->load('teacher');

        return view('admin.payouts.edit', [
            'payout' => $payout,
        ]);
    }

    /**
     * Update the payout status.
     */
    public function update(Request $request, TeacherPayout $payout)
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:processing,paid,failed,cancelled'],
            'reference' => ['nullable', 'string', 'max:255', 'required_if:status,paid'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $admin = Auth::user();


        if ($validated['status'] === 'processing' && empty($payout->payment_details_snapshot)) {
            $paymentDetail = TeacherPaymentDetail::where('user_id', $payout->user_id)
                ->where('status', 'verified')
                ->first();

            if ($paymentDetail) {
                $payout->payment_details_snapshot = json_encode([
                    'payment_method' => $paymentDetail->payment_method,
                    'account_details' => json_decode($paymentDetail->account_details, true),
                ]);
            }
        }


        switch ($validated['status']) {
            case 'processing':
                $payout->markAsProcessing($admin);
                $message = 'Payout has been marked as processing.';
                break;
            case 'paid':
                $payout->markAsPaid($admin, $validated['reference']);
                $message = 'Payout has been marked as paid.';
                break;
            case 'failed':
                $payout->markAsFailed($admin, $validated['notes']);
                $message = 'Payout has been marked as failed.';
                break;
            case 'cancelled':
                $payout->markAsCancelled($admin, $validated['notes']);
                $message = 'Payout has been cancelled.';
                break;
        }

        return redirect()->route('admin.payouts.index')
            ->with('success', $message);
    }
}
