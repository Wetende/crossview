<x-dashboard-layout>
    <x-slot name="title">My Calendar</x-slot>

    {{-- Additional CSS for FullCalendar (if not globally included) --}}
    @push('styles')
        {{-- <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/fullcalendar@5.11.0/main.min.css" integrity="sha256-5JCT9H71GgYVbEUqNPq2L1PK0Bf_h/1M0a7XpGqA8yM=" crossorigin="anonymous"> --}}
        <link href='{{ asset("css/fullcalendar.css") }}' rel='stylesheet' /> {{-- Assuming local asset --}}
        <style>
            /* You might need some minor style adjustments for Crossview College theme integration */
            .fc .fc-button-primary {
                background-color: #7752FE; /* Crossview College purple */
                border-color: #7752FE;
            }
            .fc .fc-button-primary:hover {
                background-color: #5c3cce;
                border-color: #5c3cce;
            }
            .fc-event {
                cursor: pointer;
            }
        </style>
    @endpush

    <x-slot name="sidebar">
        @include('layouts.partials.student.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.student.header')
    </x-slot>

    <div class="dashboard__content bg-light-4">
        <div class="row y-gap-20 justify-between items-end pb-30 mb-10">
            <div class="col-auto">
                <h1 class="text-30 lh-12 fw-700">My Calendar</h1>
                <div class="mt-10">Track your course schedules, assignments, and important dates</div>
            </div>
        </div>

        <div class="row y-gap-30">
            <div class="col-12">
                <div class="py-30 px-30 rounded-8 bg-white -dark-bg-dark-1 shadow-4">
                    <div id="calendar" class="h-600"></div> {{-- Ensure height is set --}}
                </div>
            </div>
        </div>
    </div>

    @push('scripts')
        {{-- <script src="https://cdn.jsdelivr.net/npm/fullcalendar@5.11.0/main.min.js" integrity="sha256-XUPDNLClURgP6wXJyzRJclTbIt5VgrGxtKvG0VNO2BY=" crossorigin="anonymous"></script> --}}
        <script src='{{ asset("js/fullcalendar.js") }}'></script> {{-- Assuming local asset --}}
        <script>
            document.addEventListener('DOMContentLoaded', function() {
                var calendarEl = document.getElementById('calendar');
                if (calendarEl) {
                    var calendar = new FullCalendar.Calendar(calendarEl, {
                        initialView: 'dayGridMonth',
                        headerToolbar: {
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
                        },
                        events: '{{ route("student.calendar.events") }}', // AJAX route to fetch events
                        editable: false, // Student probably shouldn't drag events
                        selectable: true, // Allow selecting dates for potential personal event creation
                        select: function(info) {
                            // console.log('Selected: ' + info.startStr + ' to ' + info.endStr);
                            // Potentially open a modal to add a personal event
                            // For now, just log to console or alert
                            // alert('Selected period: ' + info.startStr + ' to ' + info.endStr);
                        },
                        eventClick: function(info) {
                            // info.jsEvent.preventDefault(); // prevent browser from navigating
                            // if (info.event.url) {
                            //    window.open(info.event.url, "_blank");
                            // }
                            // For now, just alert event title or log to console
                            alert('Event: ' + info.event.title);
                            console.log(info.event);
                        },
                        // Add other FullCalendar options as needed
                        // Example: customize event rendering
                        // eventContent: function(arg) {
                        //     let italicEl = document.createElement('i')
                        //     italicEl.innerHTML = arg.event.title
                        //     let arrayOfDomNodes = [ italicEl ]
                        //     return { domNodes: arrayOfDomNodes }
                        // }
                    });
                    calendar.render();
                }
            });
        </script>
    @endpush

</x-dashboard-layout> 