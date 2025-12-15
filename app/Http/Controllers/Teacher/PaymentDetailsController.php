<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\TeacherPaymentDetail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Illuminate\View\View;

final class PaymentDetailsController extends Controller
{
    /**
     * Display the payment details form.
     */
    public function index(): View
    {
        $user = Auth::user();
        $paymentDetail = TeacherPaymentDetail::where('user_id', $user->id)->first();

        return view('teacher.payment-details.index', [
            'paymentDetail' => $paymentDetail,
        ]);
    }

    /**
     * Store a newly created payment detail in storage.
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        $validated = $this->validatePaymentDetails($request);


        $accountDetails = $this->parseAccountDetails($request, $validated['payment_method']);


        TeacherPaymentDetail::create([
            'user_id' => $user->id,
            'payment_method' => $validated['payment_method'],
            'account_details' => json_encode($accountDetails),
            'is_verified' => false,
            'status' => 'pending',
        ]);

        return redirect()->route('teacher.payment-details.index')
            ->with('success', 'Payment details have been submitted successfully and are pending verification.');
    }

    /**
     * Update the specified payment detail in storage.
     */
    public function update(Request $request, TeacherPaymentDetail $paymentDetail)
    {

        if ($paymentDetail->user_id !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $this->validatePaymentDetails($request);


        $accountDetails = $this->parseAccountDetails($request, $validated['payment_method']);


        $paymentDetail->update([
            'payment_method' => $validated['payment_method'],
            'account_details' => json_encode($accountDetails),
            'is_verified' => false,
            'status' => 'pending',
        ]);

        return redirect()->route('teacher.payment-details.index')
            ->with('success', 'Payment details have been updated successfully and are pending verification.');
    }

    /**
     * Validate the payment details request.
     */
    private function validatePaymentDetails(Request $request): array
    {
        return $request->validate([
            'payment_method' => ['required', 'string', Rule::in(['bank_transfer', 'mobile_money', 'paypal'])],
        ]);
    }

    /**
     * Parse and validate the account details based on payment method.
     *
     * @throws ValidationException If validation fails
     */
    private function parseAccountDetails(Request $request, string $paymentMethod): array
    {
        $accountDetails = [];

        switch ($paymentMethod) {
            case 'bank_transfer':
                $validator = Validator::make($request->all(), [
                    'bank_name' => 'required|string|max:255',
                    'account_number' => 'required|string|min:10|max:20',
                    'account_holder_name' => 'required|string|max:255',
                    'bank_code' => 'required|string|max:50',
                ]);

                if ($validator->fails()) {
                    throw ValidationException::withMessages($validator->errors()->toArray());
                }

                $accountDetails = [
                    'bank_name' => $request->input('bank_name'),
                    'account_number' => $request->input('account_number'),
                    'account_holder_name' => $request->input('account_holder_name'),
                    'bank_code' => $request->input('bank_code'),
                ];


                if (strtolower($request->input('account_holder_name')) !== strtolower(Auth::user()->name)) {
                    $accountDetails['warning'] = 'Account holder name does not match your profile name.';
                }
                break;

            case 'mobile_money':
                $validator = Validator::make($request->all(), [
                    'phone_number' => 'required|string|regex:/^\+256[0-9]{9}$/',
                    'provider' => 'required|string|in:mtn,airtel',
                    'account_name' => 'required|string|max:255',
                ]);

                if ($validator->fails()) {
                    throw ValidationException::withMessages($validator->errors()->toArray());
                }

                $accountDetails = [
                    'phone_number' => $request->input('phone_number'),
                    'provider' => $request->input('provider'),
                    'account_name' => $request->input('account_name'),
                ];


                if (strtolower($request->input('account_name')) !== strtolower(Auth::user()->name)) {
                    $accountDetails['warning'] = 'Account name does not match your profile name.';
                }
                break;

            case 'paypal':
                $validator = Validator::make($request->all(), [
                    'paypal_email' => 'required|email|max:255',
                ]);

                if ($validator->fails()) {
                    throw ValidationException::withMessages($validator->errors()->toArray());
                }

                $accountDetails = [
                    'paypal_email' => $request->input('paypal_email'),
                ];
                break;
        }

        return $accountDetails;
    }
}
