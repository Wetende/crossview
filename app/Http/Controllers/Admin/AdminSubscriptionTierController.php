<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionTier;
use App\Http\Requests\Admin\StoreSubscriptionTierRequest;
use App\Http\Requests\Admin\UpdateSubscriptionTierRequest;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;

final class AdminSubscriptionTierController extends Controller
{
    public function index(): View
    {
        $tiers = SubscriptionTier::withTrashed()->orderBy('level')->paginate(10);
        return view('admin.subscription-tiers.index', compact('tiers'));
    }


    public function create(): View
    {
        return view('admin.subscription-tiers.create');
    }


    public function store(StoreSubscriptionTierRequest $request): RedirectResponse
    {
        $validatedData = $request->validated();



        SubscriptionTier::create($validatedData);

        return redirect()->route('admin.subscription-tiers.index')
                         ->with('success', 'Subscription tier created successfully.');
    }


    public function show(SubscriptionTier $subscriptionTier): View
    {
        return view('admin.subscription-tiers.show', compact('subscriptionTier'));
    }


    public function edit(SubscriptionTier $subscriptionTier): View
    {
        return view('admin.subscription-tiers.edit', compact('subscriptionTier'));
    }


    public function update(UpdateSubscriptionTierRequest $request, SubscriptionTier $subscriptionTier): RedirectResponse
    {
        $validatedData = $request->validated();



        $subscriptionTier->update($validatedData);

        return redirect()->route('admin.subscription-tiers.index')
                         ->with('success', 'Subscription tier updated successfully.');
    }


    public function destroy(SubscriptionTier $subscriptionTier): RedirectResponse
    {
        $subscriptionTier->delete();
        return redirect()->route('admin.subscription-tiers.index')
                         ->with('success', 'Subscription tier soft deleted successfully.');
    }
}
