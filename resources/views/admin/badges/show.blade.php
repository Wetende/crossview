<x-dashboard-layout>
    <x-slot name="sidebar">
        @include('layouts.partials.admin.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.admin.header')
    </x-slot>

    <div class="dashboard__content bg-light-4 py-30 px-30">
        <div class="row y-gap-20 justify-between items-end pb-30">
            <div class="col-auto">
                <h1 class="text-30 lh-12 fw-700">Badge Details</h1>
                <div class="mt-10">Viewing details for {{ $badge->name }}</div>
            </div>
            <div class="col-auto">
                <div class="d-flex x-gap-15">
                    <a href="{{ route('admin.badges.edit', $badge) }}" class="button -md -purple-1 text-white">
                        <i class="icon-edit mr-10"></i>
                        Edit Badge
                    </a>
                    <a href="{{ route('admin.badges.index') }}" class="button -md -outline-purple-1 text-purple-1">
                        <i class="icon-arrow-left mr-10"></i>
                        Back to Badges
                    </a>
                </div>
            </div>
        </div>

        <div class="row y-gap-30">
            {{-- Badge information --}}
            <div class="col-lg-8">
                <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <div class="d-flex justify-between items-center border-bottom-light pb-20">
                        <h2 class="text-20 lh-1 fw-500">Badge Information</h2>
                        <span class="badge {{ $badge->is_active ? 'bg-green-1 text-white' : 'bg-light-5 text-dark-1' }}">
                            {{ $badge->is_active ? 'Active' : 'Inactive' }}
                        </span>
                    </div>

                    <div class="row y-gap-30 pt-20">
                        <div class="col-12">
                            <div class="row y-gap-15">
                                <div class="col-12">
                                    <div class="text-16 lh-1 fw-500 text-dark-1 mb-10">Badge Name:</div>
                                    <div>{{ $badge->name }}</div>
                                </div>

                                <div class="col-12">
                                    <div class="text-16 lh-1 fw-500 text-dark-1 mb-10">Slug:</div>
                                    <div>{{ $badge->slug }}</div>
                                </div>

                                <div class="col-12">
                                    <div class="text-16 lh-1 fw-500 text-dark-1 mb-10">Description:</div>
                                    <div>{{ $badge->description }}</div>
                                </div>

                                <div class="col-md-6">
                                    <div class="text-16 lh-1 fw-500 text-dark-1 mb-10">Points:</div>
                                    <div>{{ $badge->points }}</div>
                                </div>

                                <div class="col-md-6">
                                    <div class="text-16 lh-1 fw-500 text-dark-1 mb-10">Criteria Type:</div>
                                    <div>
                                        @if($badge->criteria_type)
                                            {{ ucfirst(str_replace('_', ' ', $badge->criteria_type)) }}
                                        @else
                                            <span class="text-light-1">Not specified</span>
                                        @endif
                                    </div>
                                </div>

                                <div class="col-md-6">
                                    <div class="text-16 lh-1 fw-500 text-dark-1 mb-10">Criteria Value:</div>
                                    <div>
                                        @if($badge->criteria_value)
                                            {{ $badge->criteria_value }}
                                        @else
                                            <span class="text-light-1">Not specified</span>
                                        @endif
                                    </div>
                                </div>

                                <div class="col-md-6">
                                    <div class="text-16 lh-1 fw-500 text-dark-1 mb-10">Created At:</div>
                                    <div>{{ $badge->created_at->format('F j, Y, g:i a') }}</div>
                                </div>

                                <div class="col-md-6">
                                    <div class="text-16 lh-1 fw-500 text-dark-1 mb-10">Updated At:</div>
                                    <div>{{ $badge->updated_at->format('F j, Y, g:i a') }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {{-- Badge icon and stats --}}
            <div class="col-lg-4">
                <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <div class="d-flex justify-between items-center border-bottom-light pb-20">
                        <h2 class="text-20 lh-1 fw-500">Badge Icon</h2>
                    </div>

                    <div class="d-flex flex-column items-center justify-center pt-30">
                        <div class="size-150 rounded-16 d-flex justify-center items-center {{ $badge->icon_path ? '' : 'bg-light-4' }} mb-20">
                            @if($badge->icon_path)
                                <img src="{{ $badge->icon_url }}" alt="{{ $badge->name }}" class="size-120 rounded-8 object-cover">
                            @else
                                <i class="icon-award text-60 text-purple-1"></i>
                            @endif
                        </div>
                    </div>
                </div>

                {{-- Badge stats --}}
                <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4 mt-30">
                    <div class="d-flex justify-between items-center border-bottom-light pb-20">
                        <h2 class="text-20 lh-1 fw-500">Badge Statistics</h2>
                    </div>

                    <div class="row y-gap-20 pt-20">
                        <div class="col-12">
                            <div class="d-flex justify-between">
                                <div class="text-16 fw-500 text-dark-1">Times Awarded:</div>
                                <div class="text-16 fw-500">{{ $badge->userBadges()->count() }}</div>
                            </div>
                        </div>
                        
                        <div class="col-12">
                            <div class="d-flex justify-between">
                                <div class="text-16 fw-500 text-dark-1">Total Points Awarded:</div>
                                <div class="text-16 fw-500">{{ $badge->userBadges()->count() * $badge->points }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</x-dashboard-layout> 