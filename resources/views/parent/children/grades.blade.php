<x-dashboard-layout :title="__('Grades for :childName', ['childName' => $child->name])">
    <x-slot name="header">
        @include('layouts.partials.parent.header')
    </x-slot>

    <x-slot name="sidebar">
        @include('layouts.partials.parent.sidebar')
    </x-slot>

    <div class="dashboard__content bg-light-4">
        <div class="row y-gap-20 justify-between items-end pb-30 mb-10">
            <div class="col-auto">
                <h1 class="text-30 lh-12 fw-700">{{ __('Grades for :childName', ['childName' => $child->name]) }}</h1>
                <div class="mt-10">{{ __('View academic performance and grades for your child.') }}</div>
            </div>
            <div class="col-auto d-flex items-center">
                <a href="{{ route('parent.child-progress') }}" class="button -md -light-3 -dark-bg-dark-3 text-dark-1 -dark-text-white">{{ __('Back to Child Progress') }}</a>
            </div>
        </div>

        @if($coursesWithGrades && $coursesWithGrades->count() > 0)
            <div class="row y-gap-30">
                @foreach($coursesWithGrades as $courseData)
                    <div class="col-12">
                        <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                            <div class="d-flex items-center justify-between py-20 px-30 border-bottom-light">
                                <h2 class="text-17 lh-1 fw-500">{{ $courseData->title ?? __('@lmsterm('Study Material') Title Missing') }}</h2>
                                <div class="d-flex items-center">
                                    <span class="text-14 text-light-1 mr-10">{{ __('Overall Grade:') }}</span>
                                    <span class="text-16 fw-500 text-purple-1">{{ $courseData->overall_grade ?? __('N/A') }}</span>
                                </div>
                            </div>
                            <div class="py-30 px-30">
                                @if(!empty($courseData->items) && count($courseData->items) > 0)
                                    <div class="overflow-hidden">
                                        <table class="table w-1/1">
                                            <thead class="text-14 fw-500 bg-light-3 -dark-bg-dark-2">
                                                <tr>
                                                    <th>{{ __('Gradable Item') }}</th>
                                                    <th class="text-center">{{ __('Type') }}</th>
                                                    <th class="text-center">{{ __('Score') }}</th>
                                                </tr>
                                            </thead>
                                            <tbody class="text-14">
                                                @foreach($courseData->items as $item)
                                                    <tr class="border-bottom-light">
                                                        <td>{{ $item->title ?? __('Item Title Missing') }}</td>
                                                        <td class="text-center"><span class="badge bg-light-7 -dark-bg-dark-2 text-dark-1">{{ $item->type ?? __('N/A') }}</span></td>
                                                        <td class="text-center fw-500">
                                                            {{ $item->score ?? '-' }}
                                                            @if(isset($item->max_score) && !is_null($item->max_score))
                                                                / {{ $item->max_score }}
                                                            @endif
                                                        </td>
                                                    </tr>
                                                @endforeach
                                            </tbody>
                                        </table>
                                    </div>
                                @else
                                    <div class="text-center py-20">
                                        <i class="icon-list text-40 lh-1 text-light-5"></i>
                                        <p class="mt-10 text-14 text-light-1">{{ __('No individual grade items available for this course yet.') }}</p>
                                    </div>
                                @endif
                            </div>
                        </div>
                    </div>
                @endforeach
            </div>
            {{-- Pagination for courses if this list itself becomes paginated --}}
            {{-- @if ($coursesWithGrades instanceof \Illuminate\Pagination\LengthAwarePaginator)
                <div class="row justify-center pt-30">
                    <div class="col-auto">
                        {{ $coursesWithGrades->links('vendor.pagination.default') }}
                    </div>
                </div>
            @endif --}}
        @else
            <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                <div class="text-center py-40">
                    <img src="{{ asset('img/dashboard/empty-state/grades.svg') }}" alt="{{ __('No Grades Available') }}" style="max-width: 200px;" class="mb-20">
                    <h4 class="text-18 fw-500 mb-10">{{ __('No Grades Available for :childName', ['childName' => $child->name]) }}</h4>
                    <p class="text-14 mb-20">{{ __('There are currently no grades to display for this child, or they are not enrolled in any courses with published grades.') }}</p>
                </div>
            </div>
        @endif
    </div>
</x-dashboard-layout> 