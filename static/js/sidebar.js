$(document).ready(function() {
  // Check for saved sidebar state on page load
  const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
  
  // Apply saved state on initial page load
  if (sidebarCollapsed && $(window).width() > 768) {
    $(".custom-sidebar").addClass("active");
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

  // Toggle submenu on click
  $(".custom-menu > ul > li").click(function(e) {
    // Only execute this if clicking the main li item, not a submenu item
    if ($(e.target).closest(".custom-sub-menu").length === 0) {
      // remove active from already active
      $(this).siblings().removeClass("active");
      // add active to clicked
      $(this).toggleClass("active");
      // if has sub menu open it
      $(this).find("ul").slideToggle();
      // close other sub menu if any open
      $(this).siblings().find("ul").slideUp();
      // remove active class of sub menu items
      $(this).siblings().find("ul").find("li").removeClass("active");
      
      // If the clicked item contains the active submenu item, keep it active
      if ($(this).find("li.active").length > 0) {
        $(this).addClass("active");
      }
      
      // Stop event from triggering link navigation when clicking on parent items with submenus
      if ($(this).find(".custom-sub-menu").length && 
          $(e.target).is(".custom-arrow") || 
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

  // Toggle sidebar on menu button click with localStorage saving
  $(".custom-menu-btn").click(function() {
    // Check if we're in mobile view
    if ($(window).width() <= 768) {
      // In mobile: toggle mobile-active class
      $(".custom-sidebar").toggleClass("mobile-active");
      
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
    } else {
      // In desktop: toggle the regular active class
      $(".custom-sidebar").toggleClass("active");
      
      // Save the state to localStorage
      localStorage.setItem('sidebarCollapsed', $(".custom-sidebar").hasClass("active"));
    }
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
      // On mobile, add mobile-specific class
      $(".custom-sidebar").addClass("mobile-active");
      
      // Remove desktop active class if present
      $(".custom-sidebar").removeClass("active");
      
      // Hide sidebar content
      $(".custom-sidebar .custom-head, .custom-sidebar .custom-nav, .custom-sidebar .custom-menu:not(.custom-menu-btn)").css({
        "opacity": "0",
        "visibility": "hidden"
      });
    } else {
      // On desktop, remove mobile-specific class and styles
      $(".custom-sidebar").removeClass("mobile-active");
      
      $(".custom-sidebar .custom-head, .custom-sidebar .custom-nav, .custom-sidebar .custom-menu:not(.custom-menu-btn)").css({
        "opacity": "",
        "visibility": ""
      });
      
      // Apply saved state if it exists
      const savedState = localStorage.getItem('sidebarCollapsed');
      if (savedState === 'true') {
        $(".custom-sidebar").addClass("active");
      } else if (savedState === 'false') {
        $(".custom-sidebar").removeClass("active");
      }
    }
  }
  
  // Initialize tooltips if Bootstrap is present
  if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
    $('[data-bs-toggle="tooltip"]').tooltip();
  }
});