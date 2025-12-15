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
                <h1 class="text-30 lh-12 fw-700">Badges</h1>
                <div class="mt-10">Manage gamification badges for your platform.</div>
            </div>
            <div class="col-auto">
                <a href="{{ route('admin.badges.create') }}" class="button -md -purple-1 text-white">
                    <i class="icon-plus mr-8"></i>
                    Create Badge
                </a>
            </div>
        </div>

        @if(session('success'))
            <div class="alert -success mb-30">
                <div class="alert__content">{{ session('success') }}</div>
            </div>
        @endif
        
        @if(session('error'))
            <div class="alert -error mb-30">
                <div class="alert__content">{{ session('error') }}</div>
            </div>
        @endif

        <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
            <div class="d-flex items-center justify-between">
                <h2 class="text-20 lh-1 fw-500">All Badges</h2>
            </div>

            @if($badges->count() > 0)
                <div class="overflow-scroll scroll-bar-1 mt-30">
                    <table class="table w-1/1">
                        <thead class="text-14 fw-500 bg-light-3 -dark-bg-dark-2">
                            <tr>
                                <th class="p-10">Badge</th>
                                <th class="p-10">Name</th>
                                <th class="p-10">Description</th>
                                <th class="p-10">Points</th>
                                <th class="p-10">Criteria</th>
                                <th class="p-10">Status</th>
                                <th class="p-10 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="text-14">
                            @foreach($badges as $badge)
                                <tr class="border-bottom-light">
                                    <td class="p-10 text-center">
                                        @if($badge->icon_url)
                                            <img src="{{ $badge->icon_url }}" alt="{{ $badge->name }}" class="size-50">
                                        @else
                                            <div class="bg-light-3 d-flex items-center justify-center size-50 rounded-8">
                                                <i class="icon-award text-18"></i>
                                            </div>
                                        @endif
                                    </td>
                                    <td class="p-10 fw-500">{{ $badge->name }}</td>
                                    <td class="p-10">{{ Str::limit($badge->description, 50) }}</td>
                                    <td class="p-10">{{ $badge->points }}</td>
                                    <td class="p-10">
                                        <span class="badge bg-light-3">{{ $badge->criteria_type }}</span>
                                        <span class="text-14 fw-500 ml-5">{{ $badge->criteria_value }}</span>
                                    </td>
                                    <td class="p-10">
                                        @if($badge->is_active)
                                            <span class="badge bg-green-1 text-white">Active</span>
                                        @else
                                            <span class="badge bg-light-5 text-dark-1">Inactive</span>
                                        @endif
                                    </td>
                                    <td class="p-10 text-center">
                                        <div class="d-flex items-center justify-center gap-10">
                                            <a href="{{ route('admin.badges.edit', $badge) }}" class="flex-center bg-light-2 -dark-bg-dark-3 size-35 rounded-8" title="Edit">
                                                <i class="icon-edit text-16 text-purple-1"></i>
                                            </a>
                                            <a href="{{ route('admin.badges.show', $badge) }}" class="flex-center bg-light-2 -dark-bg-dark-3 size-35 rounded-8" title="View">
                                                <i class="icon-eye text-16 text-purple-1"></i>
                                            </a>
                                            <form action="{{ route('admin.badges.destroy', $badge) }}" method="POST" class="d-inline" onsubmit="return confirm('Are you sure you want to delete this badge?');">
                                                @csrf
                                                @method('DELETE')
                                                <button type="submit" class="flex-center bg-light-2 -dark-bg-dark-3 size-35 rounded-8" title="Delete">
                                                    <i class="icon-trash text-16 text-red-1"></i>
                                                </button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
                
                <div class="mt-30">
                    {{ $badges->links() }}
                </div>
            @else
                <div class="text-center py-40">
                    <div class="mb-20">
                        <img src="{{ asset('img/dashboard/empty-state/badges.svg') }}" alt="No Badges" style="max-width: 200px;" class="mb-20">
                    </div>
                    <h4 class="text-18 fw-500 mb-10">No Badges Found</h4>
                    <p class="text-14 mb-20">Create badges to encourage user engagement and achievement.</p>
                    <a href="{{ route('admin.badges.create') }}" class="button -md -purple-1 text-white">Create First Badge</a>
                </div>
            @endif
        </div>
    </div>
</x-dashboard-layout> 