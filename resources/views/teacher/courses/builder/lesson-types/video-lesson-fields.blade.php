{{-- Video Lesson Fields Component --}}
<div id="video-fields" class="space-y-6">
    <div class="border-b border-gray-200 pb-4">
        <h3 class="text-lg font-medium text-gray-900 flex items-center">
            <i class="fas fa-video mr-2 text-blue-500"></i> Video Lesson Content
        </h3>
        <p class="text-sm text-gray-500 mt-1">Configure video settings and content for your lesson</p>
    </div>
    
    {{-- Short Description --}}
    <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
        <textarea id="video-short-description" name="short_description" rows="3" 
            placeholder="Brief description of the lesson..."
            class="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
        <p class="text-xs text-gray-500 mt-1">A brief overview of what students will learn in this lesson.</p>
    </div>
    
    {{-- Video Settings --}}
    <div class="bg-blue-50 p-4 rounded-md border border-blue-200">
        <h4 class="text-sm font-medium text-blue-900 mb-3">Video Settings</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Video Source</label>
                <select id="video-source" name="video_source"
                    class="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="youtube">YouTube</option>
                    <option value="vimeo">Vimeo</option>
                    <option value="local">Local Upload</option>
                    <option value="other">Other URL</option>
                </select>
            </div>
            
            <div id="video-url-container">
                <label class="block text-sm font-medium text-gray-700 mb-1">Video URL</label>
                <input type="url" id="video-url" name="video_url" placeholder="https://www.youtube.com/watch?v=3JkA8AaQ"
                    class="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <p id="url-help-text" class="text-xs text-gray-500 mt-1">Enter the full video URL including https://</p>
                </div>
            
            <div id="video-file-container" class="hidden">
                <label class="block text-sm font-medium text-gray-700 mb-1">Video File</label>
                <input type="file" id="video-file" name="video_file" accept="video/*"
                    class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
                <p class="text-xs text-gray-500 mt-1">Upload a video file (MP4, AVI, MOV, etc.)</p>
            </div>
        </div>
    </div>
    
    {{-- Lesson Content --}}
    <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Lesson Content</label>
        <textarea id="video-content" name="content" rows="8" 
            placeholder="Additional lesson content, notes, or instructions..."
            class="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
        <p class="text-xs text-gray-500 mt-1">Use the rich text editor to add supplementary content, notes, or instructions for the video lesson.</p>
    </div>
    
    {{-- Video Settings --}}
    <div class="bg-blue-50 p-4 rounded-md border border-blue-200">
        <h4 class="text-sm font-medium text-blue-900 mb-3">Playback Settings</h4>
        <div class="space-y-3">
            <div class="flex items-center">
                <input type="checkbox" id="auto-play" name="auto_play" value="1"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                <label for="auto-play" class="ml-2 block text-sm text-gray-700">
                    Auto-play video when lesson loads
                </label>
            </div>
            <div class="flex items-center">
                <input type="checkbox" id="show-controls" name="show_controls" value="1" checked
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                <label for="show-controls" class="ml-2 block text-sm text-gray-700">
                    Show video controls to students
                </label>
            </div>
            <div class="flex items-center">
                <input type="checkbox" id="allow-download" name="allow_download" value="1"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                <label for="allow-download" class="ml-2 block text-sm text-gray-700">
                    Allow students to download video
                </label>
            </div>
        </div>
    </div>
</div>

