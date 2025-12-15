<x-dashboard-layout>
    <x-slot name="sidebar">
        @include('layouts.partials.admin.sidebar')
    </x-slot>
    
    <x-slot name="header">
        @include('layouts.partials.admin.header')
    </x-slot>

    <div class="dashboard__content bg-light-4">
        <div class="row y-gap-20 justify-between items-end pb-30 mb-10">
            <div class="col-auto">
                <h1 class="text-30 lh-12 fw-700">Subscription Tiers</h1>
                <div class="mt-10">Manage your subscription plans and pricing options.</div>
            </div>
            <div class="col-auto">
                <a href="{{ route('admin.subscription-tiers.create') }}" class="button -md -purple-1 text-white">
                    <i class="icon-plus mr-10"></i> Add New Tier
                </a>
            </div>
        </div>

        <!-- Annual Discount Configuration -->
        <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4 mb-30">
            <h2 class="text-20 lh-1 fw-500">Annual Subscription Discount</h2>
            <p class="mt-10">Set the discount percentage for annual subscriptions compared to monthly billing.</p>
            
            <form action="{{ route('admin.subscription-tiers.update-discount') }}" method="POST" class="row y-gap-20 pt-30">
                @csrf
                <div class="col-lg-6">
                    <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="annual_discount">Discount Percentage (%)</label>
                    <div class="input-group">
                        <input type="number" class="form-control @error('annual_discount') is-invalid @enderror" 
                               id="annual_discount" name="annual_discount" min="0" max="100" step="1"
                               value="{{ config('app.annual_discount', 30) }}">
                        <span class="input-group-text">%</span>
                    </div>
                    <div class="text-14 lh-1 mt-5 text-light-1">This will update globally across the site.</div>
                    @error('annual_discount')
                        <div class="text-red-1 mt-1">{{ $message }}</div>
                    @enderror
                </div>
                <div class="col-lg-12 mt-20">
                    <button type="submit" class="button -md -purple-1 text-white">
                        <i class="icon-check mr-10"></i> Update Discount
                    </button>
                </div>
            </form>
        </div>

        <!-- Status Messages -->
        @if(session('success'))
            <div class="alert-success p-20 rounded-8 mb-30">
                {{ session('success') }}
            </div>
        @endif

        @if(session('error'))
            <div class="alert-error p-20 rounded-8 mb-30">
                <strong>Error:</strong> {{ session('error') }}
            </div>
        @endif

        <!-- Subscription Tiers Table -->
        <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
            <div class="overflow-scroll scroll-bar-1">
                <table class="table w-1/1">
                    <thead class="text-14 fw-500 bg-light-3 -dark-bg-dark-2">
                        <tr>
                            <th>Name</th>
                            <th>Price</th>
                            <th>Level</th>
                            <th>Duration</th>
                            <th>Max Courses</th>
                            <th>Status</th>
                            <th class="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="text-14">
                        @forelse($subscriptionTiers as $tier)
                            <tr class="border-bottom-light">
                                <td class="fw-500">{{ $tier->name }}</td>
                                <td>{{ $tier->price }} UGX</td>
                                <td>{{ $tier->level }}</td>
                                <td>
                                    @if($tier->duration_days > 0)
                                        {{ $tier->duration_days }} days
                                    @else
                                        Unlimited
                                    @endif
                                </td>
                                <td>
                                    @if($tier->max_courses)
                                        {{ $tier->max_courses }}
                                    @else
                                        Unlimited
                                    @endif
                                </td>
                                <td>
                                    <div class="d-inline-block">
                                        <div class="badge {{ $tier->is_active ? 'bg-green-1 text-white' : 'bg-red-1 text-white' }}">
                                            {{ $tier->is_active ? 'Active' : 'Inactive' }}
                                        </div>
                                    </div>
                                </td>
                                <td class="text-right">
                                    <div class="d-flex items-center justify-end x-gap-10">
                                        <a href="{{ route('admin.subscription-tiers.edit', $tier) }}" 
                                           class="button -sm -outline-purple-1 text-purple-1" 
                                           title="Edit Tier">
                                            <i class="icon-edit text-14"></i>
                                            <span class="ml-5 sm:d-none">Edit</span>
                                        </a>
                                        
                                        <form action="{{ route('admin.subscription-tiers.toggle-status', $tier) }}" method="POST" class="d-inline">
                                            @csrf
                                            @method('PUT')
                                            @if($tier->is_active)
                                                <button type="submit" class="button -sm -outline-red-1 text-red-1" title="Deactivate Tier">
                                                    <i class="icon-ban text-14"></i>
                                                    <span class="ml-5 sm:d-none">Deactivate</span>
                                                </button>
                                            @else
                                                <button type="submit" class="button -sm -outline-green-1 text-green-1" title="Activate Tier">
                                                    <i class="icon-check text-14"></i>
                                                    <span class="ml-5 sm:d-none">Activate</span>
                                                </button>
                                            @endif
                                        </form>
                                        
                                        @php
                                            $hasActiveSubscriptions = $tier->userSubscriptions()->currentlyActive()->exists();
                                        @endphp
                                        
                                        <form action="{{ route('admin.subscription-tiers.destroy', $tier) }}" method="POST" class="d-inline delete-form">
                                            @csrf
                                            @method('DELETE')
                                            <button type="submit" 
                                                class="button -sm {{ $hasActiveSubscriptions ? '-light-3 text-light-1' : '-red-1 text-white' }}" 
                                                title="{{ $hasActiveSubscriptions ? 'Cannot delete: Tier has active subscriptions' : 'Delete Tier' }}"
                                                {{ $hasActiveSubscriptions ? 'disabled' : '' }}>
                                                <i class="icon-trash-2 text-14"></i>
                                                <span class="ml-5 sm:d-none">Delete</span>
                                            </button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="7" class="text-center py-30">No subscription tiers found.</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    @push('scripts')
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Enhanced confirmation for delete forms
            const deleteForms = document.querySelectorAll('.delete-form');
            deleteForms.forEach(form => {
                form.addEventListener('submit', function(event) {
                    event.preventDefault(); // Always prevent default initially
                    
                    const confirmed = confirm('Are you sure you want to delete this subscription tier? This action cannot be undone.');
                    
                    if (confirmed) {
                        // If user confirms, manually submit the form
                        this.submit();
                    }
                });
            });
        });
    </script>
    @endpush
</x-dashboard-layout> 