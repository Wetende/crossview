{{-- Stream Lesson Fields Component --}}
<div id="stream-fields" class="space-y-6">
    <div class="border-b border-gray-200 pb-4">
        <h3 class="text-lg font-medium text-gray-900 flex items-center">
            <i class="fas fa-broadcast-tower mr-2 text-purple-500"></i> Live Stream Settings
        </h3>
        <p class="text-sm text-gray-500 mt-1">Configure live streaming session for your lesson</p>
    </div>
    
    {{-- Short Description --}}
    <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
        <textarea id="stream-short-description" name="short_description" rows="3" 
            placeholder="Brief description of the stream session..."
            class="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"></textarea>
        <p class="text-xs text-gray-500 mt-1">A brief overview of what students will learn in this live session.</p>
    </div>
    
    {{-- Stream Settings --}}
    <div class="bg-purple-50 p-4 rounded-md border border-purple-200">
        <h4 class="text-sm font-medium text-purple-900 mb-3">Stream Configuration</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Stream URL</label>
                <input type="url" id="stream-url" name="stream_url" placeholder="https://your-stream-platform.com/stream"
                    class="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
                <p class="text-xs text-gray-500 mt-1">URL where students can access the live stream</p>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Stream Start Time</label>
                <input type="datetime-local" id="stream-start-time" name="stream_start_time"
                    class="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
                <p class="text-xs text-gray-500 mt-1">When the live stream will begin</p>
            </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Stream Password (Optional)</label>
                <input type="password" id="stream-password" name="stream_password" placeholder="Leave empty for no password"
                    class="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
                <p class="text-xs text-gray-500 mt-1">Password protection for the stream (optional)</p>
            </div>
            
            <div class="flex items-end">
                <div class="flex items-center h-10">
                    <input type="checkbox" id="is-recorded" name="is_recorded" class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded">
                    <label for="is-recorded" class="ml-2 block text-sm text-gray-700">This will be a recorded stream</label>
                </div>
            </div>
        </div>
        
        <div id="recording-url-field" class="hidden mt-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Recording URL</label>
            <input type="url" id="recording-url" name="recording_url" placeholder="https://recording-url.com"
                class="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
            <p class="text-xs text-gray-500 mt-1">URL where the recording will be available after the stream</p>
        </div>
    </div>
    
    {{-- Stream Details --}}
    <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Stream Details</label>
        <textarea id="stream-details" name="stream_details" rows="4" 
            placeholder="Additional details about the stream session..."
            class="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"></textarea>
        <p class="text-xs text-gray-500 mt-1">Additional information, agenda, or instructions for the live stream.</p>
    </div>
    
    <div class="bg-purple-50 p-4 rounded-md border border-purple-200">
        <h4 class="text-sm font-medium text-purple-900 mb-3">Stream Settings</h4>
        <div class="space-y-3">
            <div class="flex items-center">
                <input type="checkbox" id="notify-students" name="notify_students" value="1" checked
                    class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded">
                <label for="notify-students" class="ml-2 block text-sm text-gray-700">
                    Notify students when stream starts
                </label>
            </div>
            <div class="flex items-center">
                <input type="checkbox" id="allow-chat" name="allow_chat" value="1" checked
                    class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded">
                <label for="allow-chat" class="ml-2 block text-sm text-gray-700">
                    Allow students to chat during stream
                </label>
            </div>
            <div class="flex items-center">
                <input type="checkbox" id="require-attendance" name="require_attendance" value="1"
                    class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded">
                <label for="require-attendance" class="ml-2 block text-sm text-gray-700">
                    Require attendance tracking
                </label>
            </div>
        </div>
    </div>
</div>

