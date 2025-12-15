{{-- Settings Sidebar Component --}}
<div class="settings-sidebar">
    <!-- Sidebar Header -->
    <div class="sidebar-header">
        <h2 class="sidebar-title">Settings</h2>
    </div>

    <!-- Navigation Menu -->
    <nav class="sidebar-nav">
        <ul class="nav-list">
            <!-- Main -->
            <li class="nav-item {{ request()->routeIs('settings.main') ? 'active' : '' }}">
                <a class="nav-link">
                    <div class="nav-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"></path>
                        </svg>
                    </div>
                    <span class="nav-text">Main</span>
                </a>
            </li>

            <!-- Access -->
            <li class="nav-item {{ request()->routeIs('settings.access') ? 'active' : '' }}">
                <a " class="nav-link">
                    <div class="nav-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <circle cx="12" cy="16" r="1"></circle>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                    </div>
                    <span class="nav-text">Access</span>
                </a>
            </li>

            <!-- Prerequisites -->
            <li class="nav-item {{ request()->routeIs('settings.prerequisites') ? 'active' : '' }}">
                <a class="nav-link">
                    <div class="nav-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                    </div>
                    <span class="nav-text">Prerequisites</span>
                </a>
            </li>

            <!-- Course files -->
            <li class="nav-item {{ request()->routeIs('settings.course-files') ? 'active' : '' }}">
                <a  class="nav-link">
                    <div class="nav-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14,2 14,8 20,8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10,9 9,9 8,9"></polyline>
                        </svg>
                    </div>
                    <span class="nav-text">@lmsterm('Study Material') files</span>
                </a>
            </li>

            <!-- Certificate -->
            <li class="nav-item {{ request()->routeIs('settings.certificate') ? 'active' : '' }}">
                <a class="nav-link">
                    <div class="nav-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14,2 14,8 20,8"></polyline>
                            <line x1="12" y1="18" x2="12" y2="12"></line>
                            <line x1="9" y1="15" x2="15" y2="15"></line>
                        </svg>
                    </div>
                    <span class="nav-text">Certificate</span>
                </a>
            </li>

            <!-- Course Page -->
            <li class="nav-item {{ request()->routeIs('settings.course-page') ? 'active' : '' }}">
                <a class="nav-link">
                    <div class="nav-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect>
                            <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                    </div>
                    <span class="nav-text">@lmsterm('Study Material') Page</span>
                </a>
            </li>
        </ul>
    </nav>
</div>

<style>
/* Settings Sidebar Styles */
.settings-sidebar {
    width: 280px;
    min-height: 100vh;
    padding: 0;
    position: relative;
    overflow: hidden;
}

.settings-sidebar::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    pointer-events: none;
}

.sidebar-header {
    padding: 2rem 1.5rem 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;
    z-index: 1;
}

.sidebar-title {
    font-weight: light;
    color: black;
    margin: 0;
}

.sidebar-nav {
    padding: 1rem 0;
    position: relative;
    z-index: 1;
}

.nav-list {
    list-style: none;
    margin: 0;
    padding: 0;
}

.nav-item {
    margin: 0.25rem 0;
    position: relative;
    cursor:pointer;
}

.nav-link {
    display: flex;
    align-items: center;
    padding: 1rem 1.5rem;
    color: rgba(255, 255, 255, 0.8);
    text-decoration: none;
    font-weight: 500;
    font-size: 0.95rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    border-radius: 0;
    overflow: hidden;
    cursor:pointer;

}

.nav-link::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: white;
    transform: scaleY(0);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-link:hover::before {
    transform: scaleY(1);
}

.nav-link::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.nav-link:hover::after {
    opacity: 1;
}

.nav-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 0.875rem;
    position: relative;
    z-index: 1;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-link:hover .nav-icon {
    transform: translateX(2px);
}

.nav-text {
    position: relative;
    z-index: 1;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-link:hover .nav-text {
    transform: translateX(4px);
}

.nav-link:hover {
    color: white;
    backdrop-filter: blur(10px);
}

/* Active state */
.nav-item.active .nav-link {
    color: white;
    backdrop-filter: blur(10px);
    font-weight: 600;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.nav-item.active .nav-link::before {
    transform: scaleY(1);
    background: white;
}

.nav-item.active .nav-link .nav-icon {
    transform: translateX(2px) scale(1.05);
}

.nav-item.active .nav-link .nav-text {
    transform: translateX(4px);
}

/* Responsive Design */
@media (max-width: 768px) {
    .settings-sidebar {
        width: 100%;
        min-height: auto;
        position: fixed;
        top: 0;
        left: 0;
        z-index: 1000;
        transform: translateX(-100%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .settings-sidebar.open {
        transform: translateX(0);
    }
    
    .sidebar-header {
        padding: 1.5rem;
    }
    
    .sidebar-title {
        font-size: 1.5rem;
    }
}

/* Animation for smooth transitions */
@keyframes slideInLeft {
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
    animation: slideInLeft 0.3s ease forwards;
}

.nav-item:nth-child(1) { animation-delay: 0.1s; }
.nav-item:nth-child(2) { animation-delay: 0.15s; }
.nav-item:nth-child(3) { animation-delay: 0.2s; }
.nav-item:nth-child(4) { animation-delay: 0.25s; }
.nav-item:nth-child(5) { animation-delay: 0.3s; }
.nav-item:nth-child(6) { animation-delay: 0.35s; }

/* Focus states for accessibility */
.nav-link:focus {
    outline: 2px solid rgba(255, 255, 255, 0.5);
    outline-offset: -2px;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {

}
</style>

{{-- Optional: Include this JavaScript for mobile toggle functionality --}}
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Add mobile toggle functionality if needed
    const sidebar = document.querySelector('.settings-sidebar');
    const toggleButton = document.querySelector('.sidebar-toggle'); // You'll need to add this button
    
    if (toggleButton) {
        toggleButton.addEventListener('click', function() {
            sidebar.classList.toggle('open');
        });
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !toggleButton?.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });
    
    // Add smooth scrolling for better UX
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Add your custom navigation logic here if needed
            // For example, smooth page transitions
        });
    });
});
</script>