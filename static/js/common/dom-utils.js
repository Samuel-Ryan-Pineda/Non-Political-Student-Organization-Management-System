/**
 * DOM Utilities Module
 * Provides helper functions for DOM manipulation
 */

window.DOMUtils = window.DOMUtils || (function() {
  // Button state configurations
  const BUTTON_STATES = {
    ENABLED: {
      UPLOAD: {
        text: 'Upload',
        icon: '', // Removed icon
        className: 'btn-primary'
      },
      PREVIEW: {
        text: 'Preview',
        icon: '', // Removed icon
        className: 'btn-outline-dark'
      },
      SELECT: {
        text: 'Select File',
        icon: '', // Removed icon
        className: 'btn-outline-secondary'
      }
    },
    DISABLED: {
      UPLOAD: {
        text: 'Upload',
        icon: '', // Removed icon
        className: 'btn-secondary'
      },
      PREVIEW: {
        text: 'Preview',
        icon: '', // Removed icon
        className: 'btn-outline-secondary'
      },
      SELECT: {
        text: 'Select File',
        icon: '', // Removed icon
        className: 'btn-outline-secondary'
      }
    }
  };

  // Helper function to get DOM elements
  function get(selector) {
    return document.querySelector(selector);
  }

  function getAll(selector) {
    return document.querySelectorAll(selector);
  }

  // Helper function to set button state
  function setButtonState(button, state) {
    if (!button) return;
    
    button.className = `btn ${state.className} btn-sm`;
    button.disabled = (state === BUTTON_STATES.DISABLED.SELECT || state === BUTTON_STATES.DISABLED.UPLOAD || state === BUTTON_STATES.DISABLED.PREVIEW);
    
    // If the button has an icon and state has an icon, update it
    const icon = button.querySelector('i');
    if (icon && state.icon) {
      if (state.icon === '') {
        // Remove the icon if it exists but state.icon is empty
        icon.remove();
        button.textContent = state.text;
      } else {
        icon.className = `fas ${state.icon}`;
      }
    } else if (state.icon && state.icon !== '') {
      // If no icon exists but state has non-empty icon, add it
      button.innerHTML = `<i class="fas ${state.icon}"></i> ${state.text}`;
    } else {
      // Just update text
      button.textContent = state.text;
    }
  }

  // Helper function to show a loading modal
  function showLoadingModal(message = 'Loading...') {
    // Remove any existing loading modal
    const existingModal = document.getElementById('loadingModal');
    if (existingModal) {
      existingModal.remove();
    }
    
    // Create new loading modal
    const loadingModal = document.createElement('div');
    loadingModal.className = 'global-modal';
    loadingModal.id = 'loadingModal';
    
    loadingModal.innerHTML = `
      <div class="modal-content p-0 loading-modal-content">
        <div class="d-flex flex-column align-items-center justify-content-center p-4">
          <div class="spinner-border text-primary mb-3" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mb-0">${message}</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(loadingModal);
    loadingModal.classList.add('show');
  }

  // Helper function to hide the loading modal
  function hideLoadingModal() {
    const loadingModal = document.getElementById('loadingModal');
    if (loadingModal) {
      loadingModal.classList.remove('show');
      setTimeout(() => {
        const modalElement = document.getElementById('loadingModal');
        if (modalElement) {
            modalElement.remove();
          }
      }, 300); // Animation delay
    }
  }

  // Helper function to toggle modal visibility
  function toggleModal(modalId, show) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    if (show) {
      modal.classList.add('show');
      document.body.style.overflow = 'hidden'; // Prevent scrolling
    } else {
      modal.classList.remove('show');
      document.body.style.overflow = ''; // Restore scrolling
    }
  }

  // Public API
  return {
    get: get,
    getAll: getAll,
    setButtonState: setButtonState,
    showLoadingModal: showLoadingModal,
    hideLoadingModal: hideLoadingModal,
    toggleModal: toggleModal,
    BUTTON_STATES: BUTTON_STATES
  };
})();