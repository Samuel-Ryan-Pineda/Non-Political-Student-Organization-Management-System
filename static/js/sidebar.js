$(document).ready(function() {
  // No longer checking for saved sidebar state on desktop
  // Desktop sidebar will always be expanded
  
  // Only apply collapsed state on mobile
  if ($(window).width() <= 768) {
    const mobileCollapsed = localStorage.getItem('mobileSidebarCollapsed') === 'true';
    if (mobileCollapsed) {
      $(".custom-sidebar").addClass("mobile-active");
    }
  }

  // Get current page URL path
  const currentPath = window.location.pathname;
  
  // Find the menu item that matches the current path and add 'active' class
  $(".custom-menu ul li a").each(function() {
    const menuLink = $(this).attr("href");
    if (menuLink === currentPath) {
      // Add active class to the li element (parent of this anchor)
      $(this).parent("li").addClass("active");
      
      // If this is in a submenu, also make the parent menu item active
      if ($(this).closest(".custom-sub-menu").length) {
        $(this).closest(".custom-sub-menu").parent("li").addClass("active");
        // Make the submenu visible
        $(this).closest(".custom-sub-menu").show();
      }
    }
  });

  // Show all submenus on page load but don't automatically set parent as active
  $(".custom-menu > ul > li").each(function() {
    if ($(this).find(".custom-sub-menu").length) {
      // Only show the submenu without adding active class to parent
      $(this).find(".custom-sub-menu").show();
      
      // Check if any submenu item matches current path
      const hasActiveSubmenu = $(this).find(".custom-sub-menu li a").filter(function() {
        return $(this).attr("href") === currentPath;
      }).length > 0;
      
      // Only add active class to parent if a submenu item is active
      if (hasActiveSubmenu) {
        $(this).addClass("active");
      }
    }
  });
  
  // Only handle clicks for navigation, no toggling of submenus
  $(".custom-menu > ul > li").click(function(e) {
    // Only execute this if clicking the main li item, not a submenu item
    if ($(e.target).closest(".custom-sub-menu").length === 0) {
      // Stop event from triggering link navigation only when clicking on arrows
      if ($(e.target).is(".custom-arrow") || 
          $(e.target).closest("a").find(".custom-arrow").length) {
        e.preventDefault();
      }
    }
  });
  
  // Handle submenu item clicks
  $(".custom-menu .custom-sub-menu li a").click(function(e) {
    // Remove active class from all menu items
    $(".custom-menu ul li").removeClass("active");

    // Add active class to the clicked submenu item
    $(this).parent("li").addClass("active");

    // Add active class to the parent menu item
    $(this).closest(".custom-sub-menu").parent("li").addClass("active");
    
    // Do not prevent default - allow normal navigation
  });

  // Toggle sidebar only in mobile view
  $(".custom-menu-btn").click(function() {
    // Only allow toggling in mobile view
    if ($(window).width() <= 768) {
      // In mobile: toggle mobile-active class
      $(".custom-sidebar").toggleClass("mobile-active");
      
      // Save mobile state to localStorage
      localStorage.setItem('mobileSidebarCollapsed', $(".custom-sidebar").hasClass("mobile-active"));
      
      // When sidebar is closed (mobile-active added)
      if ($(".custom-sidebar").hasClass("mobile-active")) {
        setTimeout(function() {
          $(".custom-sidebar .custom-head, .custom-sidebar .custom-nav, .custom-sidebar .custom-menu:not(.custom-menu-btn)").css({
            "opacity": "0",
            "visibility": "hidden"
          });
        }, 1);
      } else {
        // When sidebar is opened
        $(".custom-sidebar .custom-head, .custom-sidebar .custom-nav, .custom-sidebar .custom-menu:not(.custom-menu-btn)").css({
          "opacity": "1",
          "visibility": "visible"
        });
      }
    }
    // No action in desktop mode - sidebar always stays expanded
  });
  
  // Check if mobile view on page load
  checkMobileView();
  
  // Check if mobile view on window resize
  $(window).resize(function() {
    checkMobileView();
  });
  
  // Function to check if mobile view and set initial state
  function checkMobileView() {
    if ($(window).width() <= 768) {
      // On mobile, check saved state
      const mobileCollapsed = localStorage.getItem('mobileSidebarCollapsed') === 'true';
      
      if (mobileCollapsed) {
        // Apply mobile-active class if it was collapsed
        $(".custom-sidebar").addClass("mobile-active");
        
        // Hide sidebar content
        $(".custom-sidebar .custom-head, .custom-sidebar .custom-nav, .custom-sidebar .custom-menu:not(.custom-menu-btn)").css({
          "opacity": "0",
          "visibility": "hidden"
        });
      } else {
        // Remove mobile-active if it wasn't collapsed
        $(".custom-sidebar").removeClass("mobile-active");
        
        // Show sidebar content
        $(".custom-sidebar .custom-head, .custom-sidebar .custom-nav, .custom-sidebar .custom-menu:not(.custom-menu-btn)").css({
          "opacity": "1",
          "visibility": "visible"
        });
      }
      
      // Remove desktop active class if present
      $(".custom-sidebar").removeClass("active");
    } else {
      // On desktop, always show expanded sidebar
      $(".custom-sidebar").removeClass("mobile-active");
      $(".custom-sidebar").removeClass("active"); // Never collapsed in desktop
      
      $(".custom-sidebar .custom-head, .custom-sidebar .custom-nav, .custom-sidebar .custom-menu:not(.custom-menu-btn)").css({
        "opacity": "",
        "visibility": ""
      });
    }
  }
  
  // Initialize tooltips if Bootstrap is present
  if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
    $('[data-bs-toggle="tooltip"]').tooltip();
  }
});