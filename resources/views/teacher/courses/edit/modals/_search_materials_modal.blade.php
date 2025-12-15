<!-- Search Materials Modal -->
<div class="modal fade" id="searchMaterialsModal" tabindex="-1" aria-labelledby="searchMaterialsModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="searchMaterialsModalLabel">Search Course Materials</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div class="mb-4">
                    <div class="input-group">
                        <input type="text" class="form-control" id="searchMaterialsInput" placeholder="Search for lessons, quizzes, or assignments...">
                        <button class="button -blue-1 text-white" type="button" id="searchMaterialsButton">Search</button>
                    </div>
                </div>

                <div class="mb-3">
                    <div class="btn-group" role="group" aria-label="Filter by type">
                        <input type="radio" class="btn-check" name="materialType" id="allMaterials" value="all" checked>
                        <label class="btn btn-outline-primary" for="allMaterials">All</label>

                        <input type="radio" class="btn-check" name="materialType" id="lessonMaterials" value="lesson">
                        <label class="btn btn-outline-primary" for="lessonMaterials">Lessons</label>

                        <input type="radio" class="btn-check" name="materialType" id="quizMaterials" value="quiz">
                        <label class="btn btn-outline-primary" for="quizMaterials">Quizzes</label>

                        <input type="radio" class="btn-check" name="materialType" id="assignmentMaterials" value="assignment">
                        <label class="btn btn-outline-primary" for="assignmentMaterials">Assignments</label>
                    </div>
                </div>

                <div id="searchResults" class="border rounded p-3" style="min-height: 300px;">
                    <div class="text-center text-muted py-5">
                        Search for materials to import into your course sections.
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="button -dark-1" data-bs-dismiss="modal">Close</button>
                <button type="button" class="button -md -blue-1 text-white" id="importSelectedMaterials" disabled>Import Selected</button>
            </div>
        </div>
    </div>
</div>

@push('tab-scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchMaterialsInput');
    const searchButton = document.getElementById('searchMaterialsButton');
    const searchResults = document.getElementById('searchResults');
    const importButton = document.getElementById('importSelectedMaterials');
    const typeFilters = document.querySelectorAll('input[name="materialType"]');
    
    let selectedItems = new Set();
    
    // Search functionality
    async function searchMaterials() {
        const query = searchInput.value.trim();
        const type = document.querySelector('input[name="materialType"]:checked').value;
        
        if (!query) {
            searchResults.innerHTML = '<div class="text-center text-muted py-5">Enter a search term to find materials.</div>';
            return;
        }
        
        try {
            const response = await fetch(`{{ route('teacher.courses.materials.search', $course) }}?q=${encodeURIComponent(query)}&type=${type}`);
            const data = await response.json();
            
            if (data.results.length === 0) {
                searchResults.innerHTML = '<div class="text-center text-muted py-5">No materials found matching your search.</div>';
                return;
            }
            
            searchResults.innerHTML = data.results.map(item => `
                <div class="form-check mb-3 p-3 border rounded ${selectedItems.has(item.id) ? 'bg-light' : ''}" data-item-id="${item.id}" data-item-type="${item.type}">
                    <input class="form-check-input" type="checkbox" value="${item.id}" id="material${item.id}" ${selectedItems.has(item.id) ? 'checked' : ''}>
                    <label class="form-check-label d-flex justify-content-between align-items-center" for="material${item.id}">
                        <div>
                            <strong>${item.title}</strong>
                            <span class="badge bg-secondary ms-2">${item.type}</span>
                            <small class="d-block text-muted">${item.description || ''}</small>
                        </div>
                    </label>
                </div>
            `).join('');
            
            // Update checkboxes event listeners
            document.querySelectorAll('#searchResults .form-check-input').forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    const itemId = this.value;
                    if (this.checked) {
                        selectedItems.add(itemId);
                        this.closest('.form-check').classList.add('bg-light');
                    } else {
                        selectedItems.delete(itemId);
                        this.closest('.form-check').classList.remove('bg-light');
                    }
                    importButton.disabled = selectedItems.size === 0;
                });
            });
            
        } catch (error) {
            console.error('Error searching materials:', error);
            searchResults.innerHTML = '<div class="text-center text-danger py-5">Error searching materials. Please try again.</div>';
        }
    }
    
    // Event listeners
    searchButton.addEventListener('click', searchMaterials);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchMaterials();
        }
    });
    
    typeFilters.forEach(filter => {
        filter.addEventListener('change', searchMaterials);
    });
    
    // Import functionality
    importButton.addEventListener('click', async function() {
        if (selectedItems.size === 0) return;
        
        const sectionSelect = document.createElement('select');
        sectionSelect.className = 'form-select mb-3';
        sectionSelect.innerHTML = `
            <option value="">Select a section...</option>
            @foreach($course->sections as $section)
                <option value="{{ $section->id }}">{{ $section->title }}</option>
            @endforeach
        `;
        
        const modal = await Swal.fire({
            title: 'Select Target Section',
            html: sectionSelect.outerHTML,
            showCancelButton: true,
            confirmButtonText: 'Import',
            cancelButtonText: 'Cancel',
            preConfirm: () => {
                const sectionId = Swal.getPopup().querySelector('select').value;
                if (!sectionId) {
                    Swal.showValidationMessage('Please select a section');
                    return false;
                }
                return sectionId;
            }
        });
        
        if (modal.isConfirmed) {
            const sectionId = modal.value;
            try {
                const response = await fetch(`{{ url('teacher/courses/'.$course->id) }}/sections/${sectionId}/materials/import`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': '{{ csrf_token() }}'
                    },
                    body: JSON.stringify({
                        items: Array.from(selectedItems)
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Materials Imported',
                        text: 'The selected materials have been imported successfully.',
                        showConfirmButton: false,
                        timer: 1500
                    }).then(() => {
                        window.location.reload();
                    });
                } else {
                    throw new Error(result.message || 'Import failed');
                }
            } catch (error) {
                console.error('Error importing materials:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Import Failed',
                    text: 'There was an error importing the materials. Please try again.'
                });
            }
        }
    });
});
</script>
@endpush 