{{-- JavaScript Handler --}}
<script>
(function() {
    window.StreamLessonHandler = {
        validateFields() {
            const errors = [];
            
            const streamUrl = document.getElementById('stream-url')?.value;
            if (!streamUrl || streamUrl.trim() === '') {
                errors.push('Stream URL is required for stream lessons.');
            }
            
            return errors;
        },
        
        clearFields() {
            document.querySelectorAll('#stream-fields input, #stream-fields textarea').forEach(field => {
                if (field.type === 'checkbox') {
                    if (field.id === 'notify-students' || field.id === 'allow-chat') {
                        field.checked = true;
                    } else {
                        field.checked = false;
                    }
                } else {
                    field.value = '';
                }
            });
            
            document.getElementById('recording-url-field')?.classList.add('hidden');
            
            if (typeof CKEDITOR !== 'undefined') {
                if (CKEDITOR.instances['stream-short-description']) {
                    CKEDITOR.instances['stream-short-description'].setData('');
                }
                if (CKEDITOR.instances['stream-details']) {
                    CKEDITOR.instances['stream-details'].setData('');
                }
            }
        }
    };

    // Initialize CKEditor for stream fields
    function initializeStreamLessonEditors() {
        if (typeof CKEDITOR !== 'undefined') {
            const shortDescElement = document.getElementById('stream-short-description');
            if (shortDescElement && !CKEDITOR.instances['stream-short-description']) {
                try {
                    CKEDITOR.replace('stream-short-description', {
                        height: 120,
                        toolbar: [
                            { name: 'basicstyles', items: ['Bold', 'Italic', 'Underline'] },
                            { name: 'paragraph', items: ['NumberedList', 'BulletedList'] },
                            { name: 'links', items: ['Link', 'Unlink'] }
                        ]
                    });
                } catch (error) {
                    console.warn('Failed to initialize CKEditor for stream short description:', error);
                }
            }
            
            const detailsElement = document.getElementById('stream-details');
            if (detailsElement && !CKEDITOR.instances['stream-details']) {
                try {
                    CKEDITOR.replace('stream-details', {
                        height: 200,
                        toolbar: 'full'
                    });
                } catch (error) {
                    console.warn('Failed to initialize CKEditor for stream details:', error);
                }
            }
        }
    }

    function initializeStreamEventHandlers() {
        const recordingCheckbox = document.getElementById('is-recorded');
        if (recordingCheckbox) {
            recordingCheckbox.addEventListener('change', function() {
                const recordingField = document.getElementById('recording-url-field');
                if (this.checked) {
                    recordingField?.classList.remove('hidden');
                } else {
                    recordingField?.classList.add('hidden');
                }
            });
        }
    }

    // Make initialization function globally available
    window.initializeStreamLessonEditors = initializeStreamLessonEditors;
    function initializeAll() {
        initializeStreamLessonEditors();
        initializeStreamEventHandlers();
    }
    
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(initializeAll, 100);
    }
    
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(initializeAll, 100);
    });
    
    window.addEventListener('load', function() {
        setTimeout(initializeAll, 200);
    });
    
    // Polling for dynamic loading
    let initAttempts = 0;
    const maxAttempts = 20;
    
    function attemptInitialization() {
        initAttempts++;
        const shortDescElement = document.getElementById('stream-short-description');
        const detailsElement = document.getElementById('stream-details');
        const recordingCheckbox = document.getElementById('is-recorded');
        
        if (shortDescElement && detailsElement && recordingCheckbox) {
            initializeAll();
            return true;
        } else if (initAttempts < maxAttempts) {
            setTimeout(attemptInitialization, 250);
        }
        return false;
    }
    
    setTimeout(attemptInitialization, 100);

    // If we have pending lesson data from editing, populate the fields
    if (window.pendingLessonData) {
        const lessonData = window.pendingLessonData;
        
        
        const shortDescField = document.getElementById('stream-short-description');
        if (shortDescField && lessonData.short_description) {
            shortDescField.value = lessonData.short_description;
            
            if (typeof CKEDITOR !== 'undefined' && CKEDITOR.instances['stream-short-description']) {
                CKEDITOR.instances['stream-short-description'].setData(lessonData.short_description);
            }
        }
        
        // Populate stream fields
        if (lessonData.stream_url) {
            const streamUrlField = document.getElementById('stream-url');
            if (streamUrlField) {
                streamUrlField.value = lessonData.stream_url;
            }
        }
        
        if (lessonData.stream_start_time) {
            const streamStartTimeField = document.getElementById('stream-start-time');
            if (streamStartTimeField) {
                streamStartTimeField.value = lessonData.stream_start_time;
            }
        }
        
        if (lessonData.stream_password) {
            const streamPasswordField = document.getElementById('stream-password');
            if (streamPasswordField) {
                streamPasswordField.value = lessonData.stream_password;
            }
        }
        
        if (lessonData.stream_details) {
            const streamDetailsField = document.getElementById('stream-details');
            if (streamDetailsField) {
                streamDetailsField.value = lessonData.stream_details;
                
                if (typeof CKEDITOR !== 'undefined' && CKEDITOR.instances['stream-details']) {
                    CKEDITOR.instances['stream-details'].setData(lessonData.stream_details);
                }
            }
        }
        
        if (lessonData.recording_url) {
            const recordingUrlField = document.getElementById('recording-url');
            if (recordingUrlField) {
                recordingUrlField.value = lessonData.recording_url;
            }
        }
        
        // Populate checkboxes
        if (lessonData.is_recorded !== undefined) {
            const isRecordedField = document.getElementById('is-recorded');
            if (isRecordedField) {
                isRecordedField.checked = lessonData.is_recorded;
                const recordingField = document.getElementById('recording-url-field');
                if (lessonData.is_recorded) {
                    recordingField?.classList.remove('hidden');
                } else {
                    recordingField?.classList.add('hidden');
                }
            }
        }
        
        if (lessonData.notify_students !== undefined) {
            const notifyStudentsField = document.getElementById('notify-students');
            if (notifyStudentsField) {
                notifyStudentsField.checked = lessonData.notify_students;
            }
        }
        
        if (lessonData.allow_chat !== undefined) {
            const allowChatField = document.getElementById('allow-chat');
            if (allowChatField) {
                allowChatField.checked = lessonData.allow_chat;
            }
        }
        
        if (lessonData.require_attendance !== undefined) {
            const requireAttendanceField = document.getElementById('require-attendance');
            if (requireAttendanceField) {
                requireAttendanceField.checked = lessonData.require_attendance;
            }
        }
        
        window.pendingLessonData = null;
    }
})();
</script>

{{-- Simple CSS --}}
<style>
.hidden {
    display: none !important;
}

#stream-fields {
    transition: opacity 0.3s ease;
}

#recording-url-field {
    transition: all 0.3s ease;
}
</style> 