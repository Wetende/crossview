{{-- Past Papers Lesson Fields Component --}}
<div id="past-papers-fields" class="space-y-6">
    <div class="border-b border-gray-200 pb-4">
        <h3 class="text-lg font-medium text-gray-900 flex items-center">
            <i class="fas fa-file-archive mr-2 text-green-500"></i> Past Papers & Resources
        </h3>
        <p class="text-sm text-gray-500 mt-1">Upload past papers, documents, and other downloadable resources for students</p>
    </div>
    
    {{-- Short Description --}}
    <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
        <textarea id="past-papers-short-description" name="short_description" rows="3" 
            placeholder="Brief description of the past papers and resources..."
            class="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
        <p class="text-xs text-gray-500 mt-1">A brief overview of what resources are included in this lesson.</p>
    </div>
    
    {{-- File Upload Section --}}
    <div class="bg-green-50 p-4 rounded-md border border-green-200">
        <h4 class="text-sm font-medium text-green-900 mb-3">
            <span id="upload-section-title">Upload Files</span>
            <span id="add-more-files-indicator" class="hidden text-xs text-green-600 ml-2">(Add more files)</span>
        </h4>
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                    <span id="file-input-label">Select Files</span>
                </label>
                <input type="file" id="past-papers-files" name="past_papers_files[]" multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.zip,.rar,.7z,.jpg,.jpeg,.png,.gif,.bmp,.svg"
                    class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100">
                <p class="text-xs text-gray-500 mt-1">
                    Supported formats: PDF, Word, Excel, PowerPoint, Text, Images, ZIP archives. Maximum 50MB per file.
                    <span id="additional-files-note" class="hidden block mt-1 text-green-600">
                        You can add additional files to supplement the existing ones above.
                    </span>
                </p>
            </div>
            
            <div id="file-preview-container" class="hidden">
                <h5 class="text-sm font-medium text-gray-700 mb-2">
                    <span id="new-files-title">Selected Files:</span>
                </h5>
                <div id="file-preview-list" class="space-y-2 max-h-40 overflow-y-auto"></div>
            </div>
        </div>
    </div>
    
    <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Additional Instructions</label>
        <textarea id="past-papers-content" name="content" rows="6" 
            placeholder="Additional instructions, notes, or context for the past papers..."
            class="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
        <p class="text-xs text-gray-500 mt-1">Provide any additional context, instructions, or notes about the past papers and how students should use them.</p>
    </div>
    
    {{-- Download Settings --}}
    <div class="bg-gray-50 p-4 rounded-md border border-gray-200">
        <h4 class="text-sm font-medium text-gray-900 mb-3">Download Settings</h4>
        <div class="space-y-3">
            <div class="flex items-center">
                <input type="checkbox" id="allow-bulk-download" name="allow_bulk_download" value="1" checked
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                <label for="allow-bulk-download" class="ml-2 block text-sm text-gray-700">
                    Allow students to download all files as a ZIP archive
                </label>
            </div>
            <div class="flex items-center">
                <input type="checkbox" id="track-downloads" name="track_downloads" value="1" checked
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                <label for="track-downloads" class="ml-2 block text-sm text-gray-700">
                    Track individual file downloads for analytics
                </label>
            </div>
            <div class="flex items-center">
                <input type="checkbox" id="require-completion" name="require_completion" value="1"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                <label for="require-completion" class="ml-2 block text-sm text-gray-700">
                    Mark lesson as complete when student downloads files
                </label>
            </div>
        </div>
    </div>
</div>

