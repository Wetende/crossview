<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
  <!-- Required meta tags -->
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <!-- Google fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Work+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">

  <link href="https://fonts.googleapis.com/css2?family=Material+Icons+Outlined" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" integrity="sha512-1ycn6IcaQQ40/MKBW2W4Rhis/DbILU74C1vSrLJxCq57o941Ym01SwNsOMqvEBFlcgUa6xLiPY/NS5R+E6ztJQ==" crossorigin="anonymous" referrerpolicy="no-referrer" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" integrity="sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A==" crossorigin="" />

  <!-- Stylesheets -->
  <link rel="stylesheet" href="{{ asset('css/vendors.css') }}">
  <link rel="stylesheet" href="{{ asset('css/main.css') }}">
  <link rel="stylesheet" href="{{ asset('css/shared-sidebar.css') }}">

  <title>{{ $title ?? config('app.short_name', 'Crossview College') . ' - Dashboard' }}</title>
  <meta name="csrf-token" content="{{ csrf_token() }}">
  
  <script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
  
  @vite(['resources/css/app.css', 'resources/js/app.js'])
  
  <style>
    /* Custom styles to improve sidebar spacing */
    .dashboard__main {
      padding-left: 0; /* Remove default padding */
    }
    
    .content-wrapper.js-content-wrapper {
      display: flex;
    }
    
    .dashboard.-home-9 {
      display: flex;
      width: 100%;
    }
    
    .dashboard__content {
      padding-left: 15px;
      padding-right: 15px;
      width: 100%;
    }
    
    /* Fix sidebar positioning and scrolling */
    .sidebar {
      position: sticky;
      top: 80px; /* Align with header height */
      height: calc(100vh - 80px); /* Subtract header height */
      overflow-y: auto;
      overflow-x: hidden;
      z-index: 10;
    }
    
    /* Ensure first items in sidebar are visible */
    .nav-section:first-child {
      padding-top: 10px;
    }
    
    /* Improved spacing and alignment */
    .dashboard__main {
      max-width: 100%; /* Account for sidebar width */
    }
    
    @media (max-width: 768px) {
      .dashboard__main {
      max-width: 100%; /* Account for sidebar width */
      }
    }
  </style>
</head>

<body class="preloader-visible" data-barba="wrapper">
  <!-- preloader start -->
  <div class="preloader js-preloader">
    <div class="preloader__bg"></div>
  </div>
  <!-- preloader end -->

  <!-- barba container start -->
  <div class="barba-container" data-barba="container">
    <main class="main-content">
      {{ $header ?? '' }} 

      <div class="content-wrapper js-content-wrapper">
        <div class="dashboard -home-9 js-dashboard-home-9">
          <div class="sidebar-wrapper">
            {{ $sidebar ?? '' }}
          </div>

          <div class="dashboard__main">
            <div class="dashboard__content bg-light-4">
              {{ $slot }}
            </div>

            @include('layouts.partials.footer')
          </div>
        </div>
      </div>
    </main>

    @include('layouts.partials.messages_aside')
  </div>
  <!-- barba container end -->

  <!-- JavaScript -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.7.1/chart.min.js" integrity="sha512-QSkVNOCYLtj73J4hbmVoOV6KVZuMluZlioC+trLpewV8qMjsWqlIQvkn1KGX2StWvPMdWGBqim1xlC8krl1EKQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
  <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js" integrity="sha512-XQoYMqMTK8LvdxXYG3nZ448hOEQiglfqkJs1NOQV44cWnUrBc8PkAOcXy20w0vlaXaVUearIOBhiXZ5V3ynxwA==" crossorigin=""></script>
  <script src="{{ asset('js/vendors.js') }}"></script>
  <script src="{{ asset('js/main.js') }}"></script>

  @stack('scripts')
</body>
</html>