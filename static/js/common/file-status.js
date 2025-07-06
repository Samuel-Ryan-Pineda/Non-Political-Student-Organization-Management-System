/**
 * File Status Module
 * Handles file status functionality for both user and admin interfaces
 */

window.FileStatus = window.FileStatus || (function() {
  // Constants for file status types and configurations
  const STATUS_TYPES = {
    'Verified': {
      icon: 'check-circle',
      color: 'success',
      count: 0
    },
    'Pending': {
      icon: 'clock',
      color: 'primary',
      count: 0
    },
    'Needs Revision': {
      icon: 'exclamation-circle',
      color: 'warning',
      count: 0
    },
    'Rejected': {
      icon: 'times-circle',
      color: 'danger',
      count: 0
    }
  };

  // Status badge configurations
  const STATUS_CONFIGS = {
    'Verified': {
      className: 'badge bg-success status-badge',
      html: '<i class="fas fa-check-circle"></i> Verified'
    },
    'Pending': {
      className: 'badge bg-primary status-badge',
      html: '<i class="fas fa-clock"></i> Pending'
    },
    'Needs Revision': {
      className: 'badge bg-warning status-badge',
      html: '<i class="fas fa-exclamation-circle"></i> Needs Revision'
    },
    'Rejected': {
      className: 'badge bg-danger status-badge',
      html: '<i class="fas fa-times-circle"></i> Rejected'
    }
  };

  // Helper function to update progress bar
  function updateProgressBar(verifiedCount, totalFiles, progressBarSelector = '.progress-bar') {
    // Calculate progress percentage
    const progressPercentage = totalFiles > 0 ? Math.round((verifiedCount / totalFiles) * 100) : 0;
    
    // Get progress bar element
    const progressBar = document.querySelector(progressBarSelector);
    if (!progressBar) return;
    
    // Update progress bar width and aria attribute
    progressBar.style.width = `${progressPercentage}%`;
    progressBar.setAttribute('aria-valuenow', progressPercentage);
    
    // Update progress bar color based on progress
    if (progressPercentage === 100) {
      progressBar.className = 'progress-bar bg-success';
    } else if (progressPercentage > 0) {
      progressBar.className = 'progress-bar bg-primary';
    } else {
      progressBar.className = 'progress-bar bg-dark';
    }
  }

  // Function to generate status count HTML
  function generateStatusCountsHTML(statusTypes) {
    return Object.entries(statusTypes).map(([status, config]) => {
      return `
        <div class="d-flex align-items-center gap-1">
          <i class="fas fa-${config.icon} text-${config.color}"></i>
          <span>${status}: ${config.count}</span>
        </div>
      `;
    }).join('');
  }

  // Function to apply status badge configuration
  function applyStatusBadgeConfig(statusBadge, status) {
    const config = STATUS_CONFIGS[status] || STATUS_CONFIGS['Pending'];
    statusBadge.className = config.className;
    statusBadge.innerHTML = config.html;
  }

  // Function to get status class for dropzone
  function getStatusClass(status) {
    switch (status) {
      case 'Verified':
        return 'status-verified';
      case 'Pending':
        return 'status-pending';
      case 'Needs Revision':
        return 'status-needs-revision';
      case 'Rejected':
        return 'status-rejected';
      default:
        return 'selected';
    }
  }

  // Public API
  return {
    STATUS_TYPES: STATUS_TYPES,
    STATUS_CONFIGS: STATUS_CONFIGS,
    updateProgressBar: updateProgressBar,
    generateStatusCountsHTML: generateStatusCountsHTML,
    applyStatusBadgeConfig: applyStatusBadgeConfig,
    getStatusClass: getStatusClass
  };
})();