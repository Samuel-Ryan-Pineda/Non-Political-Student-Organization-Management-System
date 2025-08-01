/**
 * Organization Filter Script
 * Handles search and category filtering for the organization page
 */

document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const searchInput = document.getElementById('organizationSearch');
  const categoryPills = document.querySelectorAll('.category-pill');
  const organizationCards = document.querySelectorAll('.row[role="list"] > [role="listitem"]');
  
  // Add event listener for search input
  searchInput.addEventListener('input', filterOrganizations);
  
  // Add event listeners for category pills
  categoryPills.forEach(pill => {
    pill.addEventListener('click', function() {
      // Remove active class from all pills
      categoryPills.forEach(p => p.classList.remove('active'));
      
      // Add active class to clicked pill
      this.classList.add('active');
      
      // Filter organizations
      filterOrganizations();
    });
  });
  
  /**
   * Filter organizations based on search input and selected category
   */
  function filterOrganizations() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategory = document.querySelector('.category-pill.active').getAttribute('data-category');
    
    organizationCards.forEach(card => {
      const orgName = card.querySelector('.text-start').textContent.toLowerCase();
      const orgType = card.getAttribute('data-type') || 'all'; // Get organization type from data attribute
      
      // Check if card matches search term and category
      const matchesSearch = orgName.includes(searchTerm);
      const matchesCategory = selectedCategory === 'all' || orgType === selectedCategory;
      
      // Show/hide card based on filters
      if (matchesSearch && matchesCategory) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
    
    // Show message if no results
    const visibleCards = document.querySelectorAll('.row[role="list"] > [role="listitem"]:not([style*="display: none"])');
    const noResultsMessage = document.querySelector('.no-results-message');
    
    if (visibleCards.length === 0) {
      // Create message if it doesn't exist
      if (!noResultsMessage) {
        const message = document.createElement('div');
        message.className = 'col-12 no-results-message text-center mt-4';
        message.innerHTML = '<p class="text-dark" style="font-size: 0.75rem;">— No organizations match your search criteria —</p>';
        document.querySelector('.row[role="list"]').appendChild(message);
      } else {
        noResultsMessage.style.display = '';
      }
    } else if (noResultsMessage) {
      noResultsMessage.style.display = 'none';
    }
  }
});