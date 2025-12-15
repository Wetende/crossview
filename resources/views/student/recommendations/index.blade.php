<x-dashboard-layout>
    <x-slot name="title">Recommended @lmsterm('Study Materials')</x-slot>

    <x-slot name="sidebar">
        @include('layouts.partials.student.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.student.header')
    </x-slot>

    <div class="dashboard__content bg-light-4">
        <div class="row y-gap-20 justify-between items-end pb-30 mb-10">
            <div class="col-auto">
                <div class="d-flex items-center mb-10">
                    <div class="flex-center size-50 rounded-12 main-header-icon mr-20">
                        <i class="icon-target text-24 text-white"></i>
                    </div>
                    <div>
                        <h1 class="text-30 lh-12 fw-700 text-dark-1 -dark-text-white">Recommended @lmsterm('Study Materials')</h1>
<div class="text-15 text-light-1 mt-5">@lmsterm('Study Materials') tailored to help you improve and progress in your grade level</div>
                    </div>
                </div>
            </div>
            <div class="col-auto">
                <div class="d-flex items-center x-gap-15">
                    <div class="text-14 text-dark-1 -dark-text-white">Sort by:</div>
                    <select class="form-control -sm border-light rounded-8" id="sortRecommendations">
                        <option value="score">Improvement Priority</option>
                        <option value="subject">Subject</option>
                        <option value="newest">Newest @lmsterm('Study Materials')</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Performance Insights Card -->
        <div class="row mb-30">
            <div class="col-12">
                <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <div class="d-flex justify-between items-center mb-25">
                        <div class="d-flex items-center">
                            <div class="flex-center size-40 rounded-8 insights-header-icon mr-15">
                                <i class="icon-bar-chart text-18 text-white"></i>
                            </div>
                            <h3 class="text-20 lh-1 fw-500 text-dark-1">Your Learning Insights</h3>
                        </div>
                        <a href="{{ route('student.performance.overview') }}" class="text-14 text-purple-1 fw-500 underline">View Full Performance</a>
                    </div>
                    <div class="row y-gap-20">
                        <div class="col-xl-4 col-lg-6">
                            <div class="py-20 px-20 rounded-12 bg-red-2 border-1 border-red-3 performance-insight-card needs-attention">
                                <div class="d-flex items-center mb-15">
                                    <div class="flex-center size-45 rounded-8 bg-red-1 mr-15 insight-icon">
                                        <i class="icon-alert-triangle text-18 text-white"></i>
                                    </div>
                                    <div>
                                        <div class="text-16 fw-600 text-red-1">Needs Attention</div>
                                        <div class="text-13 text-red-1 mt-5">Subjects below 60% performance</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-xl-4 col-lg-6">
                            <div class="py-20 px-20 rounded-12 bg-orange-2 border-1 border-orange-3 performance-insight-card improvement">
                                <div class="d-flex items-center mb-15">
                                    <div class="flex-center size-45 rounded-8 bg-orange-1 mr-15 insight-icon">
                                        <i class="icon-trending-up text-18 text-white"></i>
                                    </div>
                                    <div>
                                        <div class="text-16 fw-600 text-orange-1">Room for Improvement</div>
                                        <div class="text-13 text-orange-1 mt-5">Subjects between 60-75% performance</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-xl-4 col-lg-6">
                            <div class="py-20 px-20 rounded-12 bg-green-2 border-1 border-green-3 performance-insight-card strong">
                                <div class="d-flex items-center mb-15">
                                    <div class="flex-center size-45 rounded-8 bg-green-1 mr-15 insight-icon">
                                        <i class="icon-check text-18 text-white"></i>
                                    </div>
                                    <div>
                                        <div class="text-16 fw-600 text-green-1">Strong Performance</div>
                                        <div class="text-13 text-green-1 mt-5">Subjects above 75% performance</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Filter Section -->
        <div class="row mb-30">
            <div class="col-12">
                <div class="py-25 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4 filter-section">
                    <div class="d-flex justify-between items-center mb-25">
                        <div class="d-flex items-center">
                            <div class="flex-center size-35 rounded-8 bg-light-3 -dark-bg-dark-3 mr-15">
                                <i class="icon-filter text-16 text-dark-1 -dark-text-white"></i>
                            </div>
                            <h3 class="text-18 fw-500 text-dark-1 -dark-text-white">Filter Recommendations</h3>
                        </div>
                        <button class="text-14 text-purple-1 fw-500 underline" id="resetFilters">Reset Filters</button>
                    </div>
                    <div class="row y-gap-20">
                        <div class="col-xl-3 col-lg-4 col-md-6">
                            <label class="text-14 fw-500 text-dark-1 mb-10 d-block">Priority Level</label>
                            <select class="form-control selectize-singular" id="priorityFilter">
                                <option value="">All Priorities</option>
                                <option value="high">High Priority (Needs Attention)</option>
                                <option value="medium">Medium Priority (Improvement)</option>
                                <option value="low">Low Priority (Continuation)</option>
                            </select>
                        </div>
                        <div class="col-xl-3 col-lg-4 col-md-6">
                            <label class="text-14 fw-500 text-dark-1 mb-10 d-block">Subject</label>
                            <select class="form-control selectize-singular" id="subjectFilter">
                                <option value="">All Subjects</option>
                                <!-- Will be populated via AJAX based on user's grade level -->
                            </select>
                        </div>
                        <div class="col-xl-3 col-lg-4 col-md-6">
                            <label class="text-14 fw-500 text-dark-1 mb-10 d-block">Category</label>
                            <select class="form-control selectize-singular" id="categoryFilter">
                                <option value="">All Categories</option>
                                <!-- Will be populated via AJAX based on user's grade level -->
                            </select>
                        </div>
                        <div class="col-xl-3 col-lg-4 col-md-6">
                            <label class="text-14 fw-500 text-dark-1 mb-10 d-block">Teacher Quality</label>
                            <select class="form-control selectize-singular" id="teacherFilter">
                                <option value="">All Teachers</option>
                                <option value="high_success">High Success Rate (75%+)</option>
                                <option value="proven">Proven Track Record</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col-12" id="recommendationsContainer">
                <x-recommended-courses :recommendations="$recommendations" :title="$title" />
            </div>
        </div>
    </div>

    @push('styles')
    <style>
        .performance-insight-card {
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .performance-insight-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }
        
        .performance-insight-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
        }
        
        .performance-insight-card.needs-attention::before {
            background: linear-gradient(90deg, #ef4444, #dc2626);
        }
        
        .performance-insight-card.improvement::before {
            background: linear-gradient(90deg, #f97316, #ea580c);
        }
        
        .performance-insight-card.strong::before {
            background: linear-gradient(90deg, #22c55e, #16a34a);
        }
        
        .insight-icon {
            transition: all 0.3s ease;
        }
        
        .performance-insight-card:hover .insight-icon {
            transform: scale(1.1);
        }
        
        .filter-section {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border: 1px solid #e2e8f0;
        }
        
        .main-header-icon {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
        }
        
        .insights-header-icon {
            background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
            box-shadow: 0 2px 10px rgba(168, 85, 247, 0.2);
        }
    </style>
    @endpush

    @push('scripts')
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize selectize dropdowns
            if (typeof $ !== 'undefined' && $.fn.selectize) {
                $('.selectize-singular').selectize({
                    create: false,
                    sortField: 'text'
                });
            }

            // Handle filter changes
            const filterElements = ['#sortRecommendations', '#priorityFilter', '#subjectFilter', '#categoryFilter', '#teacherFilter'];
            
            filterElements.forEach(selector => {
                const element = document.querySelector(selector);
                if (element) {
                    element.addEventListener('change', loadFilteredRecommendations);
                }
            });

            // Reset filters
            const resetButton = document.getElementById('resetFilters');
            if (resetButton) {
                resetButton.addEventListener('click', function() {
                    filterElements.forEach(selector => {
                        const element = document.querySelector(selector);
                        if (element) {
                            if (element.selectize) {
                                element.selectize.clear();
                            } else {
                                element.value = '';
                            }
                        }
                    });
                    loadFilteredRecommendations();
                });
            }

            function loadFilteredRecommendations() {
                const container = document.getElementById('recommendationsContainer');
                if (!container) return;

                // Show loading state
                container.innerHTML = '<div class="text-center py-40"><div class="text-18 fw-500">Loading performance-based recommendations...</div></div>';

                // Collect filter values
                const filters = {
                    sort: document.getElementById('sortRecommendations')?.value || 'score',
                    priority: document.getElementById('priorityFilter')?.value || '',
                    subject: document.getElementById('subjectFilter')?.value || '',
                    category: document.getElementById('categoryFilter')?.value || '',
                    teacher: document.getElementById('teacherFilter')?.value || ''
                };

                // Make AJAX request
                fetch('{{ route("student.api.recommendations") }}?' + new URLSearchParams(filters))
                    .then(response => response.json())
                    .then(data => {
                        // Update the recommendations container
                        // This would need server-side logic to return filtered HTML or JSON
                        window.location.reload(); // Temporary - should be replaced with proper AJAX update
                    })
                    .catch(error => {
                        console.error('Error loading recommendations:', error);
                        container.innerHTML = '<div class="text-center py-40"><div class="text-18 fw-500 text-red-1">Error loading recommendations</div></div>';
                    });
            }
        });
    </script>
    @endpush

</x-dashboard-layout> 