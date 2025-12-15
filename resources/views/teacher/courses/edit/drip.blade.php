<style>
.section-card {
    border-left: 4px solid #3b82f6;
    margin-bottom: 1.5rem;
}
.lesson-item {
    border-left: 2px solid #e5e7eb;
    padding-left: 1rem;
    margin-bottom: 0.75rem;
}
.inactive {
    opacity: 0.7;
}
.drip-option {
    margin-bottom: 1rem;
    padding: 0.5rem;
    border-radius: 0.5rem;
}
.drip-option:hover {
    background-color: #f9fafb;
}
</style>

<div id="dripTab" class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
    <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
        <h2 class="text-17 fw-500">Drip Content Settings</h2>
    </div>

    <div class="py-30 px-30">
        @if(session('success'))
            <div class="alert alert-success">
                {{ session('success') }}
            </div>
        @endif

        @if(session('error'))
            <div class="alert alert-danger">
                {{ session('error') }}
            </div>
        @endif

        <div class="mb-30">
            <div class="bg-purple-1 text-white py-15 px-20 rounded-8 mb-20">
                <div class="d-flex items-center">
                    <div class="icon-info-circle text-20 mr-10"></div>
                    <p class="lh-1">Drip content allows you to gradually release course materials to your students over time. You can set specific dates for content release or configure content to unlock a certain number of days after enrollment.</p>
                </div>
            </div>
        </div>

        <form action="{{ route('teacher.courses.drip.update', $course) }}" method="POST">
            @csrf
            @method('PUT')

            <div class="mb-30">
                <div class="d-flex justify-between items-center mb-20">
                    <h3 class="text-18 fw-500">Section & Lesson Drip Settings</h3>
                    <button type="submit" class="button -md -purple-1 text-white">Save All Settings</button>
                </div>

                @if($sections->count() > 0)
                    @foreach($sections as $section)
                        <div class="section-card px-20 py-20 bg-light-3 rounded-8">
                            <div class="row">
                                <div class="col-12 mb-20">
                                    <h4 class="text-16 fw-500">{{ $section->title }}</h4>

                                    <div class="row mt-20">
                                        <div class="col-md-6">
                                            <h5 class="text-14 fw-500 mb-10">Section Unlock Method</h5>
                                            
                                            <div class="drip-option">
                                                <div class="form-check mb-10">
                                                    <input class="form-check-input section-method-radio" type="radio" 
                                                           name="sections[{{ $section->id }}][unlock_method]" 
                                                           id="section-{{ $section->id }}-method-immediate" 
                                                           value="immediate"
                                                           data-section="{{ $section->id }}"
                                                           {{ ($section->unlock_date === null && $section->unlock_after_days === null) ? 'checked' : '' }}>
                                                    <label class="form-check-label" for="section-{{ $section->id }}-method-immediate">
                                                        Available immediately
                                                    </label>
                                                </div>
                                            </div>
                                            
                                            <div class="drip-option">
                                                <div class="form-check mb-10">
                                                    <input class="form-check-input section-method-radio" type="radio" 
                                                           name="sections[{{ $section->id }}][unlock_method]" 
                                                           id="section-{{ $section->id }}-method-date" 
                                                           value="date"
                                                           data-section="{{ $section->id }}"
                                                           {{ $section->unlock_date !== null ? 'checked' : '' }}>
                                                    <label class="form-check-label" for="section-{{ $section->id }}-method-date">
                                                        Available on specific date
                                                    </label>
                                                </div>
                                                
                                                <div class="form-group ml-30 {{ $section->unlock_date !== null ? '' : 'inactive' }}" id="section-{{ $section->id }}-date-group">
                                                    <label class="form-label">Unlock Date</label>
                                                    <input type="datetime-local" class="form-control" 
                                                           name="sections[{{ $section->id }}][unlock_date]" 
                                                           value="{{ $section->unlock_date ? $section->unlock_date->format('Y-m-d\TH:i') : '' }}">
                                                </div>
                                            </div>
                                            
                                            <div class="drip-option">
                                                <div class="form-check mb-10">
                                                    <input class="form-check-input section-method-radio" type="radio" 
                                                           name="sections[{{ $section->id }}][unlock_method]" 
                                                           id="section-{{ $section->id }}-method-days" 
                                                           value="days"
                                                           data-section="{{ $section->id }}"
                                                           {{ $section->unlock_after_days !== null ? 'checked' : '' }}>
                                                    <label class="form-check-label" for="section-{{ $section->id }}-method-days">
                                                        Available days after enrollment
                                                    </label>
                                                </div>
                                                
                                                <div class="form-group ml-30 {{ $section->unlock_after_days !== null ? '' : 'inactive' }}" id="section-{{ $section->id }}-days-group">
                                                    <label class="form-label">Days after enrollment</label>
                                                    <input type="number" class="form-control" 
                                                           name="sections[{{ $section->id }}][unlock_after_days]" 
                                                           min="0" 
                                                           value="{{ $section->unlock_after_days }}">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Lessons within this section -->
                                @if($section->lessons->count() > 0)
                                    <div class="col-12 pl-30">
                                        <h5 class="text-16 fw-500 mb-20">Lessons</h5>
                                        
                                        @foreach($section->lessons as $lesson)
                                            <div class="lesson-item py-10">
                                                <h6 class="text-15 fw-500 mb-10">{{ $lesson->title }}</h6>
                                                
                                                <div class="row">
                                                    <div class="col-md-6">
                                                        <div class="drip-option">
                                                            <div class="form-check mb-10">
                                                                <input class="form-check-input lesson-method-radio" type="radio" 
                                                                       name="lessons[{{ $lesson->id }}][unlock_method]" 
                                                                       id="lesson-{{ $lesson->id }}-method-immediate" 
                                                                       value="immediate"
                                                                       data-lesson="{{ $lesson->id }}"
                                                                       {{ ($lesson->unlock_date === null && $lesson->unlock_after_purchase_days === null) ? 'checked' : '' }}>
                                                                <label class="form-check-label" for="lesson-{{ $lesson->id }}-method-immediate">
                                                                    Use section settings (default)
                                                                </label>
                                                            </div>
                                                        </div>
                                                        
                                                        <div class="drip-option">
                                                            <div class="form-check mb-10">
                                                                <input class="form-check-input lesson-method-radio" type="radio" 
                                                                       name="lessons[{{ $lesson->id }}][unlock_method]" 
                                                                       id="lesson-{{ $lesson->id }}-method-date" 
                                                                       value="date"
                                                                       data-lesson="{{ $lesson->id }}"
                                                                       {{ $lesson->unlock_date !== null ? 'checked' : '' }}>
                                                                <label class="form-check-label" for="lesson-{{ $lesson->id }}-method-date">
                                                                    Available on specific date
                                                                </label>
                                                            </div>
                                                            
                                                            <div class="form-group ml-30 {{ $lesson->unlock_date !== null ? '' : 'inactive' }}" id="lesson-{{ $lesson->id }}-date-group">
                                                                <label class="form-label">Unlock Date</label>
                                                                <input type="datetime-local" class="form-control" 
                                                                       name="lessons[{{ $lesson->id }}][unlock_date]" 
                                                                       value="{{ $lesson->unlock_date ? $lesson->unlock_date->format('Y-m-d\TH:i') : '' }}">
                                                            </div>
                                                        </div>
                                                        
                                                        <div class="drip-option">
                                                            <div class="form-check mb-10">
                                                                <input class="form-check-input lesson-method-radio" type="radio" 
                                                                       name="lessons[{{ $lesson->id }}][unlock_method]" 
                                                                       id="lesson-{{ $lesson->id }}-method-days" 
                                                                       value="days"
                                                                       data-lesson="{{ $lesson->id }}"
                                                                       {{ $lesson->unlock_after_purchase_days !== null ? 'checked' : '' }}>
                                                                <label class="form-check-label" for="lesson-{{ $lesson->id }}-method-days">
                                                                    Available days after enrollment
                                                                </label>
                                                            </div>
                                                            
                                                            <div class="form-group ml-30 {{ $lesson->unlock_after_purchase_days !== null ? '' : 'inactive' }}" id="lesson-{{ $lesson->id }}-days-group">
                                                                <label class="form-label">Days after enrollment</label>
                                                                <input type="number" class="form-control" 
                                                                       name="lessons[{{ $lesson->id }}][unlock_after_purchase_days]" 
                                                                       min="0" 
                                                                       value="{{ $lesson->unlock_after_purchase_days }}">
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        @endforeach
                                    </div>
                                @endif
                            </div>
                        </div>
                    @endforeach
                @else
                    <div class="text-center py-30">
                        <div class="icon-calendar text-40 text-light-1 mb-10"></div>
                        <h4 class="text-18 fw-500">No sections available</h4>
                        <p class="mt-10">Add sections to your course before configuring drip settings</p>
                    </div>
                @endif
            </div>

            <div class="d-flex justify-end">
                <button type="submit" class="button -md -purple-1 text-white">Save All Settings</button>
            </div>
        </form>
    </div>
