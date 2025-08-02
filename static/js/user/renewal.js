/**
 * User Renewal Module
 * Handles UI interactions for the renewal page with file upload functionality
 * FIXED VERSION - Addresses button responsiveness issues
 */

(function() {
  // Initialize when DOM is loaded
  document.addEventListener('DOMContentLoaded', function() {
    // Show loading overlay
    const loadingOverlay = document.getElementById('loadingOverlay');
    const documentCardsContainer = document.getElementById('documentCardsContainer');
    
    if (loadingOverlay) {
      loadingOverlay.classList.remove('hidden');
    }
    
    if (documentCardsContainer) {
      documentCardsContainer.classList.remove('loaded');
    }
    
    // Initialize UI elements
    initializeUI();
    // Load renewal files
    loadRenewalFiles();
    // Load feedback
    loadRenewalFeedback();
  });

  // Function to initialize UI elements
  function initializeUI() {
    setupDropzoneEvents();
    setupButtonEvents();
    setupFeedbackEvents();
    
    // Initialize button states
    initializeButtonStates();
  }
  
  // Function to initialize button states
  function initializeButtonStates() {
    // Get all document cards
    const cards = document.querySelectorAll('.document-card');
    
    cards.forEach(card => {
      // Get buttons using class selectors
      const selectBtn = card.querySelector('.select-btn');
      const uploadBtn = card.querySelector('.upload-btn');
      const previewBtn = card.querySelector('.preview-btn');
      const fileInput = card.querySelector('.file-input');
      
      // Set initial button states
      if (selectBtn) {
        DOMUtils.setButtonState(selectBtn, DOMUtils.BUTTON_STATES.ENABLED.SELECT);
      }
      
      if (uploadBtn) {
        DOMUtils.setButtonState(uploadBtn, DOMUtils.BUTTON_STATES.DISABLED.UPLOAD);
      }
      
      if (previewBtn) {
        DOMUtils.setButtonState(previewBtn, DOMUtils.BUTTON_STATES.DISABLED.PREVIEW);
      }
    });
  }

  // Function to set up dropzone events - FIXED VERSION
function setupDropzoneEvents() {
  // Get all dropzones
  const dropzones = document.querySelectorAll('.dropzone');
  
  dropzones.forEach(dropzone => {
    // Get the parent card
    const card = dropzone.closest('.document-card');
    if (!card) return;
    
    // Get the file input
    const fileInput = card.querySelector('.file-input');
    if (!fileInput) return;
    
    // Check if events are already attached to prevent duplicates
    if (dropzone.dataset.eventsAttached === 'true') {
      return;
    }
    
    // Mark that events are attached
    dropzone.dataset.eventsAttached = 'true';
    
    // Set up click event on dropzone - BUT NOT on buttons inside it
    dropzone.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Check if the click came from a button - if so, don't trigger file input
      if (e.target.closest('button') || e.target.closest('.btn')) {
        return; // Let the button handle its own click
      }
      
      // Only trigger file input if clicking directly on dropzone area
      fileInput.click();
    });
    
    // Set up drag and drop events
    dropzone.addEventListener('dragover', function(e) {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('dragover');
    });
    
    dropzone.addEventListener('dragleave', function(e) {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
    });
    
    dropzone.addEventListener('drop', function(e) {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
      
      if (e.dataTransfer.files.length > 0) {
        fileInput.files = e.dataTransfer.files;
        fileInput.dispatchEvent(new Event('change'));
      }
    });
  });
}
  
  // Helper function to format file size
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  // Function to handle file selection - FIXED VERSION
function handleFileSelected(input, card) {
  if (!input.files.length) return;
  
  const file = input.files[0];
  
  // Validate file type - only allow PDF files
  const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  if (file.type !== 'application/pdf' || fileExtension !== '.pdf') {
    alert('Only PDF files are allowed for renewal documents.');
    input.value = '';
    return;
  }
  
  // Update dropzone to show selected file with document title instead of filename
  const dropzone = card.querySelector('.dropzone');
  if (dropzone) {
    // Get the document title from the card
    const documentTitle = card.querySelector('.small.fw-semibold')?.textContent?.trim() || file.name;
    
    dropzone.innerHTML = `
      <i class="fas fa-file-alt mb-1"></i>
      <div>${documentTitle}</div>
      <div class="small text-muted">${(file.size / 1024).toFixed(2)} KB</div>
    `;
    
    dropzone.classList.add('selected');
  }
  
  // Get buttons using improved selectors
  const uploadBtn = card.querySelector('button.upload-btn, .btn:nth-of-type(3)');
  const previewBtn = card.querySelector('button.preview-btn, .btn:nth-of-type(1)');
  
  // Enable upload button
  if (uploadBtn) {
    DOMUtils.setButtonState(uploadBtn, DOMUtils.BUTTON_STATES.ENABLED.UPLOAD);
  }
  
  // Disable preview button until file is uploaded (unless there's already an uploaded file)
  if (previewBtn) {
    const hasUploadedFile = card.dataset.fileId && card.dataset.fileId !== '';
    if (hasUploadedFile) {
      DOMUtils.setButtonState(previewBtn, DOMUtils.BUTTON_STATES.ENABLED.PREVIEW);
    } else {
      DOMUtils.setButtonState(previewBtn, DOMUtils.BUTTON_STATES.DISABLED.PREVIEW);
    }
  }
}

  // Function to upload a file - FIXED VERSION
