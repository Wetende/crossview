<x-dashboard-layout :title="__('Calendar for :childName', ['childName' => $child->name])">
    <x-slot name="sidebar">
        @include('layouts.partials.parent.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.parent.header')
    </x-slot>

    @push('styles')
        <link rel="stylesheet" href="{{ asset('css/vendors/fullcalendar.css') }}">  {{-- Adjust path if necessary --}}
        <style>
            .fc .fc-toolbar.fc-header-toolbar {
                margin-bottom: 1.5em;
                display: flex;
                flex-wrap: wrap;
                justify-content: space-between;
            }
            .fc .fc-toolbar-title {
                font-size: 1.75em;
            }
            .fc .fc-button {
                font-size: 0.9em;
            }
            .fc-event {
                cursor: default; /* Make events not look clickable if no action is set */
            }
        </style>
    @endpush

    <div class="dashboard__content bg-light-4">
        <div class="row y-gap-20 justify-between items-end pb-30 mb-10">
            <div class="col-auto">
                <h1 class="text-30 lh-12 fw-700">{{ __('Calendar for :childName', ['childName' => $child->name]) }}</h1>
                <div class="mt-10">{{ __('View upcoming events and deadlines for your child.') }}</div>
            </div>
             <div class="col-auto d-flex items-center">
                <a href="{{ route('parent.child-progress') }}" class="button -md -light-3 -dark-bg-dark-3 text-dark-1 -dark-text-white">{{ __('Back to Child Progress') }}</a>
            </div>
        </div>

        <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
            <div id="calendar" class="fc-calendar"></div>
        </div>
    </div>

    @push('scripts')
        <script src="{{ asset('js/vendors/fullcalendar.js') }}"></script> {{-- Adjust path if necessary --}}
        <script>
            document.addEventListener('DOMContentLoaded', function() {
                var calendarEl = document.getElementById('calendar');
                var calendar = new FullCalendar.Calendar(calendarEl, {
                    initialView: 'dayGridMonth',
                    headerToolbar: {
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
                    },
                    events: "{{ route('parent.child.calendar.events', ['child' => $child->id]) }}",
                    editable: false, // Parent cannot edit events
                    selectable: false,
                    dayMaxEvents: true, // when too many events in a day, show the popover
                    eventDisplay: 'block',
                    // You can customize event rendering further if needed
                    // eventContent: function(arg) { ... }
                });
                calendar.render();
            });
        </script>
    @endpush

</x-dashboard-layout> 