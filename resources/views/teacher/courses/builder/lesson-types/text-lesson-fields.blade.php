{{-- Text Lesson Fields Component --}}
<div id="text-fields" class="space-y-6">
    <div class="border-b border-gray-200 pb-4">
        <h3 class="text-lg font-medium text-gray-900 flex items-center">
            <i class="fas fa-file-alt mr-2 text-green-500"></i> Text Lesson Content
        </h3>
        <p class="text-sm text-gray-500 mt-1">Create rich text content for your lesson</p>
    </div>
    
    {{-- Short Description --}}
    <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
        <textarea id="text-short-description" name="short_description" rows="3" 
            placeholder="Brief description of the lesson..."
            class="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"></textarea>
        <p class="text-xs text-gray-500 mt-1">A brief overview of what students will learn in this lesson.</p>
    </div>
    
    {{-- Rich Text Content --}}
    <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Lesson Content</label>
        <textarea id="text-content" name="content" rows="8" 
            placeholder="Enter your lesson content here. You can use rich text formatting..."
            class="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"></textarea>
        <p class="text-xs text-gray-500 mt-1">Add your lesson content here.</p>
    </div>
    
    {{-- Content Settings --}}
    <div class="bg-green-50 p-4 rounded-md border border-green-200">
        <h4 class="text-sm font-medium text-green-900 mb-3">Content Settings</h4>
        <div class="space-y-3">
            <div class="flex items-center">
                <input type="checkbox" id="enable-print" name="enable_print" value="1" checked
                    class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded">
                <label for="enable-print" class="ml-2 block text-sm text-gray-700">
                    Allow students to print this lesson
                </label>
            </div>
            <div class="flex items-center">
                <input type="checkbox" id="enable-copy" name="enable_copy" value="1" checked
                    class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded">
                <label for="enable-copy" class="ml-2 block text-sm text-gray-700">
                    Allow students to copy text content
                </label>
            </div>
        </div>
    </div>
</div>

{{-- JavaScript Handler --}}
<script>
(function() {
    window.TextLessonHandler = {
        validateFields() {
            const errors = [];
            
            const content = document.getElementById('text-content')?.value;
            let editorContent = content;
            if (typeof CKEDITOR !== 'undefined' && CKEDITOR.instances['text-content']) {
                editorContent = CKEDITOR.instances['text-content'].getData();
            }
            
            if (!editorContent || editorContent.trim() === '' || editorContent.trim() === '<p></p>') {
                errors.push('Lesson content is required for text lessons.');
            }
            
            return errors;
        },
        
        clearFields() {
            document.querySelectorAll('#text-fields input, #text-fields textarea').forEach(field => {
                if (field.type === 'checkbox') {
                    field.checked = false;
                } else {
                    field.value = '';
                }
            });
            
            if (typeof CKEDITOR !== 'undefined') {
                if (CKEDITOR.instances['text-short-description']) {
                    CKEDITOR.instances['text-short-description'].setData('');
                }
                if (CKEDITOR.instances['text-content']) {
                    CKEDITOR.instances['text-content'].setData('');
                }
            }
        }
    };

    // Initialize CKEditor for text fields
    function initializeTextLessonEditors() {
        if (typeof CKEDITOR !== 'undefined') {
            const shortDescElement = document.getElementById('text-short-description');
            if (shortDescElement && !CKEDITOR.instances['text-short-description']) {
                try {
                    CKEDITOR.replace('text-short-description', {
                        height: 120,
                        toolbar: [
                            { name: 'basicstyles', items: ['Bold', 'Italic', 'Underline'] },
                            { name: 'paragraph', items: ['NumberedList', 'BulletedList'] },
                            { name: 'links', items: ['Link', 'Unlink'] }
                        ]
                    });
                } catch (error) {
                    console.warn('Failed to initialize CKEditor for short description:', error);
                }
            }
            
            // Initialize CKEditor for main content
            const textContentElement = document.getElementById('text-content');
            if (textContentElement && !CKEDITOR.instances['text-content']) {
                try {
                    CKEDITOR.replace('text-content', {
                        height: 300,
                        toolbar: 'full'
                    });
                } catch (error) {
                    console.warn('Failed to initialize CKEditor for text content:', error);
                }
            }
        }
    }

    window.initializeTextLessonEditors = initializeTextLessonEditors;
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(initializeTextLessonEditors, 100);
    }
    
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(initializeTextLessonEditors, 100);
    });
    
    window.addEventListener('load', function() {
        setTimeout(initializeTextLessonEditors, 200);
    });
    
    // Polling for dynamic loading
    let initAttempts = 0;
    const maxAttempts = 20;
    
    function attemptInitialization() {
        initAttempts++;
        const shortDescElement = document.getElementById('text-short-description');
        const textContentElement = document.getElementById('text-content');
        
        if (shortDescElement && textContentElement) {
            initializeTextLessonEditors();
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
        
        const shortDescField = document.getElementById('text-short-description');
        if (shortDescField && lessonData.short_description) {
            shortDescField.value = lessonData.short_description;
            
            if (typeof CKEDITOR !== 'undefined' && CKEDITOR.instances['text-short-description']) {
                CKEDITOR.instances['text-short-description'].setData(lessonData.short_description);
            }
        }
        
        const textContentField = document.getElementById('text-content');
        if (textContentField && lessonData.content) {
            textContentField.value = lessonData.content;
            
            if (typeof CKEDITOR !== 'undefined' && CKEDITOR.instances['text-content']) {
                CKEDITOR.instances['text-content'].setData(lessonData.content);
            }
        }
        
        if (lessonData.enable_print !== undefined) {
            const enablePrintField = document.getElementById('enable-print');
            if (enablePrintField) {
                enablePrintField.checked = lessonData.enable_print;
            }
        }
        
        if (lessonData.enable_copy !== undefined) {
            const enableCopyField = document.getElementById('enable-copy');
            if (enableCopyField) {
                enableCopyField.checked = lessonData.enable_copy;
            }
        }
        
        window.pendingLessonData = null;
    }
})();
</script>

<style>
.hidden {
    display: none !important;
}

#text-fields {
    transition: opacity 0.3s ease;
}
</style> 