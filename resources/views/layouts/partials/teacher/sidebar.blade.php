<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ config('app.short_name', 'Crossview College') }} - Teacher Dashboard</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        :root {
            --primary-color: #2563eb;
            --primary-hover: #1d4ed8;
            --sidebar-width: 260px;
            --sidebar-bg: #ffffff;
            --sidebar-text: #374151;
            --sidebar-text-light: #6b7280;
            --sidebar-border: #e5e7eb;
            --sidebar-active-bg: #eff6ff;
            --sidebar-hover-bg: #f9fafb;
            --mobile-toggle-size: 50px;
            --transition-speed: 0.3s;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f9fafb;
            color: #374151;
            line-height: 1.6;
        }

        /* Sidebar Styles */
        .sidebar {
            width: var(--sidebar-width);
            height: 100vh;
            background: var(--sidebar-bg);
            border-right: 1px solid var(--sidebar-border);
            position: fixed;
            left: 0;
            top: 0;
            overflow-y: auto;
            z-index: 1000;
            transition: transform var(--transition-speed) ease;
            display: flex;
            flex-direction: column;
        }

        .profile-area {
            padding: 1.5rem;
            border-bottom: 1px solid var(--sidebar-border);
            text-align: center;
            position: relative;
        }

        .avatar {
            width: 70px;
            height: 70px;
            background: #f3f4f6;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 0.75rem;
            font-size: 1.75rem;
            color: var(--sidebar-text-light);
            transition: all 0.2s ease;
        }

        .profile-info h3 {
            margin: 0 0 0.25rem 0;
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--sidebar-text);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .profile-info p {
            margin: 0;
            font-size: 0.875rem;
            color: var(--sidebar-text-light);
            font-weight: 500;
        }

        .nav-menu {
            padding: 1rem 0;
            flex-grow: 1;
            overflow-y: auto;
        }

        .nav-section {
            margin-bottom: 1.5rem;
        }

        .nav-section-title {
            padding: 0 1.25rem 0.5rem;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            color: var(--sidebar-text-light);
            margin: 0;
            letter-spacing: 0.5px;
        }

        .nav-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .nav-item {
            margin-bottom: 0.125rem;
        }

        .nav-link {
            display: flex;
            align-items: center;
            padding: 0.75rem 1.25rem;
            color: var(--sidebar-text-light);
            text-decoration: none;
            transition: all 0.2s ease;
            position: relative;
            font-size: 0.9375rem;
            font-weight: 500;
        }

        .nav-link:hover {
            background: var(--sidebar-hover-bg);
            color: var(--sidebar-text);
        }

        .nav-link.active {
            background: var(--sidebar-active-bg);
            color: var(--primary-color);
            border-right: 3px solid var(--primary-color);
            font-weight: 600;
        }

        .nav-link i {
            width: 1.25rem;
            margin-right: 0.75rem;
            font-size: 1rem;
            text-align: center;
        }

        .divider {
            height: 1px;
            background: var(--sidebar-border);
            margin: 1.25rem 0;
        }

        .footer {
            padding: 1rem;
            text-align: center;
            font-size: 0.75rem;
            color: var(--sidebar-text-light);
            border-top: 1px solid var(--sidebar-border);
            margin-top: auto;
        }

        /* Mobile Toggle Button */
        .mobile-toggle {
            display: none;
            position: fixed;
            top: 1rem;
            left: 1rem;
            z-index: 1001;
            background: var(--sidebar-bg);
            border: 1px solid var(--sidebar-border);
            border-radius: 8px;
            width: var(--mobile-toggle-size);
            height: var(--mobile-toggle-size);
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: all var(--transition-speed) ease;
        }

        .mobile-toggle:hover {
            background: var(--sidebar-hover-bg);
        }

        .mobile-toggle i {
            font-size: 1.25rem;
            color: var(--sidebar-text);
        }

        /* Overlay for mobile */
        .sidebar-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
            backdrop-filter: blur(2px);
            -webkit-backdrop-filter: blur(2px);
        }

        /* Dropdown functionality */
        .nav-dropdown {
            display: none;
            margin-left: 1.25rem;
            padding-left: 0.9375rem;
            border-left: 1px solid rgba(0,0,0,0.1);
        }
        
        .active + .nav-dropdown,
        .dropdown-toggle.active + .nav-dropdown {
            display: block;
        }

        /* Main content area */
        .main-content {
            margin-left: var(--sidebar-width);
            padding: 1.5rem;
            transition: margin-left var(--transition-speed) ease;
            min-height: 100vh;
        }

        /* Badge for notifications */
        .badge {
            position: absolute;
            right: 1.25rem;
            background: var(--primary-color);
            color: white;
            border-radius: 10px;
            padding: 0.125rem 0.375rem;
            font-size: 0.6875rem;
            font-weight: 600;
        }

        /* Mobile styles */
        @media (max-width: 992px) {
            .mobile-toggle {
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .sidebar {
                transform: translateX(-100%);
                box-shadow: 2px 0 10px rgba(0,0,0,0.1);
            }

            .sidebar.show {
                transform: translateX(0);
            }

            .sidebar-overlay.show {
                display: block;
            }

            .main-content {
                margin-left: 0;
                padding-top: calc(var(--mobile-toggle-size) + 1rem);
            }
        }

        /* Dark mode toggle */
        .theme-toggle {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0.5rem;
            margin: 0.5rem auto;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .theme-toggle:hover {
            background: var(--sidebar-hover-bg);
        }

        /* Animation for sidebar items */
        @keyframes fadeIn {
            from { opacity: 0; transform: translateX(-10px); }
            to { opacity: 1; transform: translateX(0); }
        }

        .nav-item {
            animation: fadeIn 0.3s ease forwards;
            opacity: 0;
        }

        .nav-item:nth-child(1) { animation-delay: 0.1s; }
        .nav-item:nth-child(2) { animation-delay: 0.15s; }
        .nav-item:nth-child(3) { animation-delay: 0.2s; }
        .nav-item:nth-child(4) { animation-delay: 0.25s; }
        .nav-item:nth-child(5) { animation-delay: 0.3s; }
        /* Add more as needed */
    </style>
</head>
<body>
    <!-- Mobile toggle button -->
    <button class="mobile-toggle" id="mobileToggle" aria-label="Toggle sidebar">
        <i class="fas fa-bars"></i>
    </button>

    <!-- Sidebar overlay for mobile -->
    <div class="sidebar-overlay" id="sidebarOverlay"></div>

    <!-- Sidebar -->
    <div id="sidebar" class="sidebar light-theme">
        <div class="profile-area">
            <div class="avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="profile-info">
                <h3>{{ Auth::user()->name ?? 'Teacher Name' }}</h3>
                <p>{{ Auth::user()->roles->first()->name ?? 'Teacher' }}</p>
            </div>
        </div>

        <nav class="nav-menu">
            <div class="nav-section">
                <ul class="nav-list">
                    <li class="nav-item">
                        <a href="{{ route('teacher.overview') }}" class="nav-link {{ request()->routeIs('teacher.overview*') ? 'active' : '' }}">
                            <i class="fas fa-th-large"></i>
                            <span>Dashboard</span>
                            <span class="badge">3</span>
                        </a>
                    </li>
                </ul>
            </div>
            
            <div class="nav-section">
                <p class="nav-section-title">@lmsterm('Study Material') Management</p>
                <ul class="nav-list">
                    <li class="nav-item">
                        <a href="{{ route('teacher.courses.index') }}" class="nav-link {{ request()->routeIs('teacher.courses.index') || request()->routeIs('teacher.courses.edit') ? 'active' : '' }}">
                            <i class="fas fa-book"></i>
                            <span>My @lmsterm('Study Materials')</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="{{ route('teacher.courses.create') }}" class="nav-link {{ request()->routeIs('teacher.courses.create') ? 'active' : '' }}">
                            <i class="fas fa-plus-circle"></i>
                            <span>Create @lmsterm('Study Material')</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="{{ route('teacher.questions.library.index') }}" class="nav-link {{ request()->routeIs('teacher.questions.library.*') ? 'active' : '' }}">
                            <i class="fas fa-book-open"></i>
                            <span>Question Library</span>
                            <span class="badge">New</span>
                        </a>
                    </li>
                </ul>
            </div>
            
            <div class="nav-section">
                <p class="nav-section-title">Student Management</p>
                <ul class="nav-list">
                    <li class="nav-item">
                        <a href="{{ route('teacher.gradebook.index') }}" class="nav-link {{ request()->routeIs('teacher.gradebook.index') ? 'active' : '' }}">
                            <i class="fas fa-graduation-cap"></i>
                            <span>Gradebook</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="{{ route('teacher.reviews.index') }}" class="nav-link {{ request()->routeIs('teacher.reviews.index') ? 'active' : '' }}">
                            <i class="fas fa-star"></i>
                            <span>Reviews</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="{{ route('teacher.forums.index') }}" class="nav-link {{ request()->routeIs('teacher.forums.index') ? 'active' : '' }}">
                            <i class="fas fa-comments"></i>
                            <span>Forum Management</span>
                            <span class="badge">5</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="{{ route('teacher.messages.index') }}" class="nav-link {{ request()->routeIs('teacher.messages.index') ? 'active' : '' }}">
                            <i class="fas fa-envelope"></i>
                            <span>Messages</span>
                            <span class="badge">12</span>
                        </a>
                    </li>
                </ul>
            </div>
            
            <div class="nav-section">
                <p class="nav-section-title">Analytics & Progress</p>
                <ul class="nav-list">
                    <li class="nav-item">
                        <a href="{{ route('teacher.analytics.index') }}" class="nav-link {{ request()->routeIs('teacher.analytics.*') ? 'active' : '' }}">
                            <i class="fas fa-chart-bar"></i>
                            <span>Analytics</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="{{ route('teacher.students.progress') }}" class="nav-link {{ request()->routeIs('teacher.students.progress*') ? 'active' : '' }}">
                            <i class="fas fa-user-graduate"></i>
                            <span>Student Progress</span>
                        </a>
                    </li>
                </ul>
            </div>
            
            <div class="nav-section">
                <p class="nav-section-title">Finance</p>
                <ul class="nav-list">
                    <li class="nav-item">
                        <a href="{{ route('teacher.payment-details.index') }}" class="nav-link {{ request()->routeIs('teacher.payment-details.*') ? 'active' : '' }}">
                            <i class="fas fa-money-check-alt"></i>
                            <span>Payment Details</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="{{ route('teacher.payouts.index') }}" class="nav-link {{ request()->routeIs('teacher.payouts.*') ? 'active' : '' }}">
                            <i class="fas fa-wallet"></i>
                            <span>Payout History</span>
                        </a>
                    </li>
                </ul>
            </div>
            
            <div class="nav-section">
                <p class="nav-section-title">Organization</p>
                <ul class="nav-list">
                    <li class="nav-item">
                        <a href="{{ route('teacher.calendar.index') }}" class="nav-link {{ request()->routeIs('teacher.calendar.index') ? 'active' : '' }}">
                            <i class="fas fa-calendar-alt"></i>
                            <span>My Calendar</span>
                        </a>
                    </li>
                </ul>
            </div>
            
            <div class="divider"></div>
            
            <div class="nav-section">
                <ul class="nav-list">
                    <li class="nav-item">
                        <a href="{{ route('teacher.settings.profile') }}" class="nav-link {{ request()->routeIs('teacher.settings.profile') ? 'active' : '' }}">
                            <i class="fas fa-cog"></i>
                            <span>Settings</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#" onclick="event.preventDefault(); document.getElementById('logout-form-teacher-sidebar').submit();" class="nav-link">
                            <i class="fas fa-power-off"></i>
                            <span>Logout</span>
                        </a>
                    </li>
                </ul>
            </div>
        </nav>

        <div class="footer">
            <span>&copy; {{ date('Y') }} {{ config('app.name') }}</span>
        </div>
    </div>


    <form id="logout-form-teacher-sidebar" action="{{ route('logout') }}" method="POST" style="display: none;">
        @csrf
    </form>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // DOM Elements
            const mobileToggle = document.getElementById('mobileToggle');
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebarOverlay');
            const themeToggle = document.getElementById('themeToggle');
            const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
            
            // Mobile toggle functionality
            mobileToggle.addEventListener('click', function() {
                sidebar.classList.toggle('show');
                overlay.classList.toggle('show');
                this.setAttribute('aria-expanded', sidebar.classList.contains('show'));
            });
            
            // Close sidebar when overlay is clicked
            overlay.addEventListener('click', function() {
                sidebar.classList.remove('show');
                overlay.classList.remove('show');
                mobileToggle.setAttribute('aria-expanded', 'false');
            });
            
            // Close sidebar when a nav link is clicked on mobile
            const navLinks = document.querySelectorAll('.nav-link:not(.dropdown-toggle)');
            navLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                    if (window.innerWidth <= 992 && !this.classList.contains('dropdown-toggle')) {
                        sidebar.classList.remove('show');
                        overlay.classList.remove('show');
                        mobileToggle.setAttribute('aria-expanded', 'false');
                    }
                });
            });

            // Theme toggle functionality
            themeToggle.addEventListener('click', function() {
                const isDark = document.body.classList.toggle('dark-theme');
                localStorage.setItem('theme', isDark ? 'dark' : 'light');
                this.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
            });

            // Check for saved theme preference
            if (localStorage.getItem('theme') === 'dark') {
                document.body.classList.add('dark-theme');
                themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            }

            // Dropdown functionality
            dropdownToggles.forEach(toggle => {
                toggle.addEventListener('click', function(e) {
                    e.preventDefault();
                    const dropdown = this.nextElementSibling;
                    if (dropdown && dropdown.classList.contains('nav-dropdown')) {
                        this.classList.toggle('active');
                        dropdown.style.display = this.classList.contains('active') ? 'block' : 'none';
                    }
                });
            });
            
            // Auto-open dropdown if it contains an active link
            dropdownToggles.forEach(toggle => {
                const dropdown = toggle.nextElementSibling;
                if (dropdown && dropdown.classList.contains('nav-dropdown')) {
                    const hasActiveLink = dropdown.querySelector('.active');
                    if (hasActiveLink) {
                        toggle.classList.add('active');
                        dropdown.style.display = 'block';
                    }
                }
            });

            // Close sidebar when clicking outside on desktop
            document.addEventListener('click', function(e) {
                if (window.innerWidth > 992 && !sidebar.contains(e.target) && e.target !== mobileToggle) {
                    sidebar.classList.remove('show');
                    overlay.classList.remove('show');
                }
            });

            // Keyboard accessibility
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && sidebar.classList.contains('show')) {
                    sidebar.classList.remove('show');
                    overlay.classList.remove('show');
                    mobileToggle.setAttribute('aria-expanded', 'false');
                }
            });
        });
    </script>

    <style>
        /* Dark theme styles */
        body.dark-theme {
            --sidebar-bg: #1f2937;
            --sidebar-text: #f9fafb;
            --sidebar-text-light: #d1d5db;
            --sidebar-border: #374151;
            --sidebar-active-bg: #1e40af;
            --sidebar-hover-bg: #374151;
            background-color: #111827;
            color: #f3f4f6;
        }

        body.dark-theme .main-content {
            background-color: #111827;
        }

        body.dark-theme .mobile-toggle {
            background: #1f2937;
            border-color: #374151;
        }

        body.dark-theme .mobile-toggle i {
            color: #f9fafb;
        }

        body.dark-theme .badge {
            background: #3b82f6;
        }
    </style>
</body>
</html>