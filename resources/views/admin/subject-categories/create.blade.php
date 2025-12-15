<x-dashboard-layout title="Create Subject Category">
    <x-slot name="sidebar">
        @include('layouts.partials.admin.sidebar')
    </x-slot>
    <x-slot name="header">
        @include('layouts.partials.admin.header')
    </x-slot>

    <div class="row y-gap-20 justify-between items-end pb-30">
        <div class="col-auto">
            <h1 class="text-30 lh-12 fw-700">Create Subject Category</h1>
            <div class="mt-10">Add a new subject category for the Kenya CBC curriculum</div>
        </div>
        <div class="col-auto">
            <a href="{{ route('admin.subject-categories.index') }}" class="button -md -light-3 text-dark-1">
                <i class="icon-arrow-left mr-10"></i>
                Back to Categories
            </a>
        </div>
    </div>

    <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
        <form action="{{ route('admin.subject-categories.store') }}" method="POST">
            @csrf
            
            <div class="row y-gap-30">
                <div class="col-12">
                    <div class="form-group">
                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="name">Name *</label>
                        <input type="text" name="name" id="name" class="form-control @error('name') is-invalid @enderror" value="{{ old('name') }}" required>
                        @error('name')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                    </div>
                </div>

                <div class="col-12">
                    <div class="form-group">
                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="description">Description</label>
                        <textarea name="description" id="description" rows="4" class="form-control @error('description') is-invalid @enderror">{{ old('description') }}</textarea>
                        @error('description')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                    </div>
                </div>

                <div class="col-md-6">
                    <div class="form-group">
                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="level">Level *</label>
                        <select name="level" id="level" class="form-select @error('level') is-invalid @enderror" required>
                            <option value="" disabled selected>Select a level</option>
                            <option value="Junior Secondary" {{ old('level') == 'Junior Secondary' ? 'selected' : '' }}>Junior Secondary (Grades 7–9)</option>
                            <option value="Senior School" {{ old('level') == 'Senior School' ? 'selected' : '' }}>Senior School (Grades 10–12)</option>
                        </select>
                        @error('level')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                    </div>
                </div>

                <div class="col-md-6">
                    <div class="form-group">
                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="position">Position</label>
                        <input type="number" name="position" id="position" class="form-control @error('position') is-invalid @enderror" value="{{ old('position', 0) }}" min="0">
                        @error('position')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                        <div class="form-text text-14 mt-5">Order in which this category appears. Lower numbers appear first.</div>
                    </div>
                </div>

                <div class="col-12">
                    <div class="form-switch d-flex items-center">
                        <div class="switch">
                            <input type="checkbox" name="is_active" id="is_active" value="1" {{ old('is_active', true) ? 'checked' : '' }}>
                            <label for="is_active"></label>
                        </div>
                        <div class="text-16 ml-10">Active</div>
                    </div>
                    <div class="form-text text-14 mt-5">Inactive categories will not be displayed to users.</div>
                </div>

                <div class="col-12 mt-30">
                    <button type="submit" class="button -md -purple-1 text-white">
                        Create Category
                    </button>
                    <a href="{{ route('admin.subject-categories.index') }}" class="button -md -light-3 text-dark-1 ml-10">
                        Cancel
                    </a>
                </div>
            </div>
        </form>
    </div>

    @push('scripts')
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize select dropdowns
            const selects = document.querySelectorAll('.form-select');
            selects.forEach(select => {
                new TomSelect(select, {
                    create: false,
                    allowEmptyOption: false
                });
            });
        });
    </script>
    @endpush
</x-dashboard-layout> 