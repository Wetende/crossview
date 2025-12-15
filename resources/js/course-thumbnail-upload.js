/**
 * Study Material Thumbnail Upload Handler
 * 
 * This script handles the upload of study material thumbnails via AJAX,
 * providing a preview and progress feedback to the user.
 */

document.addEventListener('DOMContentLoaded', function() {
    const thumbnailUploader = document.getElementById('thumbnail-uploader');
    
    if (!thumbnailUploader) return;
    
    const fileInput = thumbnailUploader.querySelector('input[type="file"]');
    const previewContainer = document.getElementById('thumbnail-preview');
    const progressBar = document.getElementById('thumbnail-upload-progress');
    const courseId = thumbnailUploader.dataset.courseId;
    const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
    
    // Preview thumbnail before upload
    fileInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                if (previewContainer) {
                    previewContainer.innerHTML = `
                        <div class="position-relative">
                            <img src="${e.target.result}" alt="Thumbnail Preview" class="img-fluid rounded">
                            <div class="position-absolute top-0 end-0">
                                <button type="button" id="upload-thumbnail-btn" class="btn btn-sm btn-success">
                                    <i class="fa fa-upload"></i> Upload
                                </button>
                            </div>
                        </div>
                    `;
                    
                    // Add upload button event listener
                    document.getElementById('upload-thumbnail-btn').addEventListener('click', uploadThumbnail);
                }
            };
            
            reader.readAsDataURL(this.files[0]);
        }
    });
    
    // Upload thumbnail via AJAX
    function uploadThumbnail() {
        if (!fileInput.files || !fileInput.files[0]) {
            return;
        }
        
        const formData = new FormData();
        formData.append('thumbnail', fileInput.files[0]);
        formData.append('_token', csrfToken);
        
        // Reset progress bar
        if (progressBar) {
            progressBar.style.width = '0%';
            progressBar.textContent = '0%';
            progressBar.parentElement.classList.remove('d-none');
        }
        
        // Disable upload button
        const uploadBtn = document.getElementById('upload-thumbnail-btn');
        if (uploadBtn) {
            uploadBtn.disabled = true;
            uploadBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Uploading...';
        }
        
        // Create AJAX request
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `/teacher/courses/${courseId}/thumbnail`, true);
        
        // Handle progress
        xhr.upload.addEventListener('progress', function(e) {
            if (e.lengthComputable && progressBar) {
                const percentComplete = Math.round((e.loaded / e.total) * 100);
                progressBar.style.width = percentComplete + '%';
                progressBar.textContent = percentComplete + '%';
            }
        });
        
        // Handle completion
        xhr.addEventListener('load', function() {
            if (progressBar) {
                progressBar.parentElement.classList.add('d-none');
            }
            
            if (xhr.status >= 200 && xhr.status < 300) {
                const response = JSON.parse(xhr.responseText);
                
                // Show success message
                const alertContainer = document.createElement('div');
                alertContainer.className = 'alert alert-success alert-dismissible fade show mt-3';
                alertContainer.innerHTML = `
                    Thumbnail uploaded successfully!
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                `;
                thumbnailUploader.appendChild(alertContainer);
                
                // Update preview with the final thumbnail URL
                if (previewContainer && response.thumbnail_url) {
                    previewContainer.innerHTML = `
                        <img src="${response.thumbnail_url}" alt="Study Material Thumbnail" class="img-fluid rounded">
                    `;
                }
                
                // Update all thumbnail displays on the page
                const thumbnailDisplays = document.querySelectorAll('.course-thumbnail-display');
                thumbnailDisplays.forEach(display => {
                    display.src = response.thumbnail_url;
                });
                
                // Clear the file input
                fileInput.value = '';
            } else {
                // Show error message
                let errorMessage = 'An error occurred while uploading the thumbnail.';
                
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response.error) {
                        errorMessage = response.error;
                    }
                } catch (e) {
                    console.error('Error parsing response:', e);
                }
                
                const alertContainer = document.createElement('div');
                alertContainer.className = 'alert alert-danger alert-dismissible fade show mt-3';
                alertContainer.innerHTML = `
                    ${errorMessage}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                `;
                thumbnailUploader.appendChild(alertContainer);
            }
        });
        
        // Handle errors
        xhr.addEventListener('error', function() {
            if (progressBar) {
                progressBar.parentElement.classList.add('d-none');
            }
            
            const alertContainer = document.createElement('div');
            alertContainer.className = 'alert alert-danger alert-dismissible fade show mt-3';
            alertContainer.innerHTML = `
                Network error occurred while uploading. Please try again.
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            `;
            thumbnailUploader.appendChild(alertContainer);
        });
        
        // Send the request
        xhr.send(formData);
    }
}); 