function uploadFile(file, fileType, card) {
  // Show loading modal
  const loadingModal = document.getElementById('loadingModal');
  const loadingMessage = document.getElementById('loadingMessage');
  loadingMessage.textContent = 'Uploading file...';
  loadingModal.style.display = 'flex';
  
  // Get buttons using improved selectors
  const fileInput = card.querySelector('.file-input');
  const uploadBtn = card.querySelector('button.upload-btn, .btn:nth-of-type(3)');
  const previewBtn = card.querySelector('button.preview-btn, .btn:nth-of-type(1)');
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileType', fileType);
  
  // Check if we have a file ID already (for replacement)
  if (card.dataset.fileId) {
    formData.append('replaceFileId', card.dataset.fileId);
  }
  
  // Get CSRF token from meta tag
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || 
                   document.querySelector('[name="csrf_token"]')?.value;
  
  // Prepare headers for fetch request
  const headers = {
    'X-Requested-With': 'XMLHttpRequest'
  };
  
  if (csrfToken) {
    headers['X-CSRFToken'] = csrfToken;
  }
  
  fetch('/renewal/upload-renewal-file', {
    method: 'POST',
    headers: headers,
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    loadingModal.style.display = 'none';
    
    if (data.success) {
      // Set the file ID on the card and status badge
      if (data.file_id) {
        card.dataset.fileId = data.file_id;
        
        // Also set on status badge for consistency with application.js
        const statusBadge = card.querySelector('.status-badge');
        if (statusBadge) {
          statusBadge.dataset.fileId = data.file_id;
        }
      }
      
      // Update the card status
      updateCardStatus(card, 'Pending', 'bg-primary', 'fa-clock');
      
      // Reset the file input value to allow selecting the same file again
      if (fileInput) {
        fileInput.value = '';
      }
      
      // Update dropzone to show uploaded state
      const dropzone = card.querySelector('.dropzone');
      if (dropzone) {
        dropzone.innerHTML = `
          <i class="fas fa-file-alt mb-1"></i>
          <div>File Uploaded</div>
          <div class="small text-muted">Just uploaded</div>
          <div class="small text-muted">Click to replace</div>
        `;
        dropzone.classList.add('selected');
      }
      
      // FIXED: Properly disable upload button and enable preview button
      if (uploadBtn) {
        DOMUtils.setButtonState(uploadBtn, DOMUtils.BUTTON_STATES.DISABLED.UPLOAD);
      }
      
      if (previewBtn) {
        DOMUtils.setButtonState(previewBtn, DOMUtils.BUTTON_STATES.ENABLED.PREVIEW);
      }
      
      // Check if all files are uploaded and update UI immediately
      checkIfAllFilesUploaded();
      
      // Reload all files to update the progress
      loadRenewalFiles();
      
      // Check again after loading files to ensure UI is consistent
      setTimeout(() => {
        checkIfAllFilesUploaded();
      }, 500); // Small delay to ensure loadRenewalFiles has completed
    } else {
      // Show error message
      alert(data.message || 'Error uploading file');
      // Reset the dropzone
      const dropzone = card.querySelector('.dropzone');
      if (dropzone) {
        dropzone.innerHTML = `
          <i class="fas fa-cloud-upload-alt mb-1"></i>
          <div class="text-center">Drag & Drop or Click to Upload<br>
          PDF files only</div>
        `;
        dropzone.classList.remove('selected');
      }
      
      // Clear file ID if upload failed
      delete card.dataset.fileId;
      
      // Clear status badge file ID
      const statusBadge = card.querySelector('.status-badge');
      if (statusBadge) {
        delete statusBadge.dataset.fileId;
      }
      
      // Disable upload button on error
      if (uploadBtn) {
        DOMUtils.setButtonState(uploadBtn, DOMUtils.BUTTON_STATES.DISABLED.UPLOAD);
      }
      
      // Disable preview button
      if (previewBtn) {
        DOMUtils.setButtonState(previewBtn, DOMUtils.BUTTON_STATES.DISABLED.PREVIEW);
      }
    }
  })
  .catch(error => {
    loadingModal.style.display = 'none';
    console.error('Error:', error);
    alert('An error occurred while uploading the file');
    // Reset the dropzone
    const dropzone = card.querySelector('.dropzone');
    if (dropzone) {
      dropzone.innerHTML = `
        <i class="fas fa-cloud-upload-alt mb-1"></i>
        <div class="text-center">Drag & Drop or Click to Upload<br>
        PDF files only</div>
      `;
      dropzone.classList.remove('selected');
    }
  });
}

