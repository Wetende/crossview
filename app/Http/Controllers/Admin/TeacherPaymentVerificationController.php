<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TeacherPaymentDetail;
use Illuminate\Http\Request;
use Illuminate\View\View;

final class TeacherPaymentVerificationController extends Controller
{
    /**
     * Display a listing of payment details pending verification.
     */
    public function index(): View
    {
        $pendingDetails = TeacherPaymentDetail::where('status', 'pending')
            ->with('user')
            ->orderBy('created_at')
            ->paginate(20);

        $verifiedDetails = TeacherPaymentDetail::where('status', 'verified')
            ->with('user')
            ->orderBy('updated_at', 'desc')
            ->paginate(20);

        $rejectedDetails = TeacherPaymentDetail::where('status', 'rejected')
            ->with('user')
            ->orderBy('updated_at', 'desc')
            ->paginate(20);

        return view('admin.teacher-payment-verification.index', [
            'pendingDetails' => $pendingDetails,
            'verifiedDetails' => $verifiedDetails,
            'rejectedDetails' => $rejectedDetails,
        ]);
    }

    /**
     * Display the details of a specific payment detail record.
     */
    public function show(TeacherPaymentDetail $paymentDetail): View
    {
        $paymentDetail->load('user');

        return view('admin.teacher-payment-verification.show', [
            'paymentDetail' => $paymentDetail,
        ]);
    }

    /**
     * Update the verification status of a payment detail record.
     */
    public function updateStatus(Request $request, TeacherPaymentDetail $paymentDetail)
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:verified,rejected'],
            'admin_notes' => ['nullable', 'string', 'max:500'],
        ]);


        $paymentDetail->update([
            'status' => $validated['status'],
            'is_verified' => $validated['status'] === 'verified',
        ]);


        if (isset($validated['admin_notes'])) {
            $accountDetails = json_decode($paymentDetail->account_details, true) ?: [];
            $accountDetails['admin_notes'] = $validated['admin_notes'];
            $paymentDetail->update([
                'account_details' => json_encode($accountDetails),
            ]);
        }

        $statusMessage = $validated['status'] === 'verified' ? 'verified' : 'rejected';

        return redirect()->route('admin.teacher-payment-verification.index')
            ->with('success', "Teacher payment details have been {$statusMessage} successfully.");
    }
}
