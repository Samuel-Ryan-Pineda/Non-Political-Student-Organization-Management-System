$(document).ready(function() {
  // Check for saved sidebar state on page load
  const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
  
  // Apply saved state on initial page load
  if (sidebarCollapsed && $(window).width() > 768) {
    $(".sidebar").addClass("active");
  }

  // Get current page URL path
  const currentPath = window.location.pathname;
  
  // Find the menu item that matches the current path and add 'active' class
  $(".menu ul li a").each(function() {
    const menuLink = $(this).attr("href");
    if (menuLink === currentPath) {
      // Add active class to the li element (parent of this anchor)
      $(this).parent("li").addClass("active");
      
      // If this is in a submenu, also make the parent menu item active
      if ($(this).closest(".sub-menu").length) {
        $(this).closest(".sub-menu").parent("li").addClass("active");
        // Make the submenu visible
        $(this).closest(".sub-menu").show();
      }
    }
  });

  // Toggle submenu on click (your existing code)
  $(".menu > ul > li").click(function(e) {
    // Only execute this if clicking the main li item, not a submenu item
    if ($(e.target).closest(".sub-menu").length === 0) {
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
      if ($(this).find(".sub-menu").length && 
          $(e.target).is(".arrow") || 
          $(e.target).closest("a").find(".arrow").length) {
        e.preventDefault();
      }
    }
  });
  
  // Handle submenu item clicks
  $(".menu .sub-menu li a").click(function(e) {
    // Remove active class from all menu items
    $(".menu ul li").removeClass("active");

    // Add active class to the clicked submenu item
    $(this).parent("li").addClass("active");

    // Add active class to the parent menu item
    $(this).closest(".sub-menu").parent("li").addClass("active");
  });

  // Toggle sidebar on menu button click with localStorage saving
  $(".menu-btn").click(function() {
    // Check if we're in mobile view
    if ($(window).width() <= 768) {
      // In mobile: toggle mobile-active class
      $(".sidebar").toggleClass("mobile-active");
      
      // When sidebar is closed (mobile-active added)
      if ($(".sidebar").hasClass("mobile-active")) {
        setTimeout(function() {
          $(".sidebar .head, .sidebar .nav, .sidebar .menu:not(.menu-btn)").css({
            "opacity": "0",
            "visibility": "hidden"
          });
        }, 1);
      } else {
        // When sidebar is opened
        $(".sidebar .head, .sidebar .nav, .sidebar .menu:not(.menu-btn)").css({
          "opacity": "1",
          "visibility": "visible"
        });
      }
    } else {
      // In desktop: toggle the regular active class
      $(".sidebar").toggleClass("active");
      
      // Save the state to localStorage
      localStorage.setItem('sidebarCollapsed', $(".sidebar").hasClass("active"));
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
      $(".sidebar").addClass("mobile-active");
      
      // Remove desktop active class if present
      $(".sidebar").removeClass("active");
      
      // Hide sidebar content
      $(".sidebar .head, .sidebar .nav, .sidebar .menu:not(.menu-btn)").css({
        "opacity": "0",
        "visibility": "hidden"
      });
    } else {
      // On desktop, remove mobile-specific class and styles
      $(".sidebar").removeClass("mobile-active");
      
      $(".sidebar .head, .sidebar .nav, .sidebar .menu:not(.menu-btn)").css({
        "opacity": "",
        "visibility": ""
      });
      
      // Apply saved state if it exists
      const savedState = localStorage.getItem('sidebarCollapsed');
      if (savedState === 'true') {
        $(".sidebar").addClass("active");
      } else if (savedState === 'false') {
        $(".sidebar").removeClass("active");
      }
    }
  }
  
  // Handle regular link clicks to maintain sidebar state
  $(".menu ul li a").click(function(e) {
    const href = $(this).attr("href");

    // Skip links with "#" or JavaScript actions
    if (href === "#" || href.startsWith("javascript")) {
        return;
    }

    e.preventDefault();

    // Load content dynamically
    fetch(href)
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to load content");
            }
            return response.text();
        })
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            const newContent = doc.getElementById("content");

            if (newContent) {
                $("#content").html(newContent.innerHTML);
                window.history.pushState(null, "", href); // Update URL without reloading
            }

            // Collapse the sidebar in mobile mode
            if ($(window).width() <= 768) {
                $(".sidebar").addClass("mobile-active");
                $(".sidebar .head, .sidebar .nav, .sidebar .menu:not(.menu-btn)").css({
                    "opacity": "0",
                    "visibility": "hidden"
                });
            }
        })
        .catch(error => {
            console.error("Error loading content:", error);
        });
  });
});