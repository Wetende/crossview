<x-dashboard-layout>
    <x-slot name="header">
        @include('layouts.partials.teacher.header')
    </x-slot>

    <x-slot name="title">Teacher - My Calendar</x-slot>

    <x-slot name="sidebar">
        @include('layouts.partials.teacher.sidebar')
    </x-slot>

    <div class="container px-4 mx-auto py-6">
        <div class="flex flex-col lg:flex-row gap-6">
            <!-- Calendar Section -->
            <div class="lg:w-2/3">
                <div class="bg-white rounded-xl shadow-md overflow-hidden">
                    <!-- Calendar Header -->
                    <div class="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4 flex justify-between items-center">
                        <h2 class="text-xl font-semibold text-white">Teaching Calendar</h2>
                        <div class="flex items-center space-x-2">
                            <button id="todayBtn" class="px-3 py-1 text-sm text-blue-100 bg-blue-500/20 rounded-md hover:bg-blue-500/30 transition">
                                Today
                            </button>
                        </div>
                    </div>
                    
                    <!-- Calendar Toolbar -->
                    <div class="px-6 py-3 border-b flex justify-between items-center">
                        <div class="flex space-x-2">
                            <button id="prevBtn" class="p-2 rounded-md hover:bg-gray-100 transition">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button id="nextBtn" class="p-2 rounded-md hover:bg-gray-100 transition">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                        <h3 id="calendarTitle" class="text-lg font-medium text-gray-700"></h3>
                        <div class="flex space-x-1">
                            <button data-view="dayGridMonth" class="px-3 py-1 text-sm rounded-md bg-blue-100 text-blue-700 font-medium">
                                Month
                            </button>
                            <button data-view="timeGridWeek" class="px-3 py-1 text-sm rounded-md hover:bg-gray-100 text-gray-600 transition">
                                Week
                            </button>
                            <button data-view="timeGridDay" class="px-3 py-1 text-sm rounded-md hover:bg-gray-100 text-gray-600 transition">
                                Day
                            </button>
                        </div>
                    </div>
                    
                    <!-- Calendar Container -->
                    <div class="p-4">
                        <div id="teacherCalendarInstance" class="fc-theme-bootstrap"></div>
                    </div>
                </div>
            </div>
            
            <!-- Event Form Section -->
            <div class="lg:w-1/3">
                <div class="bg-white rounded-xl shadow-md overflow-hidden sticky top-6">
                    <!-- Form Header -->
                    <div class="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                        <h2 class="text-xl font-semibold text-white">Schedule New Event</h2>
                    </div>
                    
                    <!-- Form Content -->
                    <div class="p-6">
                        <form action="{{ route('teacher.calendar.events.store') }}" method="POST" id="eventForm">
                            @csrf
                            
                            <!-- Event Title -->
                            <div class="mb-4">
                                <label for="event_title" class="block text-sm font-medium text-gray-700 mb-1">Event Title*</label>
                                <input type="text" id="event_title" name="title" value="{{ old('title') }}" 
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 @error('title') border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500 @enderror"
                                       placeholder="Lecture, Meeting, etc." required>
                                @error('title')
                                    <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                                @enderror
                            </div>
                            
                            <!-- Date & Time -->
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label for="event_start_time" class="block text-sm font-medium text-gray-700 mb-1">Start*</label>
                                    <input type="datetime-local" id="event_start_time" name="start_time" value="{{ old('start_time') }}"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 @error('start_time') border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500 @enderror"
                                           required>
                                    @error('start_time')
                                        <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                                    @enderror
                                </div>
                                <div>
                                    <label for="event_end_time" class="block text-sm font-medium text-gray-700 mb-1">End</label>
                                    <input type="datetime-local" id="event_end_time" name="end_time" value="{{ old('end_time') }}"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 @error('end_time') border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500 @enderror">
                                    @error('end_time')
                                        <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                                    @enderror
                                </div>
                            </div>
                            
                            <!-- All Day Toggle -->
                            <div class="flex items-center mb-4">
                                <input type="checkbox" id="event_is_all_day" name="is_all_day" value="1" 
                                       class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded @error('is_all_day') border-red-300 text-red-900 focus:ring-red-500 @enderror"
                                       {{ old('is_all_day') ? 'checked' : '' }}>
                                <label for="event_is_all_day" class="ml-2 block text-sm text-gray-700">All Day Event</label>
                                @error('is_all_day')
                                    <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                                @enderror
                            </div>
                            
                            <!-- Description -->
                            <div class="mb-4">
                                <label for="event_description" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea id="event_description" name="description" rows="3"
                                          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 @error('description') border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500 @enderror"
                                          placeholder="Add event details...">{{ old('description') }}</textarea>
                                @error('description')
                                    <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                                @enderror
                            </div>
                            
                            <!-- Course Association -->
                            <div class="mb-6">
                                <label for="event_course_id" class="block text-sm font-medium text-gray-700 mb-1">Associate with Course</label>
                                <select id="event_course_id" name="eventable_id"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 @error('eventable_id') border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500 @enderror">
                                    <option value="">Personal Event</option>
                                    @foreach($courses as $course)
                                        <option value="{{ $course->id }}" {{ old('eventable_id') == $course->id ? 'selected' : '' }}>
                                            {{ $course->title }}
                                        </option>
                                    @endforeach
                                </select>
                                <input type="hidden" name="eventable_type" value="App\Models\Course">
                                @error('eventable_id')
                                    <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                                @enderror
                            </div>
                            
                            <!-- Submit Button -->
                            <button type="submit" class="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Add Event
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>

    @push('scripts')
        <script>
            document.addEventListener('DOMContentLoaded', function() {
                // Initialize calendar
                const calendarEl = document.getElementById('teacherCalendarInstance');
                if (calendarEl) {
                    const calendar = new FullCalendar.Calendar(calendarEl, {
                        initialView: 'dayGridMonth',
                        headerToolbar: false, // Using our custom toolbar
                        height: 'auto',
                        events: {
                            url: '{{ route("teacher.calendar.events.list") }}',
                            failure: function() {
                                // You could use a toast library here
                                console.error('Failed to load calendar events');
                            }
                        },
                        eventDisplay: 'block',
                        editable: true,
                        selectable: true,
                        selectMirror: true,
                        dayMaxEvents: true,
                        select: function(info) {
                            // Format dates for the datetime-local inputs
                            const formatDate = (date) => {
                                return date.toISOString().slice(0, 16);
                            };
                            
                            document.getElementById('event_start_time').value = formatDate(info.start);
                            if (info.end) {
                                document.getElementById('event_end_time').value = formatDate(info.end);
                            }
                            document.getElementById('event_title').focus();
                        },
                        eventClick: function(info) {
                            // You could implement a modal here to show event details
                            console.log('Event clicked:', info.event.title);
                        },
                        datesSet: function(info) {
                            // Update our custom calendar title when view changes
                            const titleEl = document.getElementById('calendarTitle');
                            if (titleEl) {
                                titleEl.textContent = info.view.title;
                            }
                        },
                        eventDidMount: function(info) {
                            // Add tooltips to events
                            if (info.event.extendedProps.description) {
                                info.el.setAttribute('title', info.event.extendedProps.description);
                                info.el.classList.add('cursor-pointer');
                            }
                            
                            // Color events differently based on type
                            if (info.event.extendedProps.eventable_type === 'App\\Models\\Course') {
                                info.el.classList.add('bg-blue-600', 'border-blue-600');
                            } else {
                                info.el.classList.add('bg-green-600', 'border-green-600');
                            }
                        }
                    });
                    
                    calendar.render();
                    
                    // Set initial calendar title
                    document.getElementById('calendarTitle').textContent = calendar.view.title;
                    
                    // Custom toolbar controls
                    document.getElementById('todayBtn').addEventListener('click', function() {
                        calendar.today();
                    });
                    
                    document.getElementById('prevBtn').addEventListener('click', function() {
                        calendar.prev();
                    });
                    
                    document.getElementById('nextBtn').addEventListener('click', function() {
                        calendar.next();
                    });
                    
                    // View switching
                    document.querySelectorAll('[data-view]').forEach(button => {
                        button.addEventListener('click', function() {
                            // Update active state
                            document.querySelectorAll('[data-view]').forEach(btn => {
                                btn.classList.remove('bg-blue-100', 'text-blue-700');
                                btn.classList.add('hover:bg-gray-100', 'text-gray-600');
                            });
                            this.classList.add('bg-blue-100', 'text-blue-700');
                            this.classList.remove('hover:bg-gray-100', 'text-gray-600');
                            
                            // Change view
                            calendar.changeView(this.dataset.view);
                        });
                    });
                    
                    // All day event toggle
                    document.getElementById('event_is_all_day').addEventListener('change', function() {
                        const startInput = document.getElementById('event_start_time');
                        const endInput = document.getElementById('event_end_time');
                        
                        if (this.checked) {
                            startInput.type = 'date';
                            if (endInput.value) endInput.type = 'date';
                        } else {
                            startInput.type = 'datetime-local';
                            if (endInput.value) endInput.type = 'datetime-local';
                        }
                    });
                }
            });
        </script>
    @endpush

    <style>
        /* Custom FullCalendar styles to work with Tailwind */
        .fc-theme-bootstrap {
            border-radius: 0.5rem;
            overflow: hidden;
            border: 1px solid #e5e7eb;
        }
        
        .fc .fc-toolbar.fc-header-toolbar {
            margin-bottom: 0.5em;
        }
        
        .fc .fc-button {
            background-color: #fff;
            border: 1px solid #e5e7eb;
            color: #374151;
            font-weight: 500;
            padding: 0.375rem 0.75rem;
            border-radius: 0.375rem;
        }
        
        .fc .fc-button-primary:not(:disabled).fc-button-active {
            background-color: #3b82f6;
            color: white;
        }
        
        .fc .fc-button-primary:not(:disabled):hover {
            background-color: #f3f4f6;
        }
        
        .fc .fc-button-primary:not(:disabled).fc-button-active:hover {
            background-color: #2563eb;
        }
        
        .fc-event {
            cursor: pointer;
            border: none;
            font-size: 0.85rem;
            padding: 2px 4px;
            margin-bottom: 2px;
            border-radius: 0.25rem;
        }
        
        .fc-daygrid-day-number {
            color: #4b5563;
            font-weight: 500;
        }
        
        .fc-daygrid-day.fc-day-today {
            background-color: #eff6ff;
        }
        
        .fc-col-header-cell-cushion {
            color: #4b5563;
            font-weight: 600;
            text-decoration: none;
        }
    </style>
</x-dashboard-layout>