          <div class="dashboard__sidebar scroll-bar-1">

            <div class="sidebar -dashboard"> {{-- This is the main dashboard navigation sidebar --}}

              <div class="sidebar__item {{ Request::routeIs('dashboard.overview') ? '-is-active -dark-bg-dark-2' : '' }}">
                <a href="{{ route('dashboard.overview') }}" class="d-flex items-center text-17 lh-1 fw-500 {{ Request::routeIs('dashboard.overview') ? '-dark-text-white' : '' }}">
                  <i class="text-20 icon-discovery mr-15"></i>
                  Dashboard
                </a>
              </div>

              <div class="sidebar__item {{ Request::routeIs('dashboard.my-courses') ? '-is-active -dark-bg-dark-2' : '' }}">
                <a href="{{ route('dashboard.my-courses') }}" class="d-flex items-center text-17 lh-1 fw-500 {{ Request::routeIs('dashboard.my-courses') ? '-dark-text-white' : '' }}">
                  <i class="text-20 icon-play-button mr-15"></i>
                  My Courses
                </a>
              </div>

              <div class="sidebar__item {{ Request::routeIs('dashboard.bookmarks') ? '-is-active -dark-bg-dark-2' : '' }}">
                <a href="{{ route('dashboard.bookmarks') }}" class="d-flex items-center text-17 lh-1 fw-500 {{ Request::routeIs('dashboard.bookmarks') ? '-dark-text-white' : '' }}">
                  <i class="text-20 icon-bookmark mr-15"></i>
                  Bookmarks
                </a>
              </div>

              <div class="sidebar__item {{ Request::routeIs('dashboard.messages.index') ? '-is-active -dark-bg-dark-2' : '' }}">
                <a href="{{ route('dashboard.messages.index') }}" class="d-flex items-center text-17 lh-1 fw-500 {{ Request::routeIs('dashboard.messages.index') ? '-dark-text-white' : '' }}">
                  <i class="text-20 icon-message mr-15"></i>
                  Messages
                </a>
              </div>

              <div class="sidebar__item {{ Request::routeIs('dashboard.courses.create') ? '-is-active -dark-bg-dark-2' : '' }}">
                <a href="{{ route('dashboard.courses.create') }}" class="d-flex items-center text-17 lh-1 fw-500 {{ Request::routeIs('dashboard.courses.create') ? '-dark-text-white' : '' }}">
                  <i class="text-20 icon-list mr-15"></i>
                  Create Course
                </a>
              </div>

              <div class="sidebar__item {{ Request::routeIs('dashboard.reviews.index') ? '-is-active -dark-bg-dark-2' : '' }}">
                <a href="{{ route('dashboard.reviews.index') }}" class="d-flex items-center text-17 lh-1 fw-500 {{ Request::routeIs('dashboard.reviews.index') ? '-dark-text-white' : '' }}">
                  <i class="text-20 icon-comment mr-15"></i>
                  Reviews
                </a>
              </div>

              <div class="sidebar__item {{ Request::routeIs('dashboard.settings.profile') ? '-is-active -dark-bg-dark-2' : '' }}">
                <a href="{{ route('dashboard.settings.profile') }}" class="d-flex items-center text-17 lh-1 fw-500 {{ Request::routeIs('dashboard.settings.profile') ? '-dark-text-white' : '' }}">
                  <i class="text-20 icon-setting mr-15"></i>
                  Settings
                </a>
              </div>

              <div class="sidebar__item ">
                <a href="{{ route('logout') }}" class="d-flex items-center text-17 lh-1 fw-500 " 
                   onclick="event.preventDefault(); document.getElementById('logout-form-sidebar').submit();">
                  <i class="text-20 icon-power mr-15"></i>
                  Logout
                </a>
              </div>

            </div>

          </div>
          <form id="logout-form-sidebar" action="{{ route('logout') }}" method="POST" style="display: none;">
            @csrf
          </form> 