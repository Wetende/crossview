<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Responsive Parent Sidebar</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8f9fa;
        }

        /* Desktop Sidebar Styles */
        .sidebar {
            position: fixed;
            left: 0;
            top: 0;
            width: 280px;
            height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            overflow-y: auto;
            transition: transform 0.3s ease;
            z-index: 1000;
            display: flex;
            flex-direction: column;
        }

        .sidebar.light-theme {
            background: #ffffff;
            color: #333;
            box-shadow: 2px 0 15px rgba(0, 0, 0, 0.1);
        }

        .profile-area {
            padding: 2rem 1.5rem;
            text-align: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .light-theme .profile-area {
            border-bottom: 1px solid #e9ecef;
        }

        .avatar {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1rem;
            font-size: 2rem;
        }

        .light-theme .avatar {
            background: #f8f9fa;
            color: #667eea;
        }

        .profile-info h3 {
            margin-bottom: 0.5rem;
            font-weight: 600;
        }

        .profile-info p {
            opacity: 0.8;
            font-size: 0.9rem;
        }

        .nav-menu {
            flex: 1;
            padding: 1rem 0;
        }

        .nav-section {
            margin-bottom: 1.5rem;
        }

        .nav-section-title {
            padding: 0 1.5rem 0.5rem;
            font-size: 0.75rem;
            text-transform: uppercase;
            font-weight: 600;
            opacity: 0.7;
            letter-spacing: 0.5px;
        }

        .nav-list {
            list-style: none;
        }

        .nav-item {
            margin-bottom: 0.25rem;
        }

        .nav-link {
            display: flex;
            align-items: center;
            padding: 0.75rem 1.5rem;
            color: inherit;
            text-decoration: none;
            transition: all 0.3s ease;
            position: relative;
        }

        .nav-link:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: translateX(5px);
        }

        .light-theme .nav-link:hover {
            background: #f8f9fa;
            color: #667eea;
        }

        .nav-link.active {
            background: rgba(255, 255, 255, 0.2);
            border-right: 3px solid #fff;
        }

        .light-theme .nav-link.active {
            background: #667eea;
            color: white;
            border-right: 3px solid #667eea;
        }

        .nav-link i {
            width: 20px;
            margin-right: 0.75rem;
            font-size: 1rem;
        }

        .divider {
            height: 1px;
            background: rgba(255, 255, 255, 0.1);
            margin: 1rem 1.5rem;
        }

        .light-theme .divider {
            background: #e9ecef;
        }

        .footer {
            padding: 1rem 1.5rem;
            text-align: center;
            font-size: 0.8rem;
            opacity: 0.7;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .light-theme .footer {
            border-top: 1px solid #e9ecef;
        }

        /* Mobile Navbar Styles */
        .mobile-navbar {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #ffffff;
            box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
            z-index: 1001;
            padding: 1rem;
        }

        .navbar-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .navbar-brand {
            display: flex;
            align-items: center;
            font-weight: 600;
            color: #333;
        }

        .navbar-brand i {
            margin-right: 0.5rem;
            color: #667eea;
        }

        .mobile-toggle {
            background: none;
            border: none;
            font-size: 1.5rem;
            color: #333;
            cursor: pointer;
            padding: 0.5rem;
        }

        .mobile-menu {
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            max-height: 80vh;
            overflow-y: auto;
        }

        .mobile-menu.active {
            display: block;
        }

        .mobile-profile {
            padding: 1.5rem;
            text-align: center;
            border-bottom: 1px solid #e9ecef;
        }

        .mobile-profile .avatar {
            width: 60px;
            height: 60px;
            font-size: 1.5rem;
        }

        .mobile-nav-section {
            padding: 1rem 0;
            border-bottom: 1px solid #f8f9fa;
        }

        .mobile-nav-section:last-child {
            border-bottom: none;
        }

        .mobile-nav-title {
            padding: 0 1rem 0.5rem;
            font-size: 0.75rem;
            text-transform: uppercase;
            font-weight: 600;
            color: #6c757d;
            letter-spacing: 0.5px;
        }

        .mobile-nav-link {
            display: flex;
            align-items: center;
            padding: 0.75rem 1rem;
            color: #333;
            text-decoration: none;
            transition: background-color 0.3s ease;
        }

        .mobile-nav-link:hover {
            background-color: #f8f9fa;
        }

        .mobile-nav-link.active {
            background-color: #667eea;
            color: white;
        }

        .mobile-nav-link i {
            width: 20px;
            margin-right: 0.75rem;
        }

        /* Responsive Breakpoints */
        @media (max-width: 768px) {
            .sidebar {
                transform: translateX(-100%);
            }

            .mobile-navbar {
                display: block;
            }

            body {
                padding-top: 70px;
            }
        }

        /* Demo content area */
        .main-content {
            margin-left: 280px;
            padding: 2rem;
            min-height: 100vh;
        }

        @media (max-width: 768px) {
            .main-content {
                margin-left: 0;
            }
        }

        .demo-card {
            background: white;
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
    </style>
</head>
<body>
    <!-- Desktop Sidebar -->
    <div id="sidebar-parent" class="sidebar light-theme">
        <!-- Parent Profile Area -->
        <div class="profile-area">
            <div class="avatar">
                <i class="fas fa-user-friends"></i>
            </div>
            <div class="profile-info">
                <h3>{{ Auth::user()->name ?? 'Parent Name' }}</h3>
                <p>Parent</p>
            </div>
        </div>

        <nav class="nav-menu">
            <!-- Main Section -->
            <div class="nav-section">
                <p class="nav-section-title">Dashboard</p>
                <ul class="nav-list">
                    <li class="nav-item">
                        <a href="{{ route('parent.overview') }}" class="nav-link {{ request()->routeIs('parent.overview*') ? 'active' : '' }}">
                            <i class="fas fa-tachometer-alt"></i>
                            <span>Dashboard</span>
                        </a>
                    </li>
                </ul>
            </div>

            <!-- Children Management -->
            <div class="nav-section">
                <p class="nav-section-title">Family</p>
                <ul class="nav-list">
                    <li class="nav-item">
                        <a href="{{ route('parent.linked_students.index') }}" class="nav-link {{ request()->routeIs('parent.linked_students.*') ? 'active' : '' }}">
                            <i class="fas fa-users"></i>
                            <span>My Children</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="{{ route('parent.connections.index') }}" class="nav-link {{ request()->routeIs('parent.connections.*') ? 'active' : '' }}">
                            <i class="fas fa-user-plus"></i>
                            <span>Connection Requests</span>
                        </a>
                    </li>
                </ul>
            </div>

            <!-- Communication -->
            <div class="nav-section">
                <p class="nav-section-title">Communication</p>
                <ul class="nav-list">
                    <li class="nav-item">
                        <a href="{{ route('parent.messages') }}" class="nav-link {{ request()->routeIs('parent.messages*') ? 'active' : '' }}">
                            <i class="fas fa-envelope"></i>
                            <span>Messages</span>
                        </a>
                    </li>
                </ul>
            </div>

            <!-- Account Section -->
            <div class="nav-section">
                <p class="nav-section-title">Account</p>
                <ul class="nav-list">
                    <li class="nav-item">
                        <a href="{{ route('parent.subscriptions') }}" class="nav-link {{ request()->routeIs('parent.subscriptions*') ? 'active' : '' }}">
                            <i class="fas fa-credit-card"></i>
                            <span>Subscriptions</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="{{ route('parent.settings') }}" class="nav-link {{ request()->routeIs('parent.settings*') ? 'active' : '' }}">
                            <i class="fas fa-user-cog"></i>
                            <span>Settings</span>
                        </a>
                    </li>
                </ul>
            </div>

            <div class="divider"></div>

            <div class="nav-section">
                <ul class="nav-list">
                    <li class="nav-item">
                        <a href="#" onclick="event.preventDefault(); document.getElementById('logout-form-parent-sidebar').submit();" class="nav-link">
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

    <form id="logout-form-parent-sidebar" action="{{ route('logout') }}" method="POST" style="display: none;">
        @csrf
    </form> 

    <!-- Mobile Navbar -->
    <div class="mobile-navbar">
        <div class="navbar-header">
            <div class="navbar-brand">
                <i class="fas fa-user-friends"></i>
                Parent Portal
            </div>
            <button class="mobile-toggle" onclick="toggleMobileMenu()">
                <i class="fas fa-bars"></i>
            </button>
        </div>

        <div class="mobile-menu" id="mobileMenu">
            <div class="mobile-profile">
                <div class="avatar">
                    <i class="fas fa-user-friends"></i>
                </div>
                <div class="profile-info">
                    <h3>{{ Auth::user()->name ?? 'Parent Name' }}</h3>
                    <p>Parent</p>
                </div>
            </div>

            <div class="mobile-nav-section">
                <div class="mobile-nav-title">Dashboard</div>
                <a href="{{ route('parent.overview') }}" class="mobile-nav-link {{ request()->routeIs('parent.overview*') ? 'active' : '' }}">
                    <i class="fas fa-tachometer-alt"></i>
                    <span>Dashboard</span>
                </a>
            </div>

            <div class="mobile-nav-section">
                <div class="mobile-nav-title">Family</div>
                <a href="{{ route('parent.linked_students.index') }}" class="mobile-nav-link {{ request()->routeIs('parent.linked_students.*') ? 'active' : '' }}">
                    <i class="fas fa-users"></i>
                    <span>My Children</span>
                </a>
                <a href="{{ route('parent.connections.index') }}" class="mobile-nav-link {{ request()->routeIs('parent.connections.*') ? 'active' : '' }}">
                    <i class="fas fa-user-plus"></i>
                    <span>Connection Requests</span>
                </a>
            </div>

            <div class="mobile-nav-section">
                <div class="mobile-nav-title">Communication</div>
                <a href="{{ route('parent.messages') }}" class="mobile-nav-link {{ request()->routeIs('parent.messages*') ? 'active' : '' }}">
                    <i class="fas fa-envelope"></i>
                    <span>Messages</span>
                </a>
            </div>

            <div class="mobile-nav-section">
                <div class="mobile-nav-title">Account</div>
                <a href="{{ route('parent.subscriptions') }}" class="mobile-nav-link {{ request()->routeIs('parent.subscriptions*') ? 'active' : '' }}">
                    <i class="fas fa-credit-card"></i>
                    <span>Subscriptions</span>
                </a>
                <a href="{{ route('parent.settings') }}" class="mobile-nav-link {{ request()->routeIs('parent.settings*') ? 'active' : '' }}">
                    <i class="fas fa-user-cog"></i>
                    <span>Settings</span>
                </a>
            </div>

            <div class="mobile-nav-section">
                <a href="#" onclick="event.preventDefault(); document.getElementById('logout-form-parent-sidebar-mobile').submit();" class="mobile-nav-link">
                    <i class="fas fa-power-off"></i>
                    <span>Logout</span>
                </a>
            </div>
        </div>
    </div>

    <form id="logout-form-parent-sidebar-mobile" action="{{ route('logout') }}" method="POST" style="display: none;">
        @csrf
    </form>

    <script>
        function toggleMobileMenu() {
            const menu = document.getElementById('mobileMenu');
            const toggle = document.querySelector('.mobile-toggle i');
            
            menu.classList.toggle('active');
            
            if (menu.classList.contains('active')) {
                toggle.classList.remove('fa-bars');
                toggle.classList.add('fa-times');
            } else {
                toggle.classList.remove('fa-times');
                toggle.classList.add('fa-bars');
            }
        }

        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            const navbar = document.querySelector('.mobile-navbar');
            const menu = document.getElementById('mobileMenu');
            
            if (!navbar.contains(event.target) && menu.classList.contains('active')) {
                toggleMobileMenu();
            }
        });

        // Handle window resize
        window.addEventListener('resize', function() {
            const menu = document.getElementById('mobileMenu');
            if (window.innerWidth > 768 && menu.classList.contains('active')) {
                toggleMobileMenu();
            }
        });
    </script>
</body>
</html>