// Updated setupButtonEvents function to work with the fixed dropzone
function setupButtonEvents() {
  // Get all document cards
  const cards = document.querySelectorAll('.document-card');
  
  cards.forEach(card => {
    // Get the file input
    const fileInput = card.querySelector('.file-input');
    if (!fileInput) {
      return;
    }
    
    // Get buttons using more specific selectors
    const selectBtn = card.querySelector('button.select-btn, .btn:nth-of-type(2)');
    const uploadBtn = card.querySelector('button.upload-btn, .btn:nth-of-type(3)');
    const previewBtn = card.querySelector('button.preview-btn, .btn:nth-of-type(1)');
    
    // Check if events are already attached to prevent duplicates
    if (fileInput.dataset.eventsAttached === 'true') {
      return;
    }
    
    // Mark that events are attached
    fileInput.dataset.eventsAttached = 'true';
    
    // Set up file input change event (only once)
    fileInput.addEventListener('change', function(e) {
      e.stopPropagation();
      handleFileSelected(this, card);
    }, { once: false, passive: true });
    
    // Set up select button click event
    if (selectBtn && !selectBtn.dataset.eventsAttached) {
      selectBtn.dataset.eventsAttached = 'true';
      DOMUtils.setButtonState(selectBtn, DOMUtils.BUTTON_STATES.ENABLED.SELECT);
      
      selectBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Clear the file input value
        fileInput.value = '';
        
        // Trigger file picker with a small delay to prevent issues
        setTimeout(() => {
          fileInput.click();
        }, 10);
      }, { once: false, passive: false });
    }
    
    // Set up upload button click event
    if (uploadBtn && !uploadBtn.dataset.eventsAttached) {
      uploadBtn.dataset.eventsAttached = 'true';
      
      uploadBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (fileInput && fileInput.files.length) {
          const fileType = card.querySelector('.small.fw-semibold').textContent.trim();
          uploadFile(fileInput.files[0], fileType, card);
        }
      }, { once: false, passive: false });
    }
    
    // Set up preview button click event
    if (previewBtn && !previewBtn.dataset.eventsAttached) {
      previewBtn.dataset.eventsAttached = 'true';
      
      previewBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const fileId = card.dataset.fileId;
        if (fileId) {
          previewFile(fileId);
        } else {
          alert('No file available for preview');
        }
      }, { once: false, passive: false });
    }
  });
}
  
  // Helper function to reset event listeners
  function resetEventListeners() {
    // Reset file input event listeners
    document.querySelectorAll('.file-input').forEach(input => {
      delete input.dataset.eventsAttached;
    });
    
    // Reset button event listeners
    document.querySelectorAll('.select-btn, .upload-btn, .preview-btn, .btn').forEach(btn => {
      delete btn.dataset.eventsAttached;
    });
    
    // Reset dropzone event listeners
    document.querySelectorAll('.dropzone').forEach(dropzone => {
      delete dropzone.dataset.eventsAttached;
    });
  }
  
  // Function to preview a file
  function previewFile(fileId) {
    if (!fileId) {
      alert('No file available for preview');
      return;
    }
    
    // Get the file name from the card
    const card = document.querySelector(`.document-card[data-file-id="${fileId}"]`);
    const fileName = card ? card.querySelector('.small.fw-semibold')?.textContent?.trim() || 'File' : 'File';
    
    // Use the FilePreview module to show the file in a modal
    FilePreview.previewFile(fileId, fileName, (id) => {
      return `/renewal/get-renewal-file/${id}`;
    });
  }

  // Function to set up feedback events
  function setupFeedbackEvents() {
    // Get all feedback toggle buttons
    const feedbackToggles = document.querySelectorAll('.inline-feedback-toggle');
    
    feedbackToggles.forEach(toggle => {
      toggle.addEventListener('click', function() {
        const card = toggle.closest('.document-card');
        const feedbackContainer = card.querySelector('.inline-feedback-container');
        
        if (feedbackContainer) {
          // Toggle visibility
          if (feedbackContainer.style.display === 'block') {
            feedbackContainer.style.display = 'none';
            toggle.setAttribute('aria-expanded', 'false');
          } else {
            feedbackContainer.style.display = 'block';
            toggle.setAttribute('aria-expanded', 'true');
            
            // Get the file ID from the card
            const fileId = card.dataset.fileId;
            if (fileId) {
              // Load feedback for this file
              loadFileFeedback(fileId, feedbackContainer);
            }
          }
        }
      });
    });
    
    // Set up close buttons for feedback containers
    document.querySelectorAll('.inline-feedback-close button').forEach(button => {
      button.addEventListener('click', function() {
        const feedbackContainer = button.closest('.inline-feedback-container');
        if (feedbackContainer) {
          feedbackContainer.style.display = 'none';
          const toggle = feedbackContainer.previousElementSibling;
          if (toggle && toggle.classList.contains('inline-feedback-toggle')) {
            toggle.setAttribute('aria-expanded', 'false');
          }
        }
      });
    });
  }

  function loadRenewalFiles() {
    // Show loading modal
    const loadingModal = document.getElementById('loadingModal');
    const loadingMessage = document.getElementById('loadingMessage');
    loadingMessage.textContent = 'Loading files...';
    loadingModal.style.display = 'flex';
    
    // Get CSRF token from meta tag
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || 
                     document.querySelector('[name="csrf_token"]')?.value;
    
    // Prepare headers for fetch request
    const headers = {
      'X-Requested-With': 'XMLHttpRequest'
    };
    
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }
    
    fetch('/renewal/get-renewal-files', {
      headers: headers,
      credentials: 'same-origin'
    })
      .then(response => response.json())
      .then(data => {
        loadingModal.style.display = 'none';
        
        if (data.success) {
          // First update the file cards with data
          updateFileCards(data.files);
          updateProgressBar(data.files);
          
          // FIXED: Re-setup button events after loading files
          // This ensures buttons work after dynamic content updates
          setupButtonEvents();
          
          // Hide loading overlay and show document cards
          setTimeout(() => {
            const loadingOverlay = document.getElementById('loadingOverlay');
            const documentCardsContainer = document.getElementById('documentCardsContainer');
            
            if (loadingOverlay) {
              loadingOverlay.classList.add('hidden');
            }
            
            if (documentCardsContainer) {
              documentCardsContainer.classList.add('loaded');
            }
            
            // Check if all files are uploaded after UI is updated
            checkIfAllFilesUploaded();
          }, 500); // Small delay to ensure all UI updates are complete
        } else {
          console.error('Error loading files:', data.message);
        }
      })
      .catch(error => {
        loadingModal.style.display = 'none';
        console.error('Error:', error);
        
        // Hide loading overlay in case of error
        const loadingOverlay = document.getElementById('loadingOverlay');
        const documentCardsContainer = document.getElementById('documentCardsContainer');
        
        if (loadingOverlay) {
          loadingOverlay.classList.add('hidden');
        }
        
        if (documentCardsContainer) {
          documentCardsContainer.classList.add('loaded');
        }
      });
  }
  
  // Function to load renewal feedback
  function loadRenewalFeedback() {
    // Get CSRF token from meta tag
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || 
                     document.querySelector('[name="csrf_token"]')?.value;
    
    // Prepare headers for fetch request
    const headers = {
      'X-Requested-With': 'XMLHttpRequest'
    };
    
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }
    
    fetch('/renewal/get-renewal-feedback', {
      headers: headers,
      credentials: 'same-origin'
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          updateFeedbackSection(data.feedbacks);
        } else {
          console.error('Error loading feedback:', data.message);
        }
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }
  
  // Function to load feedback for a specific file
  function loadFileFeedback(fileId, container) {
    // Get CSRF token from meta tag
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || 
                     document.querySelector('[name="csrf_token"]')?.value;
    
    // Prepare headers for fetch request
    const headers = {
      'X-Requested-With': 'XMLHttpRequest'
    };
    
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }
    
    fetch('/renewal/get-renewal-feedback', {
      headers: headers,
      credentials: 'same-origin'
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          const fileFeedback = data.feedbacks.filter(feedback => feedback.file_id === parseInt(fileId));
          
          if (fileFeedback.length > 0) {
            // Display the most recent feedback
            const feedback = fileFeedback[0];
            const feedbackTitle = container.querySelector('.inline-feedback-title');
            const feedbackDate = container.querySelector('.inline-feedback-date');
            const feedbackBody = container.querySelector('.inline-feedback-body');
            
            if (feedbackTitle) feedbackTitle.textContent = feedback.subject;
            if (feedbackDate) feedbackDate.textContent = feedback.date_sent;
            if (feedbackBody) feedbackBody.textContent = feedback.message;
          } else {
            // No feedback for this file
            const feedbackBody = container.querySelector('.inline-feedback-body');
            if (feedbackBody) feedbackBody.textContent = 'No feedback available for this file.';
          }
        } else {
          console.error('Error loading feedback:', data.message);
        }
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }
  
  // Function to update file cards based on loaded files - FIXED VERSION