{{-- JavaScript Handler --}}
<script>
(function() {
    // Past Papers Lesson Handler
    window.PastPapersLessonHandler = {
        selectedFiles: [],
        existingFiles: [],
        
        validateFields() {
            const errors = [];
            
            
            const fileInput = document.getElementById('past-papers-files');
            const hasNewFiles = fileInput && fileInput.files.length > 0;
            const hasExistingFiles = this.existingFiles.length > 0;
            
            if (!hasNewFiles && !hasExistingFiles) {
                errors.push('Please upload at least one file for the past papers lesson.');
            }
            
            if (hasNewFiles) {
                const maxSize = 50 * 1024 * 1024; // 50MB in bytes
                for (let i = 0; i < fileInput.files.length; i++) {
                    const file = fileInput.files[i];
                    if (file.size > maxSize) {
                        errors.push(`File "${file.name}" is too large. Maximum size is 50MB per file.`);
                    }
                }
            }
            
            return errors;
        },
        
        clearFields() {
            const fileInput = document.getElementById('past-papers-files');
            if (fileInput) {
                fileInput.value = '';
            }
            
            this.clearFilePreviews();
            
            document.querySelectorAll('#past-papers-fields input[type="text"], #past-papers-fields textarea').forEach(field => {
                field.value = '';
            });
            
            document.getElementById('allow-bulk-download').checked = true;
            document.getElementById('track-downloads').checked = true;
            document.getElementById('require-completion').checked = false;
            
            if (typeof CKEDITOR !== 'undefined') {
                if (CKEDITOR.instances['past-papers-short-description']) {
                    CKEDITOR.instances['past-papers-short-description'].setData('');
                }
                if (CKEDITOR.instances['past-papers-content']) {
                    CKEDITOR.instances['past-papers-content'].setData('');
                }
            }
            
            this.selectedFiles = [];
            this.existingFiles = [];
            
            document.getElementById('file-preview-container').classList.add('hidden');
            document.getElementById('existing-files-section').classList.add('hidden');
            
            this.updateUILabels();
        },
        
        clearFilePreviews() {
            const previewContainer = document.getElementById('file-preview-container');
            const previewList = document.getElementById('file-preview-list');
            
            if (previewList) {
                previewList.innerHTML = '';
            }
            if (previewContainer) {
                previewContainer.classList.add('hidden');
            }
        },
        
        displayFilePreview(file, index) {
            const previewList = document.getElementById('file-preview-list');
            const previewContainer = document.getElementById('file-preview-container');
            
            // Get file icon based on extension
            const fileIcon = this.getFileIcon(file.name);
            const fileSize = this.formatFileSize(file.size);
            
            const filePreview = document.createElement('div');
            filePreview.className = 'flex items-center justify-between p-2 bg-white border border-gray-200 rounded-md';
            filePreview.innerHTML = `
                <div class="flex items-center">
                    <i class="${fileIcon} text-gray-500 mr-2"></i>
                    <div>
                        <div class="text-sm font-medium text-gray-900">${file.name}</div>
                        <div class="text-xs text-gray-500">${fileSize}</div>
                    </div>
                </div>
                <button type="button" class="remove-file-btn text-red-500 hover:text-red-700 p-1" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            previewList.appendChild(filePreview);
            previewContainer.classList.remove('hidden');
            
            // Add remove functionality
            const removeBtn = filePreview.querySelector('.remove-file-btn');
            removeBtn.addEventListener('click', () => {
                this.removeFile(index);
            });
        },
        
        removeFile(index) {
            this.selectedFiles.splice(index, 1);
            this.updateFileInput();
            this.refreshFilePreview();
        },
        
        updateFileInput() {
            const fileInput = document.getElementById('past-papers-files');
            const dt = new DataTransfer();
            
            this.selectedFiles.forEach(file => {
                dt.items.add(file);
            });
            
            fileInput.files = dt.files;
        },
        
        refreshFilePreview() {
            this.clearFilePreviews();
            
            if (this.selectedFiles.length > 0) {
                this.selectedFiles.forEach((file, index) => {
                    this.displayFilePreview(file, index);
                });
            }
        },
        
        getFileIcon(filename) {
            const extension = filename.split('.').pop().toLowerCase();
            
            switch (extension) {
                case 'pdf':
                    return 'fas fa-file-pdf text-red-500';
                case 'doc':
                case 'docx':
                    return 'fas fa-file-word text-blue-500';
                case 'xls':
                case 'xlsx':
                    return 'fas fa-file-excel text-green-500';
                case 'ppt':
                case 'pptx':
                    return 'fas fa-file-powerpoint text-orange-500';
                case 'zip':
                case 'rar':
                case '7z':
                    return 'fas fa-file-archive text-purple-500';
                case 'jpg':
                case 'jpeg':
                case 'png':
                case 'gif':
                case 'bmp':
                case 'svg':
                    return 'fas fa-file-image text-pink-500';
                case 'txt':
                case 'rtf':
                    return 'fas fa-file-alt text-gray-500';
                default:
                    return 'fas fa-file text-gray-500';
            }
        },
        
        formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        },
        
        populateExistingFiles(files) {
            this.existingFiles = files || [];
            
            if (this.existingFiles.length > 0) {
                const existingSection = document.getElementById('existing-files-section');
                const existingList = document.getElementById('existing-files-list');
                
                existingList.innerHTML = '';
                
                this.existingFiles.forEach((file, index) => {
                    const fileIcon = this.getFileIcon(file.original_name || file.file_name);
                    const fileSize = file.file_size ? this.formatFileSize(file.file_size) : 'Unknown size';
                    
                    const fileElement = document.createElement('div');
                    fileElement.className = 'flex items-center justify-between p-2 bg-white border border-gray-200 rounded-md';
                    fileElement.innerHTML = `
                        <div class="flex items-center">
                            <i class="${fileIcon} mr-2"></i>
                            <div>
                                <div class="text-sm font-medium text-gray-900">${file.original_name || file.file_name}</div>
                                <div class="text-xs text-gray-500">${fileSize}</div>
                            </div>
                        </div>
                        <div class="flex items-center space-x-2">
                            <a href="${file.download_url || '#'}" target="_blank" class="text-blue-500 hover:text-blue-700 p-1" title="Download">
                                <i class="fas fa-download"></i>
                            </a>
                            <button type="button" class="remove-existing-file-btn text-red-500 hover:text-red-700 p-1" data-file-id="${file.id}" title="Remove">
                                <i class="fas fa-times"></i>
                            </button>
                            <input type="hidden" name="existing_files[]" value="${file.id}">
                        </div>
                    `;
                    
                    existingList.appendChild(fileElement);
                      
                    const removeBtn = fileElement.querySelector('.remove-existing-file-btn');
                    removeBtn.addEventListener('click', () => {
                        fileElement.remove();
                        
                        this.existingFiles = this.existingFiles.filter(f => f.id !== file.id);
                        
                        this.updateUILabels();
                        
                        if (existingList.children.length === 0) {
                            existingSection.classList.add('hidden');
                        }
                    });
                });
                
                existingSection.classList.remove('hidden');
                
                this.updateUILabels();
            }
        },
        
        updateUILabels() {
            const hasExistingFiles = this.existingFiles.length > 0;
            
            const uploadTitle = document.getElementById('upload-section-title');
            const addMoreIndicator = document.getElementById('add-more-files-indicator');
            const fileInputLabel = document.getElementById('file-input-label');
            const additionalFilesNote = document.getElementById('additional-files-note');
            const newFilesTitle = document.getElementById('new-files-title');
            
            if (hasExistingFiles) {
                if (uploadTitle) uploadTitle.textContent = 'Add Additional Files';
                if (addMoreIndicator) addMoreIndicator.classList.remove('hidden');
                if (fileInputLabel) fileInputLabel.textContent = 'Select Additional Files';
                if (additionalFilesNote) additionalFilesNote.classList.remove('hidden');
                if (newFilesTitle) newFilesTitle.textContent = 'Additional Files to Add:';
            } else {
                if (uploadTitle) uploadTitle.textContent = 'Upload Files';
                if (addMoreIndicator) addMoreIndicator.classList.add('hidden');
                if (fileInputLabel) fileInputLabel.textContent = 'Select Files';
                if (additionalFilesNote) additionalFilesNote.classList.add('hidden');
                if (newFilesTitle) newFilesTitle.textContent = 'Selected Files:';
            }
        }
    };

    // Initialize file input handler
    function initializeFileInput() {
        const fileInput = document.getElementById('past-papers-files');
        if (fileInput) {
            fileInput.addEventListener('change', function(e) {
                const files = Array.from(e.target.files);
                window.PastPapersLessonHandler.selectedFiles = files;
                window.PastPapersLessonHandler.refreshFilePreview();
            });
        }
    }

    // Initialize CKEditor for past papers fields
    function initializePastPapersEditors() {
        if (typeof CKEDITOR !== 'undefined') {
            // Initialize CKEditor for short description
            const shortDescElement = document.getElementById('past-papers-short-description');
            if (shortDescElement && !CKEDITOR.instances['past-papers-short-description']) {
                try {
                    CKEDITOR.replace('past-papers-short-description', {
                        height: 120,
                        toolbar: [
                            { name: 'basicstyles', items: ['Bold', 'Italic', 'Underline'] },
                            { name: 'paragraph', items: ['NumberedList', 'BulletedList'] },
                            { name: 'links', items: ['Link', 'Unlink'] }
                        ]
                    });
                } catch (error) {
                    console.warn('Failed to initialize CKEditor for past papers short description:', error);
                }
            }
            
            // Initialize CKEditor for content
            const contentElement = document.getElementById('past-papers-content');
            if (contentElement && !CKEDITOR.instances['past-papers-content']) {
                try {
                    CKEDITOR.replace('past-papers-content', {
                        height: 200,
                        toolbar: 'full'
                    });
                } catch (error) {
                    console.warn('Failed to initialize CKEditor for past papers content:', error);
                }
            }
        }
    }

    // Make initialization functions globally available
    window.initializePastPapersLessonEditors = initializePastPapersEditors;
    
    // Multiple initialization strategies for dynamic loading
    function initializeAll() {
        initializePastPapersEditors();
        initializeFileInput();
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
        const shortDescElement = document.getElementById('past-papers-short-description');
        const contentElement = document.getElementById('past-papers-content');
        const fileInput = document.getElementById('past-papers-files');
        
        if (shortDescElement && contentElement && fileInput) {
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
        const shortDescField = document.getElementById('past-papers-short-description');
        if (shortDescField && lessonData.short_description) {
            shortDescField.value = lessonData.short_description;
            
            if (typeof CKEDITOR !== 'undefined' && CKEDITOR.instances['past-papers-short-description']) {
                CKEDITOR.instances['past-papers-short-description'].setData(lessonData.short_description);
            }
        }
        
        // Populate content
        const contentField = document.getElementById('past-papers-content');
        if (contentField && lessonData.content) {
            contentField.value = lessonData.content;
            
            if (typeof CKEDITOR !== 'undefined' && CKEDITOR.instances['past-papers-content']) {
                CKEDITOR.instances['past-papers-content'].setData(lessonData.content);
            }
        }
        
        // Populate checkboxes
        if (lessonData.allow_bulk_download !== undefined) {
            const allowBulkField = document.getElementById('allow-bulk-download');
            if (allowBulkField) {
                allowBulkField.checked = lessonData.allow_bulk_download;
            }
        }
        
        if (lessonData.track_downloads !== undefined) {
            const trackDownloadsField = document.getElementById('track-downloads');
            if (trackDownloadsField) {
                trackDownloadsField.checked = lessonData.track_downloads;
            }
        }
        
        if (lessonData.require_completion !== undefined) {
            const requireCompletionField = document.getElementById('require-completion');
            if (requireCompletionField) {
                requireCompletionField.checked = lessonData.require_completion;
            }
        }
        
        // Populate existing files if available
        if (lessonData.past_papers_files && lessonData.past_papers_files.length > 0) {
            window.PastPapersLessonHandler.populateExistingFiles(lessonData.past_papers_files);
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

#past-papers-fields {
    transition: opacity 0.3s ease;
}

#file-preview-container, #existing-files-section {
    transition: all 0.3s ease;
}

.remove-file-btn, .remove-existing-file-btn {
    transition: color 0.2s ease;
}

.remove-file-btn:hover, .remove-existing-file-btn:hover {
    transform: scale(1.1);
}
</style> 