$(document).ready(function() {
  // Check for saved sidebar state for all screen sizes
  const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
  if (sidebarCollapsed) {
    $(".custom-sidebar").addClass("sidebar-collapsed");
    $(".content-wrapper").addClass("expanded");
    $("body").addClass("sidebar-collapsed");
  }
  
  // Handle header menu button click for all screen sizes
  $("#headerMenuBtn").on("click", function() {
    $(".custom-sidebar").toggleClass("sidebar-collapsed");
    $(".content-wrapper").toggleClass("expanded");
    $("body").toggleClass("sidebar-collapsed");
    $(this).find("i").toggleClass("rotate-icon");
    localStorage.setItem('sidebarCollapsed', $(".custom-sidebar").hasClass("sidebar-collapsed"));
  });
  
  // Initialize header menu button icon state
  if ($(".custom-sidebar").hasClass("sidebar-collapsed")) {
    $("#headerMenuBtn i").addClass("rotate-icon");
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
      // In mobile: toggle sidebar-collapsed class (same as desktop for consistency)
      $(".custom-sidebar").toggleClass("sidebar-collapsed");
      $("body").toggleClass("sidebar-collapsed");
      
      // Save mobile state to localStorage
      const isMobileCollapsed = $(".custom-sidebar").hasClass("sidebar-collapsed");
      localStorage.setItem('mobileSidebarCollapsed', isMobileCollapsed);
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
        // Apply sidebar-collapsed class if it was collapsed
        $(".custom-sidebar").addClass("sidebar-collapsed");
        $("body").addClass("sidebar-collapsed");
      } else {
        // Remove sidebar-collapsed if it wasn't collapsed
        $(".custom-sidebar").removeClass("sidebar-collapsed");
        $("body").removeClass("sidebar-collapsed");
      }
    } else {
      // On desktop, check the main sidebar state (not mobile state)
      // Don't interfere with desktop sidebar state
      // Remove any mobile-specific classes
      localStorage.removeItem('mobileSidebarCollapsed');
    }
  }
  
  // Initialize tooltips if Bootstrap is present
  if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
    $('[data-bs-toggle="tooltip"]').tooltip();
  }
});