</div>

<script>
    document.addEventListener('DOMContentLoaded', function() {
        // Section unlock method toggle
        const sectionMethodRadios = document.querySelectorAll('.section-method-radio');
        sectionMethodRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                const sectionId = this.dataset.section;
                const value = this.value;
                
                // Hide all option groups first
                document.getElementById(`section-${sectionId}-date-group`).classList.add('inactive');
                document.getElementById(`section-${sectionId}-days-group`).classList.add('inactive');
                
                // Show the relevant group
                if (value === 'date') {
                    document.getElementById(`section-${sectionId}-date-group`).classList.remove('inactive');
                } else if (value === 'days') {
                    document.getElementById(`section-${sectionId}-days-group`).classList.remove('inactive');
                }
            });
        });
        
        // Lesson unlock method toggle
        const lessonMethodRadios = document.querySelectorAll('.lesson-method-radio');
        lessonMethodRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                const lessonId = this.dataset.lesson;
                const value = this.value;
                
                // Hide all option groups first
                document.getElementById(`lesson-${lessonId}-date-group`).classList.add('inactive');
                document.getElementById(`lesson-${lessonId}-days-group`).classList.add('inactive');
                
                // Show the relevant group
                if (value === 'date') {
                    document.getElementById(`lesson-${lessonId}-date-group`).classList.remove('inactive');
                } else if (value === 'days') {
                    document.getElementById(`lesson-${lessonId}-days-group`).classList.remove('inactive');
                }
            });
        });
    });
</script>