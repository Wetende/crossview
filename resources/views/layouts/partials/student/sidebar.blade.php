<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Responsive Student Sidebar</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
        }

        /* Main content wrapper */
        .main-wrapper {
            display: flex;
            min-height: 100vh;
        }

        /* Desktop Sidebar Styles */
        #sidebar-student {
            width: 280px;
            min-height: 100vh;
            background: linear-gradient(135deg, #fff 0%, #fff 100%);
            color: black;
            position: fixed;
            left: 0;
            top: 0;
            z-index: 1000;
            transition: transform 0.3s ease;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
        }

        /* Mobile Navbar Toggle */
        .navbar-toggle {
            display: none;
            position: fixed;
            top: 15px;
            left: 15px;
            z-index: 1001;
            background: linear-gradient(135deg, #fff 0%, #fff 100%);
            color: black;
            border: none;
            padding: 12px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 18px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .navbar-toggle:hover {
            transform: scale(1.05);
        }

        /* Profile Area */
        .profile-area {
            padding: 30px 20px;
            text-align: center;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            background: rgba(255,255,255,0.05);
        }

        .avatar {
            width: 80px;
            height: 80px;
            margin: 0 auto 15px;
            background: rgba(255,255,255,0.1);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            backdrop-filter: blur(10px);
        }

        .profile-info h3 {
            font-size: 20px;
            margin-bottom: 5px;
            font-weight: 600;
        }

        .profile-info p {
            font-size: 14px;
            opacity: 0.8;
            font-weight: 300;
        }

        /* Navigation Menu */
        .nav-menu {
            flex: 1;
            padding: 20px 0;
        }

        .nav-section {
            margin-bottom: 25px;
            padding: 0 20px;
        }

        .nav-section-title {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            opacity: 0.6;
            margin-bottom: 12px;
            padding-left: 5px;
        }

        .nav-list {
            list-style: none;
        }

        .nav-item {
            margin-bottom: 5px;
        }

        .nav-link {
            display: flex;
            align-items: center;
            padding: 12px 15px;
            color: rgba(255,255,255,0.8);
            text-decoration: none;
            border-radius: 10px;
            transition: all 0.3s ease;
            font-size: 14px;
            position: relative;
            overflow: hidden;
        }

        .nav-link:hover {
            background: rgba(255,255,255,0.1);
            color: white;
            transform: translateX(5px);
        }

        .nav-link.active {
            background: rgba(255,255,255,0.15);
            color: white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .nav-link i {
            width: 20px;
            margin-right: 12px;
            font-size: 16px;
        }

        .divider {
            height: 1px;
            background: rgba(255,255,255,0.1);
            margin: 20px;
        }

        /* Footer */
        .footer {
            padding: 20px;
            text-align: center;
            font-size: 12px;
            opacity: 0.6;
            border-top: 1px solid rgba(255,255,255,0.1);
            margin-top: auto;
        }

        /* Main Content */
        .main-content {
            margin-left: 280px;
            padding: 30px;
            flex: 1;
            transition: margin-left 0.3s ease;
        }

        .demo-content {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }

        /* Mobile Styles */
        @media (max-width: 768px) {
            .navbar-toggle {
                display: block;
            }

            #sidebar-student {
                transform: translateX(-100%);
                width: 100%;
                max-width: 320px;
            }

            #sidebar-student.show {
                transform: translateX(0);
            }

            .main-content {
                margin-left: 0;
                padding: 80px 20px 20px;
            }

            /* Mobile overlay */
            .sidebar-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 999;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }

            .sidebar-overlay.show {
                opacity: 1;
                visibility: visible;
            }

            /* Adjust profile area for mobile */
            .profile-area {
                padding: 20px;
            }

            .avatar {
                width: 60px;
                height: 60px;
                font-size: 24px;
            }

            .profile-info h3 {
                font-size: 18px;
            }

            /* Close button for mobile */
            .sidebar-close {
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                padding: 8px;
                border-radius: 4px;
                opacity: 0.7;
            }

            .sidebar-close:hover {
                opacity: 1;
                background: rgba(255,255,255,0.1);
            }
        }

        /* Extra small devices */
        @media (max-width: 480px) {
            #sidebar-student {
                width: 100%;
                max-width: 100%;
            }

            .main-content {
                padding: 70px 15px 15px;
            }

            .demo-content {
                padding: 20px;
            }
        }

        /* Animation for nav items */
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateX(-20px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        .nav-item {
            animation: slideIn 0.3s ease forwards;
        }

        .nav-item:nth-child(1) { animation-delay: 0.1s; }
        .nav-item:nth-child(2) { animation-delay: 0.15s; }
        .nav-item:nth-child(3) { animation-delay: 0.2s; }
        .nav-item:nth-child(4) { animation-delay: 0.25s; }
        .nav-item:nth-child(5) { animation-delay: 0.3s; }
    </style>
</head>
<body>
    <!-- Mobile navbar toggle button -->
    <button class="navbar-toggle" onclick="toggleSidebar()">
        <i class="fas fa-bars"></i>
    </button>

    <!-- Sidebar overlay for mobile -->
    <div class="sidebar-overlay" onclick="closeSidebar()"></div>

    <div class="main-wrapper">
        <div id="sidebar-student" class="sidebar light-theme">
            <!-- Close button for mobile -->
            <button class="sidebar-close" onclick="closeSidebar()" style="display: none;">
                <i class="fas fa-times"></i>
            </button>

            <!-- Student Profile Area -->
            <div class="profile-area">
                <div class="avatar">
                    <i class="fas fa-user-graduate"></i>
                </div>
                <div class="profile-info">
                    <h3>{{ Auth::user()->name ?? 'Student Name' }}</h3>
                    <p>Student</p>
                </div>
            </div>

            <nav class="nav-menu">
                <!-- Main Section -->
                <div class="nav-section">
                    <p class="nav-section-title">Dashboard</p>
                    <ul class="nav-list">
                        <li class="nav-item">
                            <a href="{{ route('student.overview') }}" class="nav-link {{ request()->routeIs('student.overview*') ? 'active' : '' }}">
                                <i class="fas fa-th-large"></i>
                                <span>Dashboard</span>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a href="{{ route('student.my-learning') }}" class="nav-link {{ request()->routeIs('student.my-learning') ? 'active' : '' }}">
                                <i class="fas fa-book"></i>
                                <span>My @lmsterm('Study Materials')</span>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a href="{{ route('student.calendar.index') }}" class="nav-link {{ request()->routeIs('student.calendar.*') ? 'active' : '' }}">
                                <i class="fas fa-calendar-alt"></i>
                                <span>My Calendar</span>
                            </a>
                        </li>
                    </ul>
                </div>

                <!-- Engagement Section -->
                <div class="nav-section">
                    <p class="nav-section-title">Engagement</p>
                    <ul class="nav-list">
                        <li class="nav-item">
                            <a href="{{ route('student.forums.index') }}" class="nav-link {{ request()->routeIs('student.forums.*') ? 'active' : '' }}">
                                <i class="fas fa-comments"></i>
                                <span>Forums</span>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a href="{{ route('student.messages') }}" class="nav-link {{ request()->routeIs('student.messages*') ? 'active' : '' }}">
                                <i class="fas fa-envelope"></i>
                                <span>Messages</span>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a href="{{ route('student.connections.requests') }}" class="nav-link {{ request()->routeIs('student.connections.requests*') ? 'active' : '' }}">
                                <i class="fas fa-users"></i>
                                <span>Connections</span>
                            </a>
                        </li>
                    </ul>
                </div>

                <!-- Academics Section -->
                <div class="nav-section">
                    <p class="nav-section-title">Academics</p>
                    <ul class="nav-list">
                        <li class="nav-item">
                            <a href="{{ route('student.assessments.index') }}" class="nav-link {{ request()->routeIs('student.assessments.*') ? 'active' : '' }}">
                                <i class="fas fa-file-alt"></i>
                                <span>Assessments</span>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a href="{{ route('student.grades.index') }}" class="nav-link {{ request()->routeIs('student.grades.*') ? 'active' : '' }}">
                                <i class="fas fa-graduation-cap"></i>
                                <span>Grades</span>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a href="{{ route('student.bookmarked-courses') }}" class="nav-link {{ request()->routeIs('student.bookmarked-courses') ? 'active' : '' }}">
                                <i class="fas fa-bookmark"></i>
                                <span>Bookmarked @lmsterm('Study Materials')</span>
                            </a>
                        </li>
                    </ul>
                </div>

                <!-- Achievements Section -->
                <div class="nav-section">
                    <p class="nav-section-title">Achievements</p>
                    <ul class="nav-list">
                        <li class="nav-item">
                            <a href="{{ route('student.badges.index') }}" class="nav-link {{ request()->routeIs('student.badges.*') ? 'active' : '' }}">
                                <i class="fas fa-medal"></i>
                                <span>My Badges</span>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a href="{{ route('student.my-certificates') }}" class="nav-link {{ request()->routeIs('student.my-certificates') ? 'active' : '' }}">
                                <i class="fas fa-certificate"></i>
                                <span>My Certificates</span>
                            </a>
                        </li>
                    </ul>
                </div>
                
                <!-- Discovery Section -->
                <div class="nav-section">
                    <p class="nav-section-title">Discovery</p>
                    <ul class="nav-list">
                        <li class="nav-item">
                            <a href="{{ route('student.recommendations') }}" class="nav-link {{ request()->routeIs('student.recommendations') ? 'active' : '' }}">
                                <i class="fas fa-lightbulb"></i>
                                <span>Recommendations</span>
                            </a>
                        </li>
                    </ul>
                </div>

                <div class="divider"></div>

                <div class="nav-section">
                    <ul class="nav-list">
                        <li class="nav-item">
                            <a href="{{ route('student.settings') }}" class="nav-link {{ request()->routeIs('student.settings') ? 'active' : '' }}">
                                <i class="fas fa-user-cog"></i>
                                <span>My Profile</span>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a href="#" onclick="event.preventDefault(); document.getElementById('logout-form-student-sidebar').submit();" class="nav-link">
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
    </div>

    <form id="logout-form-student-sidebar" action="{{ route('logout') }}" method="POST" style="display: none;">
        @csrf
    </form>

    <script>
        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar-student');
            const overlay = document.querySelector('.sidebar-overlay');
            const closeBtn = document.querySelector('.sidebar-close');
            sidebar.classList.toggle('show');
            overlay.classList.toggle('show');
            if (window.innerWidth <= 768) {
                closeBtn.style.display = sidebar.classList.contains('show') ? 'block' : 'none';
            }
        }
      
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    closeSidebar();
                }
            });
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            const sidebar = document.getElementById('sidebar-student');
            const overlay = document.querySelector('.sidebar-overlay');
            const closeBtn = document.querySelector('.sidebar-close');
            if (window.innerWidth > 768) {
                sidebar.classList.remove('show');
                overlay.classList.remove('show');
                closeBtn.style.display = 'none';
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeSidebar();
            }
        });
    </script>
</body>
</html>