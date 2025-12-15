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
            <i class="fas fa-user-shield"></i>
        </div>
        <div class="profile-info">
            <h3>{{ Auth::user()->name ?? 'Admin User' }}</h3>
            <p>Administrator</p>
        </div>
    </div>

    <nav class="nav-menu">
        <div class="nav-section">
            <p class="nav-section-title">Management</p>
            <ul class="nav-list">
                <li class="nav-item">
                    <a href="{{ route('admin.users.index') }}" class="nav-link {{ request()->routeIs('admin.users.*') ? 'active' : '' }}">
                        <i class="fas fa-users-cog"></i>
                        <span>User Management</span>
                        <span class="badge">2</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="{{ route('admin.courses.index') }}" class="nav-link {{ request()->routeIs('admin.courses.*') ? 'active' : '' }}">
                        <i class="fas fa-book-open"></i>
                        <span>@lmsterm('Study Material') Management</span>
                        <span class="badge">4</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="{{ route('admin.course-approvals.index') }}" class="nav-link {{ request()->routeIs('admin.course-approvals.*') ? 'active' : '' }}">
                        <i class="fas fa-check-circle"></i>
                        <span>@lmsterm('Study Material') Approvals</span>
                        <span class="badge">1</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="{{ route('admin.teacher.courses.index') }}" class="nav-link {{ request()->routeIs('admin.teacher.courses.*') ? 'active' : '' }}">
                        <i class="fas fa-graduation-cap"></i>
                        <span>My @lmsterm('Study Materials')</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="{{ route('admin.teacher.courses.create') }}" class="nav-link">
                        <i class="fas fa-plus-circle"></i>
                        <span>Create @lmsterm('Study Material')</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="{{ route('admin.parent-student.index') }}" class="nav-link {{ request()->routeIs('admin.parent-student.*') ? 'active' : '' }}">
                        <i class="fas fa-link"></i>
                        <span>Parent-Student Links</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="{{ route('admin.messages.index') }}" class="nav-link {{ request()->routeIs('admin.messages.*') ? 'active' : '' }}">
                        <i class="fas fa-envelope"></i>
                        <span>Messages</span>
                        <span class="badge">3</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="{{ route('admin.badges.index') }}" class="nav-link {{ request()->routeIs('admin.badges.*') ? 'active' : '' }}">
                        <i class="fas fa-medal"></i>
                        <span>Badges</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="{{ route('admin.subscription-tiers.index') }}" class="nav-link {{ request()->routeIs('admin.subscription-tiers.*') ? 'active' : '' }}">
                        <i class="fas fa-layer-group"></i>
                        <span>Subscription Tiers</span>
                    </a>
                </li>
            </ul>
        </div>

        <div class="nav-section">
            <p class="nav-section-title">Curriculum</p>
            <ul class="nav-list">
                <li class="nav-item">
                    <a href="{{ route('admin.categories.index') }}" class="nav-link {{ request()->routeIs('admin.categories.*') ? 'active' : '' }}">
                        <i class="fas fa-tags"></i>
                        <span>Categories</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="{{ route('admin.subjects.index') }}" class="nav-link {{ request()->routeIs('admin.subjects.*') ? 'active' : '' }}">
                        <i class="fas fa-book"></i>
                        <span>Subjects</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="{{ route('admin.subject-categories.index') }}" class="nav-link {{ request()->routeIs('admin.subject-categories.*') ? 'active' : '' }}">
                        <i class="fas fa-sitemap"></i>
                        <span>Subject Categories</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="{{ route('admin.grade-levels.index') }}" class="nav-link {{ request()->routeIs('admin.grade-levels.*') ? 'active' : '' }}">
                        <i class="fas fa-level-up-alt"></i>
                        <span>Grade Levels</span>
                    </a>
                </li>
            </ul>
        </div>

        <div class="nav-section">
            <p class="nav-section-title">Finance & Verification</p>
            <ul class="nav-list">
                <li class="nav-item">
                    <a href="{{ route('admin.payouts.index') }}" class="nav-link {{ request()->routeIs('admin.payouts.*') ? 'active' : '' }}">
                        <i class="fas fa-hand-holding-usd"></i>
                        <span>Teacher Payouts</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="{{ route('admin.teacher-payment-verification.index') }}" class="nav-link {{ request()->routeIs('admin.teacher-payment-verification.*') ? 'active' : '' }}">
                        <i class="fas fa-user-check"></i>
                        <span>Payment Verification</span>
                    </a>
                </li>
            </ul>
        </div>

        <div class="nav-section">
            <p class="nav-section-title">System</p>
            <ul class="nav-list">
                <li class="nav-item">
                    <a href="{{ route('admin.reports.index') }}" class="nav-link {{ request()->routeIs('admin.reports.*') ? 'active' : '' }}">
                        <i class="fas fa-chart-bar"></i>
                        <span>Reports</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="{{ route('admin.settings.index') }}" class="nav-link {{ request()->routeIs('admin.settings.*') ? 'active' : '' }}">
                        <i class="fas fa-cogs"></i>
                        <span>Platform Settings</span>
                    </a>
                </li>
            </ul>
        </div>

        <div class="divider"></div>

        <div class="nav-section">
            <ul class="nav-list">
                <li class="nav-item">
                    <a href="#" onclick="event.preventDefault(); document.getElementById('logout-form-admin-sidebar').submit();" class="nav-link">
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

<form id="logout-form-admin-sidebar" action="{{ route('logout') }}" method="POST" style="display: none;">
    @csrf
</form>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const mobileToggle = document.getElementById('mobileToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    mobileToggle.addEventListener('click', function() {
        sidebar.classList.toggle('show');
        overlay.classList.toggle('show');
        this.setAttribute('aria-expanded', sidebar.classList.contains('show'));
    });

    overlay.addEventListener('click', function() {
        sidebar.classList.remove('show');
        overlay.classList.remove('show');
        mobileToggle.setAttribute('aria-expanded', 'false');
    });

    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (window.innerWidth <= 992) {
                sidebar.classList.remove('show');
                overlay.classList.remove('show');
                mobileToggle.setAttribute('aria-expanded', 'false');
            }
        });
    });

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
}
@media (max-width: 992px) {
    .main-content {
        margin-left: 0;
        padding-top: calc(var(--mobile-toggle-size) + 1rem);
    }
}
:root {
    --sidebar-bg: #ffffff;
    --sidebar-text: #374151;
    --sidebar-text-light: #6b7280;
    --sidebar-border: #e5e7eb;
    --sidebar-active-bg: #eff6ff;
    --sidebar-hover-bg: #f9fafb;
}
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
