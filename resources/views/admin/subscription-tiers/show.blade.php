<x-dashboard-layout :title="'View Subscription Tier - ' . $subscriptionTier->name">
    <x-slot name="sidebar">
        @include('layouts.partials.admin.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.admin.header')
    </x-slot>

    <div class="dashboard__content bg-light-4">
        <div class="row y-gap-20 justify-between items-end pb-30 mb-10">
            <div class="col-auto">
                <h1 class="text-30 lh-12 fw-700">Subscription Tier: {{ $subscriptionTier->name }}</h1>
            </div>
            <div class="col-auto">
                <a href="{{ route('admin.subscription-tiers.index') }}" class="button -md -light-3 text-dark-1">
                    <i class="icon-arrow-left mr-10"></i>
                    Back to List
                </a>
                <a href="{{ route('admin.subscription-tiers.edit', $subscriptionTier->id) }}" class="button -md -purple-1 text-white ml-10">
                    <i class="icon-edit mr-10"></i> 
                    Edit Tier
                </a>
            </div>
        </div>

        <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
            <h2 class="text-20 lh-1 fw-500 mb-30">Tier Details</h2>
            
            <div class="overflow-hidden">
                <table class="table w-1/1 -striped -border">
                    <tbody>
                        <tr>
                            <td class="text-14 fw-500 text-dark-1" style="width: 25%;">ID</td>
                            <td class="text-14">{{ $subscriptionTier->id }}</td>
                        </tr>
                        <tr>
                            <td class="text-14 fw-500 text-dark-1">Name</td>
                            <td class="text-14">{{ $subscriptionTier->name }}</td>
                        </tr>
                        <tr>
                            <td class="text-14 fw-500 text-dark-1">Description</td>
                            <td class="text-14">{!! nl2br(e($subscriptionTier->description)) ?: '<span class="text-light-1">N/A</span>' !!}</td>
                        </tr>
                        <tr>
                            <td class="text-14 fw-500 text-dark-1">Price</td>
                            <td class="text-14">{{ config('app.currency_symbol', '$') }}{{ number_format($subscriptionTier->price, 2) }}</td>
                        </tr>
                        <tr>
                            <td class="text-14 fw-500 text-dark-1">Level (Hierarchy)</td>
                            <td class="text-14">{{ $subscriptionTier->level }}</td>
                        </tr>
                        <tr>
                            <td class="text-14 fw-500 text-dark-1">Duration</td>
                            <td class="text-14">{{ $subscriptionTier->duration_days == 0 ? 'Unlimited' : $subscriptionTier->duration_days . ' days' }}</td>
                        </tr>
                        <tr>
                            <td class="text-14 fw-500 text-dark-1">Max Courses</td>
                            <td class="text-14">{{ $subscriptionTier->max_courses ?? 'Unlimited' }}</td>
                        </tr>
                        <tr>
                            <td class="text-14 fw-500 text-dark-1">Features</td>
                            <td class="text-14">
                                @if($subscriptionTier->features && count($subscriptionTier->features) > 0)
                                    <ul class="list-disc pl-20">
                                        @foreach($subscriptionTier->features as $feature)
                                            <li>{{ $feature }}</li>
                                        @endforeach
                                    </ul>
                                @else
                                    <span class="text-light-1">N/A</span>
                                @endif
                            </td>
                        </tr>
                        <tr>
                            <td class="text-14 fw-500 text-dark-1">Active</td>
                            <td class="text-14">
                                @if ($subscriptionTier->is_active)
                                    <span class="badge bg-green-1 text-white">Yes</span>
                                @else
                                    <span class="badge bg-red-1 text-white">No</span>
                                @endif
                            </td>
                        </tr>
                         <tr>
                            <td class="text-14 fw-500 text-dark-1">Status</td>
                            <td class="text-14">
                                @if ($subscriptionTier->trashed())
                                    <span class="badge bg-orange-1 text-white">Soft Deleted</span>
                                @else
                                    <span class="badge bg-blue-1 text-white">Visible</span>
                                @endif
                            </td>
                        </tr>
                        <tr>
                            <td class="text-14 fw-500 text-dark-1">Created At</td>
                            <td class="text-14">{{ $subscriptionTier->created_at->format('M d, Y H:i:s') }}</td>
                        </tr>
                        <tr>
                            <td class="text-14 fw-500 text-dark-1">Updated At</td>
                            <td class="text-14">{{ $subscriptionTier->updated_at->format('M d, Y H:i:s') }}</td>
                        </tr>
                         @if ($subscriptionTier->trashed())
                        <tr>
                            <td class="text-14 fw-500 text-dark-1">Deleted At</td>
                            <td class="text-14">{{ $subscriptionTier->deleted_at->format('M d, Y H:i:s') }}</td>
                        </tr>
                        @endif
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</x-dashboard-layout> 