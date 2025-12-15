<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionTier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;

final class SubscriptionTierController extends Controller
{
    /**
     * Display a listing of the subscription tiers.
     */
    public function index(): View
    {
        $subscriptionTiers = SubscriptionTier::orderBy('level')->get();
        return view('admin.subscription-tiers.index', compact('subscriptionTiers'));
    }

    /**
     * Show the form for creating a new subscription tier.
     */
    public function create(): View
    {
        return view('admin.subscription-tiers.create');
    }

    /**
     * Store a newly created subscription tier in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:subscription_tiers',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'level' => 'required|integer|min:0',
            'duration_days' => 'required|integer|min:0',
            'max_courses' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
            'features' => 'nullable|array',
            'features.*' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }


        $features = array_filter($request->features ?? [], function ($feature) {
            return $feature !== null && !empty(trim((string)$feature));
        });


        SubscriptionTier::create([
            'name' => $request->name,
            'description' => $request->description,
            'price' => $request->price,
            'level' => $request->level,
            'duration_days' => $request->duration_days,
            'max_courses' => $request->max_courses,
            'is_active' => $request->has('is_active'),
            'features' => $features,
        ]);

        return redirect()->route('admin.subscription-tiers.index')
            ->with('success', 'Subscription tier created successfully.');
    }

    /**
     * Show the form for editing the specified subscription tier.
     */
    public function edit(SubscriptionTier $subscriptionTier): View
    {
        return view('admin.subscription-tiers.edit', compact('subscriptionTier'));
    }

    /**
     * Update the specified subscription tier in storage.
     */
    public function update(Request $request, SubscriptionTier $subscriptionTier): RedirectResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:subscription_tiers,name,' . $subscriptionTier->id,
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'level' => 'required|integer|min:0',
            'duration_days' => 'required|integer|min:0',
            'max_courses' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
            'features' => 'nullable|array',
            'features.*' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }


        $features = array_filter($request->features ?? [], function ($feature) {
            return $feature !== null && !empty(trim((string)$feature));
        });


        $subscriptionTier->update([
            'name' => $request->name,
            'description' => $request->description,
            'price' => $request->price,
            'level' => $request->level,
            'duration_days' => $request->duration_days,
            'max_courses' => $request->max_courses,
            'is_active' => $request->has('is_active'),
            'features' => $features,
        ]);

        return redirect()->route('admin.subscription-tiers.index')
            ->with('success', 'Subscription tier updated successfully.');
    }

    /**
     * Remove the specified subscription tier from storage.
     */
    public function destroy(SubscriptionTier $subscriptionTier): RedirectResponse
    {
        Log::debug('Attempting to delete subscription tier: ' . $subscriptionTier->id);

        try {

            $hasAnySubscriptions = $subscriptionTier->userSubscriptions()->exists();
            Log::debug('Has any subscriptions (including inactive/deleted): ' . ($hasAnySubscriptions ? 'Yes' : 'No'));

            if ($hasAnySubscriptions) {

                $hasActiveSubscriptions = $subscriptionTier->userSubscriptions()->currentlyActive()->exists();
                Log::debug('Has active subscriptions: ' . ($hasActiveSubscriptions ? 'Yes' : 'No'));

                if ($hasActiveSubscriptions) {
                    Log::debug('Delete blocked: Tier has active subscriptions');
                    return redirect()->route('admin.subscription-tiers.index')
                        ->with('error', 'Cannot delete this subscription tier as there are active subscriptions using it.');
                }
            }


            $subscriptionTier->delete();
            Log::debug('Subscription tier deleted successfully');

            return redirect()->route('admin.subscription-tiers.index')
                ->with('success', 'Subscription tier deleted successfully.');

        } catch (\Exception $e) {
            Log::error('Error deleting subscription tier: ' . $e->getMessage(), [
                'tier_id' => $subscriptionTier->id,
                'exception' => $e
            ]);

            return redirect()->route('admin.subscription-tiers.index')
                ->with('error', 'An error occurred while deleting the subscription tier. Please try again or contact support if the issue persists.');
        }
    }

    /**
     * Toggle the active status of the specified subscription tier.
     */
    public function toggleStatus(SubscriptionTier $subscriptionTier): RedirectResponse
    {
        $subscriptionTier->is_active = !$subscriptionTier->is_active;
        $subscriptionTier->save();

        $status = $subscriptionTier->is_active ? 'activated' : 'deactivated';
        return redirect()->route('admin.subscription-tiers.index')
            ->with('success', "Subscription tier {$status} successfully.");
    }

    /**
     * Update the global annual discount percentage.
     */
    public function updateDiscount(Request $request): RedirectResponse
    {
        $validator = Validator::make($request->all(), [
            'annual_discount' => 'required|numeric|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        try {

            $path = base_path('.env');
            if (file_exists($path)) {

                $content = file_get_contents($path);


                if (strpos($content, 'APP_ANNUAL_DISCOUNT=') !== false) {

                    $content = preg_replace(
                        '/^APP_ANNUAL_DISCOUNT=.*/m',
                        'APP_ANNUAL_DISCOUNT=' . $request->annual_discount,
                        $content
                    );
                } else {

                    $content .= "\nAPP_ANNUAL_DISCOUNT=" . $request->annual_discount . "\n";
                }


                file_put_contents($path, $content);


                Artisan::call('config:clear');
                Artisan::call('config:cache');


                config(['app.annual_discount' => $request->annual_discount]);
            }

            return redirect()->route('admin.subscription-tiers.index')
                ->with('success', 'Annual discount percentage updated to ' . $request->annual_discount . '%');
        } catch (\Exception $e) {
            return redirect()->route('admin.subscription-tiers.index')
                ->with('error', 'Error updating discount: ' . $e->getMessage());
        }
    }

    /**
     * Get the current annual discount percentage.
     */
    public function getDiscount()
    {
        $discountPercentage = (int)config('app.annual_discount', 30);
        return response()->json([
            'discount' => $discountPercentage,
        ]);
    }
}
