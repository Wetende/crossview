<x-dashboard-layout title="@lmsterm('Study Material') Approvals">
    <x-slot name="header">
        @include('layouts.partials.admin.header')
    </x-slot>

    <x-slot name="sidebar">
        @include('layouts.partials.admin.sidebar')
    </x-slot>

    <div class="flex flex-col space-y-6 p-6">
        <!-- Header with Actions -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 class="text-2xl font-bold text-gray-800">@lmsterm('Study Material') Approvals</h1>
                <p class="text-sm text-gray-500 mt-1">Review and approve @lmsterm('study materials') submitted by teachers</p>
            </div>
            <div class="flex flex-wrap gap-3">
                <button type="button" onclick="showBulkApproveModal()"
                    class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    Bulk Approve
                </button>
                <button type="button" onclick="showBulkRejectModal()"
                    class="inline-flex items-center px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg shadow-sm transition duration-200 focus:outline-none focus:ring-2 focus:ring-rose-500">
                    Bulk Reject
                </button>
            </div>
        </div>

        <!-- Statistics Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="bg-white rounded-2xl shadow-md p-5">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-500 font-medium">Pending Approval</p>
                        <h2 class="text-3xl font-bold text-gray-800 mt-2">{{ $stats['pending'] }}</h2>
                    </div>
                    <div class="p-3 rounded-xl bg-amber-100 text-amber-600">
                        <i class="fas fa-clock text-xl"></i>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-2xl shadow-md p-5">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-500 font-medium">Approved Today</p>
                        <h2 class="text-3xl font-bold text-gray-800 mt-2">{{ $stats['approved_today'] }}</h2>
                    </div>
                    <div class="p-3 rounded-xl bg-emerald-100 text-emerald-600">
                        <i class="fas fa-check-circle text-xl"></i>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-2xl shadow-md p-5">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-500 font-medium">Rejected Today</p>
                        <h2 class="text-3xl font-bold text-gray-800 mt-2">{{ $stats['rejected_today'] }}</h2>
                    </div>
                    <div class="p-3 rounded-xl bg-rose-100 text-rose-600">
                        <i class="fas fa-times-circle text-xl"></i>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-2xl shadow-md p-5 ">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-500 font-medium">Total Submitted</p>
                        <h2 class="text-3xl font-bold text-gray-800 mt-2">{{ $stats['total_submitted'] }}</h2>
                    </div>
                    <div class="p-3 rounded-xl bg-blue-100 text-blue-600">
                        <i class="fas fa-file-alt text-xl"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Filters -->
        <div class="bg-white rounded-2xl shadow-md border p-6">
            <form method="GET" action="{{ route('admin.course-approvals.index') }}"
                class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Search</label>
                    <input type="text" name="search" value="{{ request('search') }}"
                        placeholder="Search @lmsterm('study materials') or teachers..."
                        class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                    <select name="category"
                        class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm">
                        <option value="">All Categories</option>
                        @foreach ($categories as $category)
                            <option value="{{ $category->id }}"
                                {{ request('category') == $category->id ? 'selected' : '' }}>
                                {{ $category->name }}
                            </option>
                        @endforeach
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Grade Level</label>
                    <select name="grade_level"
                        class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm">
                        <option value="">All Grade Levels</option>
                        @foreach ($gradeLevels as $gradeLevel)
                            <option value="{{ $gradeLevel->id }}"
                                {{ request('grade_level') == $gradeLevel->id ? 'selected' : '' }}>
                                {{ $gradeLevel->name }}
                            </option>
                        @endforeach
                    </select>
                </div>
                <div class="flex items-end gap-3">
                    <button type="submit"
                        class="flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
                        Filter
                    </button>
                    <a href="{{ route('admin.course-approvals.index') }}"
                        class="flex items-center justify-center px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-lg transition">
                        Clear
                    </a>
                </div>
            </form>
        </div>

        <!-- Study Materials Table -->
        <div class="bg-white rounded-2xl shadow-md border overflow-hidden">
            @if ($pendingCourses->count() > 0)
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-100 text-gray-700 text-xs font-semibold uppercase tracking-wider">
                            <tr>
                                <th class="px-6 py-3 text-left w-10">
                                    <input type="checkbox" id="selectAll" class="form-checkbox h-4 w-4 text-indigo-600">
                                </th>
                                <th class="px-6 py-3 text-left">@lmsterm('Study Material')</th>
                                <th class="px-6 py-3 text-left">Teacher</th>
                                <th class="px-6 py-3 text-left">Category</th>
                                <th class="px-6 py-3 text-left">Submitted</th>
                                <th class="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-100 text-sm text-gray-700">
                            @foreach ($pendingCourses as $studyMaterial)
                                <tr class="hover:bg-gray-50 transition">
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <input type="checkbox" name="study_material_ids[]" value="{{ $studyMaterial->id }}"
                                            class="form-checkbox h-4 w-4 text-indigo-600">
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="flex items-center">
                                            @if ($studyMaterial->thumbnail_path)
                                                <img src="{{ Storage::url($studyMaterial->thumbnail_path) }}"
                                                    alt="{{ $studyMaterial->title }}"
                                                    class="h-10 w-10 rounded-md object-cover mr-3">
                                            @else
                                                <div
                                                    class="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center mr-3">
                                                    <i class="fas fa-play text-gray-400"></i>
                                                </div>
                                            @endif
                                            <div>
                                                <div class="font-semibold text-gray-800">{{ $studyMaterial->title }}</div>
                                                <div class="text-xs text-gray-500 mt-1">
                                                    {{ Str::limit($studyMaterial->description, 50) }}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="font-medium text-gray-900">{{ $studyMaterial->teacher->name }}</div>
                                        <div class="text-xs text-gray-500">{{ $studyMaterial->teacher->email }}</div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span
                                            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                                            {{ $studyMaterial->category->name ?? 'Uncategorized' }}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm text-gray-800">
                                            {{ $studyMaterial->submitted_at->format('M d, Y') }}</div>
                                        <div class="text-xs text-gray-500">
                                            {{ $studyMaterial->submitted_at->format('h:i A') }}</div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-right">
                                        <div class="flex justify-end space-x-2">
                                            <a href="{{ route('admin.course-approvals.show', $studyMaterial) }}"
                                                class="text-indigo-600 hover:bg-indigo-100 p-2 rounded-full transition"
                                                title="View @lmsterm('Study Material')">
                                                <i class="fas fa-eye"></i>
                                            </a>
                                            <button onclick="quickApprove('{{ $studyMaterial->id }}')"
                                                class="text-emerald-600 hover:bg-emerald-100 p-2 rounded-full transition"
                                                title="Approve @lmsterm('Study Material')">
                                                <i class="fas fa-check"></i>
                                            </button>
                                            <button onclick="quickReject('{{ $studyMaterial->id }}')"
                                                class="text-rose-600 hover:bg-rose-100 p-2 rounded-full transition"
                                                title="Reject @lmsterm('Study Material')">
                                                <i class="fas fa-times"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
                <!-- Pagination -->
                <div
                    class="px-6 py-4 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 bg-gray-50">
                    <div class="text-sm text-gray-600 mb-4 sm:mb-0">
                        Showing <span class="font-medium">{{ $pendingCourses->firstItem() }}</span> to
                        <span class="font-medium">{{ $pendingCourses->lastItem() }}</span> of
                        <span class="font-medium">{{ $pendingCourses->total() }}</span> results
                    </div>
                    <div class="flex items-center space-x-1">
                        {{ $pendingCourses->links() }}
                    </div>
                </div>
            @else
                <!-- Empty state -->
                <div class="text-center py-16 bg-gray-50">
                    <div class="text-gray-300 mb-4">
                        <i class="fas fa-check-circle text-6xl"></i>
                    </div>
                    <h4 class="text-xl font-semibold text-gray-700 mb-2">No Pending Approvals</h4>
                    <p class="text-sm text-gray-500 max-w-md mx-auto">
                        All @lmsterm('study materials') have been reviewed. Great job! Check back later for new submissions.
                    </p>
                </div>
            @endif
        </div>

    </div>

    <!-- Bulk Approve Modal -->
    <div class="modal fade" id="bulkApproveModal" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content bg-white rounded-2xl shadow-xl border border-gray-200">
                <div class="modal-header px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h5 class="text-lg font-semibold text-gray-800">Approve Selected @lmsterm('Study Materials')</h5>
                </div>
                <form id="bulkApproveForm">
                    <div class="modal-body px-6 py-5 space-y-4">
                        <div>
                            <label for="approveNotes" class="block text-sm font-medium text-gray-700 mb-1">
                                Approval Notes (Optional)
                            </label>
                            <textarea id="approveNotes" name="notes" rows="3"
                                class="w-full border border-gray-300 rounded-md p-3 text-sm text-gray-800 focus:ring-emerald-500 focus:border-emerald-500 transition"
                                placeholder="Add any notes for the approved @lmsterm('study materials')..."></textarea>
                        </div>
                        <div class="text-sm text-gray-600">
                            You have selected <span id="selectedCount" class="font-semibold text-gray-800">0</span>
                            @lmsterm('study material')(s) for approval.
                        </div>
                    </div>
                    <div class="modal-footer px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                        <button type="button"
                            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition"
                            data-bs-dismiss="modal">
                            Cancel
                        </button>
                        <button type="submit"
                            class="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition">
                            Approve Selected
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Bulk Reject Modal -->
    <div class="modal fade mt-4" id="bulkRejectModal" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content bg-white rounded-2xl shadow-xl border border-gray-200">
                <div class="modal-header px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h5 class="text-lg font-semibold text-gray-800">Reject Selected @lmsterm('Study Materials')</h5>
                </div>
                <form id="bulkRejectForm">
                    <div class="modal-body px-6 py-5 space-y-4">
                        <div>
                            <label for="rejectReason" class="block text-sm font-medium text-gray-700 mb-1">
                                Rejection Reason <span class="text-rose-500">*</span>
                            </label>
                            <textarea id="rejectReason" name="reason" rows="3" required
                                class="w-full border border-gray-300 rounded-md p-3 text-sm text-gray-800 focus:ring-rose-500 focus:border-rose-500 transition"
                                placeholder="Please provide a reason for rejecting these @lmsterm('study materials')..."></textarea>
                        </div>
                        <div class="text-sm text-gray-600">
                            You have selected <span id="selectedCountReject"
                                class="font-semibold text-gray-800">0</span> @lmsterm('study material')(s) for rejection.
                        </div>
                    </div>
                    <div class="modal-footer px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                        <button type="button"
                            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition"
                            data-bs-dismiss="modal">
                            Cancel
                        </button>
                        <button type="submit"
                            class="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-md transition">
                            Reject Selected
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    @push('scripts')
        <script>
            // Select all functionality
            document.getElementById('selectAll').addEventListener('change', function() {
                const checkboxes = document.querySelectorAll('.study-material-checkbox');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = this.checked;
                });
                updateSelectedCount();
            });
            // Update selected count
            function updateSelectedCount() {
                const selected = document.querySelectorAll('.study-material-checkbox:checked');
                document.getElementById('selectedCount').textContent = selected.length;
                document.getElementById('selectedCountReject').textContent = selected.length;
            }
            // Listen for individual checkbox changes
            document.querySelectorAll('.study-material-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', updateSelectedCount);
            });
            // Show bulk approve modal
            function showBulkApproveModal() {
                const selected = document.querySelectorAll('.study-material-checkbox:checked');
                if (selected.length === 0) {
                    alert('Please select at least one study material to approve.');
                    return;
                }
                new bootstrap.Modal(document.getElementById('bulkApproveModal')).show();
            }
            // Show bulk reject modal
            function showBulkRejectModal() {
                const selected = document.querySelectorAll('.study-material-checkbox:checked');
                if (selected.length === 0) {
                    alert('Please select at least one study material to reject.');
                    return;
                }
                new bootstrap.Modal(document.getElementById('bulkRejectModal')).show();
            }
            // Handle bulk approve form submission
            document.getElementById('bulkApproveForm').addEventListener('submit', function(e) {
                e.preventDefault();
                const selected = Array.from(document.querySelectorAll('.study-material-checkbox:checked')).map(cb => cb.value);
                const notes = this.querySelector('[name="notes"]').value;
                fetch('{{ route('admin.course-approvals.bulk.approve') }}', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                    },
                    body: JSON.stringify({
                        study_material_ids: selected,
                        notes: notes
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        location.reload();
                    } else {
                        alert('Error: ' + data.message);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('An error occurred while approving study materials.');
                });
            });
            // Handle bulk reject form submission
            document.getElementById('bulkRejectForm').addEventListener('submit', function(e) {
                e.preventDefault();
                const selected = Array.from(document.querySelectorAll('.study-material-checkbox:checked')).map(cb => cb.value);
                const reason = this.querySelector('[name="reason"]').value;
                fetch('{{ route('admin.course-approvals.bulk.reject') }}', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                    },
                    body: JSON.stringify({
                        study_material_ids: selected,
                        reason: reason
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        location.reload();
                    } else {
                        alert('Error: ' + data.message);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('An error occurred while rejecting study materials.');
                });
            });
            // Quick approve function
            function quickApprove(studyMaterialId) {
                if (confirm('Are you sure you want to approve this study material?')) {
                    const form = document.createElement('form');
                    form.method = 'POST';
                    form.action = `/admin/course-approvals/${studyMaterialId}/approve`;
                    const csrfToken = document.createElement('input');
                    csrfToken.type = 'hidden';
                    csrfToken.name = '_token';
                    csrfToken.value = document.querySelector('meta[name="csrf-token"]').content;
                    form.appendChild(csrfToken);
                    document.body.appendChild(form);
                    form.submit();
                }
            }
            // Quick reject function
            function quickReject(studyMaterialId) {
                const reason = prompt('Please provide a reason for rejecting this study material:');
                if (reason && reason.trim()) {
                    const form = document.createElement('form');
                    form.method = 'POST';
                    form.action = `/admin/course-approvals/${studyMaterialId}/reject`;
                    const csrfToken = document.createElement('input');
                    csrfToken.type = 'hidden';
                    csrfToken.name = '_token';
                    csrfToken.value = document.querySelector('meta[name="csrf-token"]').content;
                    const reasonInput = document.createElement('input');
                    reasonInput.type = 'hidden';
                    reasonInput.name = 'reason';
                    reasonInput.value = reason;
                    form.appendChild(csrfToken);
                    form.appendChild(reasonInput);
                    document.body.appendChild(form);
                    form.submit();
                }
            }
        </script>
    @endpush
</x-dashboard-layout>