function updateFileCards(files) {
  // Get all document cards
  const cards = document.querySelectorAll('.document-card');
  
  cards.forEach(card => {
    // Get the file type from the card title
    const fileType = card.querySelector('.small.fw-semibold')?.textContent?.trim();
    if (!fileType) return;
    
    // Find the matching file
    const file = files.find(f => f.name === fileType);
    
    // Get buttons for this card
    const selectBtn = card.querySelector('button.select-btn, .btn:nth-of-type(2)');
    const uploadBtn = card.querySelector('button.upload-btn, .btn:nth-of-type(3)');
    const previewBtn = card.querySelector('button.preview-btn, .btn:nth-of-type(1)');
    
    if (file) {
      // Update the card with file information
      card.dataset.fileId = file.id;
      
      // Update status badge
      const statusBadge = card.querySelector('.status-badge');
      if (statusBadge) {
        statusBadge.dataset.fileId = file.id;
      }
      
      updateCardStatus(card, file.status, getStatusClass(file.status), getStatusIcon(file.status));
      
      // Update dropzone content
      const dropzone = card.querySelector('.dropzone');
      if (dropzone) {
        dropzone.innerHTML = `
          <i class="fas fa-file-alt mb-1"></i>
          <div>File Uploaded</div>
          <div class="small text-muted">Submitted: ${file.submission_date ? formatDateTime(file.submission_date) : 'N/A'}</div>
          <div class="small text-muted">Click to replace</div>
        `;
        dropzone.classList.add('selected');
      }
      
      // Set button states for uploaded files
      if (selectBtn) {
        DOMUtils.setButtonState(selectBtn, DOMUtils.BUTTON_STATES.ENABLED.SELECT);
      }
      if (uploadBtn) {
        DOMUtils.setButtonState(uploadBtn, DOMUtils.BUTTON_STATES.DISABLED.UPLOAD);
      }
      if (previewBtn) {
        DOMUtils.setButtonState(previewBtn, DOMUtils.BUTTON_STATES.ENABLED.PREVIEW);
      }
    } else {
      // No file uploaded for this type
      card.dataset.fileId = '';
      
      // Update status badge
      const statusBadge = card.querySelector('.status-badge');
      if (statusBadge) {
        statusBadge.dataset.fileId = '';
        statusBadge.dataset.status = 'No File';
        statusBadge.textContent = 'No File';
        statusBadge.className = 'badge bg-secondary status-badge';
        statusBadge.innerHTML = '<i class="fas fa-question-circle"></i> No File';
      }
      
      // Update icon
      const statusIcon = card.querySelector('.status-icon');
      if (statusIcon) {
        statusIcon.className = 'fas fa-upload status-icon';
      }
      
      // Reset dropzone content
      const dropzone = card.querySelector('.dropzone');
      if (dropzone) {
        dropzone.innerHTML = `
          <i class="fas fa-cloud-upload-alt mb-1"></i>
          <div class="text-center">Drag & Drop or Click to Upload<br>
          PDF files only</div>
        `;
        dropzone.classList.remove('selected');
      }
      
      // Set button states for files not uploaded
      if (selectBtn) {
        DOMUtils.setButtonState(selectBtn, DOMUtils.BUTTON_STATES.ENABLED.SELECT);
      }
      if (uploadBtn) {
        DOMUtils.setButtonState(uploadBtn, DOMUtils.BUTTON_STATES.DISABLED.UPLOAD);
      }
      if (previewBtn) {
        DOMUtils.setButtonState(previewBtn, DOMUtils.BUTTON_STATES.DISABLED.PREVIEW);
      }
    }
  });
}
  
  // Function to update card status
  function updateCardStatus(card, status, statusClass, iconClass) {
    const statusBadge = card.querySelector('.status-badge');
    const statusIcon = card.querySelector('.status-icon');
    
    if (statusBadge) {
      // Use FileStatus module's applyStatusBadgeConfig if available
      if (FileStatus && typeof FileStatus.applyStatusBadgeConfig === 'function' && 
          FileStatus.STATUS_CONFIGS && FileStatus.STATUS_CONFIGS[status]) {
        FileStatus.applyStatusBadgeConfig(statusBadge, status);
      } else {
        // Fallback to our own implementation
        statusBadge.textContent = status;
        statusBadge.className = `badge ${statusClass} status-badge`;
      }
    }
    
    if (statusIcon) {
      statusIcon.className = `fas ${iconClass} status-icon`;
    }
  }
  
  /**
   * Formats a date string or Date object into Month day, year format with AM/PM time
   * @param {string|Date} dateInput - Date string or Date object to format
   * @return {string} Formatted date and time string in "Month day, year, hour:minutes AM/PM" format
   */
  function formatDateTime(dateInput) {
    if (!dateInput) {
      return 'N/A';
    }
    
    try {
      const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date input:', dateInput);
        return 'Invalid date';
      }
      
      // Array of month names
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      // Format date as Month day, year
      const year = date.getFullYear();
      const month = months[date.getMonth()];
      const day = date.getDate();
      const dateStr = `${month} ${day}, ${year}`;
      
      // Format time in 12-hour format with AM/PM (without seconds)
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      
      // Convert hours to 12-hour format
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      
      const timeStr = `${hours}:${minutes} ${ampm}`;
      
      return `${dateStr}, ${timeStr}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Error formatting date';
    }
  }
  
  // Function to get status class based on status
  function getStatusClass(status) {
    // Use FileStatus module's getStatusClass if available
    if (FileStatus && typeof FileStatus.getStatusClass === 'function') {
      const statusClass = FileStatus.getStatusClass(status);
      if (statusClass !== 'selected') {
        return statusClass.replace('status-', 'bg-');
      }
    }
    
    // Fallback to our own implementation
    switch (status) {
      case 'Verified': return 'bg-success';
      case 'Pending': return 'bg-primary';
      case 'Needs Revision': return 'bg-warning';
      case 'Rejected': return 'bg-danger';
      case 'Not Uploaded': 
      case 'No File': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  }
  
  // Function to get status icon based on status
  function getStatusIcon(status) {
    // Use FileStatus module's STATUS_TYPES if available
    if (FileStatus && FileStatus.STATUS_TYPES && FileStatus.STATUS_TYPES[status]) {
      return `fa-${FileStatus.STATUS_TYPES[status].icon}`;
    }
    
    // Fallback to our own implementation
    switch (status) {
      case 'Verified': return 'fa-check-circle';
      case 'Pending': return 'fa-clock';
      case 'Needs Revision': return 'fa-exclamation-circle';
      case 'Rejected': return 'fa-times-circle';
      case 'Not Uploaded': return 'fa-upload';
      case 'No File': return 'fa-question-circle';
      default: return 'fa-question-circle';
    }
  }
  
  // Function to update progress bar and status counts
  function updateProgressBar(files) {
    const totalFiles = document.querySelectorAll('.document-card').length;
    const uploadedFiles = files.length;
    
    // Reset counts in FileStatus.STATUS_TYPES
    Object.keys(FileStatus.STATUS_TYPES).forEach(key => {
      FileStatus.STATUS_TYPES[key].count = 0;
    });
    
    // Count files by status
    files.forEach(file => {
      const status = file.status || 'Pending';
      if (FileStatus.STATUS_TYPES[status]) {
        FileStatus.STATUS_TYPES[status].count++;
      } else {
        FileStatus.STATUS_TYPES['Pending'].count++;
      }
    });
    
    // Set Not Uploaded count to total - uploaded
    // This represents files with 'No File' status
    const notUploadedCount = totalFiles - uploadedFiles;
    
    // Update status counts in the UI
    const statusCountsHTML = FileStatus.generateStatusCountsHTML(FileStatus.STATUS_TYPES);
    const statusCountsContainer = document.querySelector('.d-flex.justify-content-between.small.text-secondary');
    if (statusCountsContainer) {
      statusCountsContainer.innerHTML = statusCountsHTML;
    }
    
    // Update progress bar using the common FileStatus module
    FileStatus.updateProgressBar(FileStatus.STATUS_TYPES['Verified'].count, totalFiles);
    
    // Update progress text if it exists
    const progressText = document.querySelector('.progress-text');
    if (progressText) {
      progressText.textContent = `${uploadedFiles} of ${totalFiles} files uploaded`;
    }
    
    // Check if all files are pending
    const allFilesPending = uploadedFiles === totalFiles && 
                          FileStatus.STATUS_TYPES['Verified'].count === 0 && 
                          FileStatus.STATUS_TYPES['Needs Revision'].count === 0 && 
                          FileStatus.STATUS_TYPES['Rejected'].count === 0 &&
                          FileStatus.STATUS_TYPES['Pending'].count === totalFiles;
                          
    if (allFilesPending) {
      console.log('All files are pending, setting UI to Pending status');
      const statusBadge = document.querySelector('.d-flex.justify-content-between.align-items-start.mb-3 .badge');
      const statusText = document.querySelector('.small.text-secondary.mb-1');
      if (statusBadge && statusText) {
        statusBadge.className = 'badge bg-primary';
        statusBadge.textContent = 'Pending';
        statusText.textContent = 'All files submitted, awaiting verification';
      }
      return; // Skip the regular updateApplicationStatusBadge call
    }
    
    // Update application status badge
    updateApplicationStatusBadge(files);
    
    // Check if all files are uploaded after updating the UI
    setTimeout(() => {
      checkIfAllFilesUploaded();
    }, 100);
  }

  
  // Function to update the application status badge
  function updateApplicationStatusBadge(files) {
    const statusBadge = document.querySelector('.d-flex.justify-content-between.align-items-start.mb-3 .badge');
    const statusText = document.querySelector('.small.text-secondary.mb-1');
    
    if (!statusBadge || !statusText) return;
    
    // Check if application status is available from the server
    const applicationStatus = document.getElementById('applicationStatus');
    if (applicationStatus && applicationStatus.value) {
      const status = applicationStatus.value;
      
      // Set badge based on application status from server
      switch(status) {
        case 'Verified':
          statusBadge.className = 'badge bg-success';
          statusBadge.textContent = 'Complete';
          statusText.textContent = 'All files verified';
          return;
        case 'Rejected':
          statusBadge.className = 'badge bg-danger';
          statusBadge.textContent = 'Rejected';
          statusText.textContent = 'Some files need attention';
          return;
        case 'Needs Revision':
          statusBadge.className = 'badge bg-warning';
          statusBadge.textContent = 'Needs Revision';
          statusText.textContent = 'Some files need revision';
          return;
        case 'Pending':
          statusBadge.className = 'badge bg-primary';
          statusBadge.textContent = 'Pending';
          statusText.textContent = 'Application is under review';
          return;
        case 'Incomplete':
          statusBadge.className = 'badge bg-secondary';
          statusBadge.textContent = 'Incomplete';
          statusText.textContent = 'Please upload all required files';
          return;
      }
    }
    
    // Fallback to file-based status if no application status is available
    if (files.length === 0) {
      statusBadge.className = 'badge bg-secondary';
      statusBadge.textContent = 'No Data';
      statusText.textContent = 'No renewal data available';
      return;
    }
    
    const totalRequired = document.querySelectorAll('.document-card').length;
    const verifiedCount = FileStatus.STATUS_TYPES['Verified'].count;
    const pendingCount = FileStatus.STATUS_TYPES['Pending'].count;
    const needsRevisionCount = FileStatus.STATUS_TYPES['Needs Revision'].count;
    const rejectedCount = FileStatus.STATUS_TYPES['Rejected'].count;
    
    if (verifiedCount === totalRequired) {
      statusBadge.className = 'badge bg-success';
      statusBadge.textContent = 'Complete';
      statusText.textContent = 'All files verified';
    } else if (rejectedCount > 0) {
      statusBadge.className = 'badge bg-danger';
      statusBadge.textContent = 'Rejected';
      statusText.textContent = 'Some files need attention';
    } else if (needsRevisionCount > 0) {
      statusBadge.className = 'badge bg-warning';
      statusBadge.textContent = 'Needs Revision';
      statusText.textContent = 'Some files need revision';
    } else if (pendingCount > 0 && files.length === totalRequired) {
      statusBadge.className = 'badge bg-primary';
      statusBadge.textContent = 'Pending';
      statusText.textContent = 'All files submitted, awaiting verification';
    } else {
      statusBadge.className = 'badge bg-secondary';
      statusBadge.textContent = 'Incomplete';
      statusText.textContent = `${files.length} of ${totalRequired} files submitted`;
    }
  }
  
  // Function to update feedback section
  function updateFeedbackSection(feedbacks) {
    const feedbackContainer = document.querySelector('.feedback-container');
    if (!feedbackContainer) return;
    
    if (feedbacks.length === 0) {
      feedbackContainer.innerHTML = '<p class="text-muted">No feedback available.</p>';
      return;
    }
    
    let feedbackHTML = '';
    feedbacks.forEach(feedback => {
      feedbackHTML += `
        <div class="feedback-item mb-3 p-3 border rounded">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h6 class="mb-0">${feedback.subject}</h6>
            <small class="text-muted">${feedback.date_sent}</small>
          </div>
          <p class="mb-0">${feedback.message}</p>
        </div>
      `;
    });
    
    feedbackContainer.innerHTML = feedbackHTML;
  }

  // Function to check if all required files are uploaded and update UI immediately
  function checkIfAllFilesUploaded() {
    // Get all document cards
    const cards = document.querySelectorAll('.document-card');
    
    // Get the total number of required files
    const totalRequired = parseInt(document.querySelector('.total-required')?.textContent || '0');
    
    // Check if all required files are uploaded
    let allFilesUploaded = true;
    let uploadedFileCount = 0;
    
    // Count files with file IDs (uploaded files)
    cards.forEach(card => {
      if (card.dataset.fileId) {
        uploadedFileCount++;
      } else {
        allFilesUploaded = false;
      }
    });
    
    console.log(`All files uploaded: ${allFilesUploaded}, Count: ${uploadedFileCount}/${totalRequired}`);
    
    // If all files are uploaded, update the UI immediately
    if (allFilesUploaded && uploadedFileCount === totalRequired) {
      console.log('All required files are uploaded, updating UI status...');
      
      // Update the status badge and text
      const statusBadge = document.querySelector('.status-badge');
      const statusText = document.querySelector('.status-text');
      
      if (statusBadge && statusText) {
        statusBadge.className = 'badge bg-primary';
        statusBadge.textContent = 'Pending';
        statusText.textContent = 'All files submitted, awaiting verification';
      }
      
      // Update the progress bar color
      const progressBar = document.querySelector('.progress-bar');
      if (progressBar) {
        progressBar.classList.remove('bg-secondary', 'bg-success', 'bg-danger', 'bg-warning');
        progressBar.classList.add('bg-primary');
      }
      
      // Update status counts in the UI
      document.querySelector('.pending-count').textContent = uploadedFileCount;
      document.querySelector('.verified-count').textContent = '0';
      document.querySelector('.needs-revision-count').textContent = '0';
      document.querySelector('.rejected-count').textContent = '0';
      
      // Optional: Show a toast notification if toastr is available
      if (typeof toastr !== 'undefined') {
        toastr.success('All files submitted successfully', 'Status Updated');
      }
    }
  }

  // Expose public functions
  window.checkIfAllFilesUploaded = checkIfAllFilesUploaded;

})();