{{-- JavaScript Handler --}}
<script>
(function() {
    window.VideoLessonHandler = {
        validateFields() {
            const errors = [];
            const videoSource = document.getElementById('video-source')?.value;
            
            if (videoSource === 'local') {
                const videoFile = document.getElementById('video-file')?.files[0];
                if (!videoFile) {
                    errors.push('Please upload a video file for local video lessons.');
                }
            } else {
            const videoUrl = document.getElementById('video-url')?.value;
            if (!videoUrl || videoUrl.trim() === '') {
                    errors.push('Video URL is required for external video sources.');
                }
            }
            
            return errors;
        },
        
        clearFields() {
            document.querySelectorAll('#video-fields input, #video-fields textarea, #video-fields select').forEach(field => {
                if (field.type === 'checkbox') {
                    field.checked = field.id === 'show-controls';
                } else if (field.type === 'file') {
                    field.value = '';
                } else {
                    field.value = '';
                }
            });
            
            document.getElementById('video-source').value = 'youtube';
            handleVideoSourceChange();
            
            if (typeof CKEDITOR !== 'undefined') {
                if (CKEDITOR.instances['video-short-description']) {
                    CKEDITOR.instances['video-short-description'].setData('');
                }
                if (CKEDITOR.instances['video-content']) {
                    CKEDITOR.instances['video-content'].setData('');
                }
            }
        }
    };

    function handleVideoSourceChange() {
        const videoSource = document.getElementById('video-source')?.value;
        const urlContainer = document.getElementById('video-url-container');
        const fileContainer = document.getElementById('video-file-container');
        const urlInput = document.getElementById('video-url');
        const helpText = document.getElementById('url-help-text');
        
        if (videoSource === 'local') {
            urlContainer.classList.add('hidden');
            fileContainer.classList.remove('hidden');
            urlInput.removeAttribute('required');
        } else {
            urlContainer.classList.remove('hidden');
            fileContainer.classList.add('hidden');
            urlInput.setAttribute('required', 'required');
            
            switch (videoSource) {
                case 'youtube':
                    urlInput.placeholder = 'https://www.youtube.com/watch?v=3JkA8AaQ';
                    helpText.textContent = 'Enter YouTube video URL (e.g., https://www.youtube.com/watch?v=...)';
                    break;
                case 'vimeo':
                    urlInput.placeholder = 'https://vimeo.com/123456789';
                    helpText.textContent = 'Enter Vimeo video URL (e.g., https://vimeo.com/...)';
                    break;
                case 'other':
                    urlInput.placeholder = 'https://example.com/video.mp4';
                    helpText.textContent = 'Enter any video URL (e.g., https://example.com/video.mp4)';
                    break;
            }
        }
    }

    // Initialize CKEditor for video fields
    function initializeVideoLessonEditors() {
        if (typeof CKEDITOR !== 'undefined') {
            // Initialize CKEditor for short description
            const shortDescElement = document.getElementById('video-short-description');
            if (shortDescElement && !CKEDITOR.instances['video-short-description']) {
                try {
                    CKEDITOR.replace('video-short-description', {
                        height: 120,
                        toolbar: [
                            { name: 'basicstyles', items: ['Bold', 'Italic', 'Underline'] },
                            { name: 'paragraph', items: ['NumberedList', 'BulletedList'] },
                            { name: 'links', items: ['Link', 'Unlink'] }
                        ]
                    });
                } catch (error) {
                    console.warn('Failed to initialize CKEditor for video short description:', error);
                }
            }
            
            // Initialize CKEditor for content
            const contentElement = document.getElementById('video-content');
            if (contentElement && !CKEDITOR.instances['video-content']) {
                try {
                    CKEDITOR.replace('video-content', {
                        height: 300,
                        toolbar: 'full'
                    });
                } catch (error) {
                    console.warn('Failed to initialize CKEditor for video content:', error);
                }
            }
        }
    }

    // Initialize event handlers
    function initializeVideoEventHandlers() {
        const videoSourceSelect = document.getElementById('video-source');
        if (videoSourceSelect) {
            videoSourceSelect.addEventListener('change', handleVideoSourceChange);
            handleVideoSourceChange();
        }
    }

    window.initializeVideoLessonEditors = initializeVideoLessonEditors;
    window.handleVideoSourceChange = handleVideoSourceChange;
    
    // Multiple initialization strat    egies for dynamic loading
    function initializeAll() {
        initializeVideoLessonEditors();
        initializeVideoEventHandlers();
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
        const shortDescElement = document.getElementById('video-short-description');
        const contentElement = document.getElementById('video-content');
        const videoSourceElement = document.getElementById('video-source');
        
        if (shortDescElement && contentElement && videoSourceElement) {
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
        
        // Populate short description
        const shortDescField = document.getElementById('video-short-description');
        if (shortDescField && lessonData.short_description) {
            shortDescField.value = lessonData.short_description;
            
            if (typeof CKEDITOR !== 'undefined' && CKEDITOR.instances['video-short-description']) {
                CKEDITOR.instances['video-short-description'].setData(lessonData.short_description);
            }
        }
        
        // Populate content
        const contentField = document.getElementById('video-content');
        if (contentField && lessonData.content) {
            contentField.value = lessonData.content;
            
            if (typeof CKEDITOR !== 'undefined' && CKEDITOR.instances['video-content']) {
                CKEDITOR.instances['video-content'].setData(lessonData.content);
            }
        }
        
        // Populate video fields
        if (lessonData.video_source) {
            const videoSourceField = document.getElementById('video-source');
            if (videoSourceField) {
                videoSourceField.value = lessonData.video_source;
                setTimeout(() => handleVideoSourceChange(), 100);
            }
        }
        
        if (lessonData.video_url) {
            const videoUrlField = document.getElementById('video-url');
            if (videoUrlField) {
                videoUrlField.value = lessonData.video_url;
            }
        }
        
        // Populate checkboxes
        if (lessonData.auto_play !== undefined) {
            const autoPlayField = document.getElementById('auto-play');
            if (autoPlayField) {
                autoPlayField.checked = lessonData.auto_play;
            }
        }
        
        if (lessonData.show_controls !== undefined) {
            const showControlsField = document.getElementById('show-controls');
            if (showControlsField) {
                showControlsField.checked = lessonData.show_controls;
            }
        }
        
        if (lessonData.allow_download !== undefined) {
            const allowDownloadField = document.getElementById('allow-download');
            if (allowDownloadField) {
                allowDownloadField.checked = lessonData.allow_download;
            }
        }
        
        // Clear the pending data
        window.pendingLessonData = null;
    }
})();
</script>

{{-- Simple CSS --}}
<style>
.hidden {
    display: none !important;
}

#video-fields {
    transition: opacity 0.3s ease;
}

#video-url-container, #video-file-container {
    transition: all 0.3s ease;
}
</style> 