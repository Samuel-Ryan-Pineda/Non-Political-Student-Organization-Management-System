// Prevent multiple script loading by checking if already initialized 
if (typeof window.ApplicationModule === 'undefined') { 
  window.ApplicationModule = true; 

  const DOM = { 
    getById: (id) => document.getElementById(id), 
    getAll: (selector) => document.querySelectorAll(selector) 
  }; 

  // Preview modal constants and functions 
  const PREVIEW_MODAL = { 
    TIMEOUT_MS: 10000, 
    ANIMATION_DELAY_MS: 300, 
    ICONS: { 
      WORD: 'fa-file-word text-primary', 
      ERROR: 'fa-exclamation-circle text-danger', 
      WARNING: 'fa-exclamation-triangle text-danger', 
      TIMEOUT: 'fa-clock text-warning' 
    }, 
    CONTENT_TYPES: { 
      WORD: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'] 
    } 
  };

  const FILE_TYPES = {
    VALID_EXTENSIONS: ['pdf'],
    ACCEPT_TYPES: '.pdf,.doc,.docx'
  };

  const BUTTON_STATES = {
    DISABLED: {
      UPLOAD: { disabled: true, addClasses: ['btn-secondary'], removeClasses: ['btn-primary'] },
      PREVIEW: { disabled: true, addClasses: ['btn-secondary'], removeClasses: ['btn-outline-dark'] }
    },
    ENABLED: {
      UPLOAD: { disabled: false, addClasses: ['btn-primary'], removeClasses: ['btn-secondary'] },
      PREVIEW: { disabled: false, addClasses: ['btn-outline-dark'], removeClasses: ['btn-secondary'] }
    }
  };

  // Status tracking configuration
  const STATUS_TYPES = {
    'Verified': { icon: 'check-circle', color: 'success', count: 0 },
    'Pending': { icon: 'clock', color: 'primary', count: 0 },
    'Needs Revision': { icon: 'exclamation-circle', color: 'warning', count: 0 },
    'Rejected': { icon: 'times-circle', color: 'danger', count: 0 }
  };

  // Status badge configurations
  const STATUS_CONFIGS = {
    'Verified': {
      className: 'badge bg-success status-badge',
      html: '<i class="fas fa-check"></i> Verified'
    },
    'Needs Revision': {
      className: 'badge bg-warning text-dark status-badge',
      html: '<i class="fas fa-exclamation"></i> Needs Revision'
    },
    'Rejected': {
      className: 'badge bg-danger status-badge',
      html: '<i class="fas fa-times"></i> Rejected'
    },
    'Pending': {
      className: 'badge bg-primary status-badge',
      html: '<i class="fas fa-clock"></i> Pending'
    }
  };

  // Tab management functions
  function showTab(tabId) {
    // Hide all tab contents and deactivate buttons
    DOM.getAll('.feedback-tab-content').forEach(tab => tab.classList.remove('active'));
    DOM.getAll('.feedback-tab').forEach(button => button.classList.remove('active'));
    
    // Show selected tab and activate button
    const tabElement = DOM.getById(tabId + '-tab');
    const buttonElement = DOM.getById(tabId + '-tab-btn');
    
    if (tabElement) tabElement.classList.add('active');
    if (buttonElement) buttonElement.classList.add('active');
  }

  // Modal management functions
  function toggleModal(modalId, show) {
    const modal = DOM.getById(modalId);
    if (!modal) return;
    
    if (show) {
      modal.classList.add('show');
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    } else {
      modal.classList.remove('show');
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  function openReplyModal(feedbackDate) {
    toggleModal('replyModal', true);
  }

  function closeReplyModal() {
    toggleModal('replyModal', false);
  }

  function openUpdateOrgModal() {
    toggleModal('updateOrgModal', true);
  }

  function closeUpdateOrgModal() {
    toggleModal('updateOrgModal', false);
  }

  function openFeedbackDetail(tabType, id) {
    alert('Opening details for ' + tabType + ' feedback #' + id);
    // Implement detailed view functionality here
  }

  // Button state management helper
  function setButtonState(button, state) {
    if (!button || !state) return;
    
    button.disabled = state.disabled;
    state.addClasses.forEach(cls => button.classList.add(cls));
    state.removeClasses.forEach(cls => button.classList.remove(cls));
  }

  // Initialize when DOM is loaded
  document.addEventListener('DOMContentLoaded', function() {
    // Initialize all dropzones and file upload buttons
    initializeFileUploads();
    
    // Load existing files
    loadApplicationFiles();
    
    // Initialize progress line and status counts
    updateProgressAndStatusCounts();
    
    // Set up reply form submission
    const replyForm = DOM.getById('reply-form');
    if (replyForm) {
      replyForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const subject = DOM.getById('reply-subject').value;
        const message = DOM.getById('reply-message').value;
        
        if (!subject || !message) {
          alert('Please fill in all required fields.');
          return;
        }
        
        alert('Reply sent successfully!');
        this.reset();
        closeReplyModal();
      });
    }
  });


  // Helper functions for preview modal
  function createModalContent(fileType, modalContentClass, content) {
    return `
      <div class="${modalContentClass}">
        <div class="preview-header d-flex justify-content-between align-items-center p-3 bg-light border-bottom">
          <h6 class="m-0">${fileType}</h6>
          ${content.headerButtons || '<button type="button" class="btn-close" aria-label="Close"></button>'}
        </div>
        <div class="preview-body p-0 ${content.bodyClass || ''}">
          ${content.body}
        </div>
      </div>
    `;
  }

  function createMessageContent(icon, title, message, buttons) {
    return {
      bodyClass: 'd-flex flex-column align-items-center justify-content-center text-center p-4',
      body: `
        <div class="mb-4">
          <i class="fas ${icon}" style="font-size: 4rem;"></i>
        </div>
        <h4 class="mb-3">${title}</h4>
        <p class="mb-4">${message}</p>
        ${buttons}
      `
    };
  }

  function addCloseButtonListener(modal) {
    const closeButton = modal.querySelector('.btn-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        modal.classList.remove('show');
        setTimeout(() => {
          // Make sure to completely remove the modal from the DOM
          const modalElement = document.getElementById(modal.id);
          if (modalElement) {
            modalElement.remove();
          }
        }, PREVIEW_MODAL.ANIMATION_DELAY_MS);
      });
    } else {
      // Close button not found in modal
    }
  }

  // Helper function to ensure a modal is in the DOM
  function ensureModalInDOM(modal, modalId) {
    if (!document.getElementById(modalId)) {
      document.body.appendChild(modal);
      // Modal added to DOM
      return true;
    }
    return false;
  }

  function previewFile(fileType) {
    // First, remove any existing preview modal
    const existingPreviewModal = document.getElementById('previewModal');
    if (existingPreviewModal) {
      existingPreviewModal.remove();
      // Removed existing preview modal
    }
    
    const cards = document.querySelectorAll('.document-card');
    let fileId = null;
    
    cards.forEach(card => {
      const cardTitle = card.querySelector('.fw-semibold').textContent.trim();
      if (cardTitle === fileType) {
        const statusBadge = card.querySelector('.status-badge');
        fileId = statusBadge.dataset.fileId;
      }
    });

    if (!fileId) {
      // Could not find file ID for this file type
      return;
    }

    showLoadingModal('Loading preview...');
    
    const isSidebarVisible = window.innerWidth > 768 || 
                          !document.querySelector('.custom-sidebar')?.classList.contains('mobile-active');
    
    const previewModal = document.createElement('div');
    previewModal.className = 'global-modal';
    previewModal.id = 'previewModal';
    
    const modalContentClass = isSidebarVisible ? 'modal-content p-0 preview-modal-content' : 
                                              'modal-content p-0 preview-modal-content ml-0';
    
    const timestamp = new Date().getTime();
    const previewUrl = `/get-application-file/${fileId}?t=${timestamp}`;
    
    fetch(previewUrl, { method: 'HEAD' })
      .then(response => {
        const contentType = response.headers.get('Content-Type');
        const isWordDocument = contentType && 
          PREVIEW_MODAL.CONTENT_TYPES.WORD.some(type => contentType.includes(type));
        
        if (isWordDocument) {
          const content = createMessageContent(
            PREVIEW_MODAL.ICONS.WORD,
            'Word Document Preview',
            'Word documents cannot be previewed directly in the browser. You can download the file to view it.',
            `<a href="${previewUrl}&download=true" class="btn btn-primary" download>
              <i class="fas fa-download me-2"></i>Download Document
            </a>`
          );
          
          previewModal.innerHTML = createModalContent(fileType, modalContentClass, content);
          
          // Make sure the modal is in the DOM
          ensureModalInDOM(previewModal, 'previewModal');
          
          hideLoadingModal();
          previewModal.classList.add('show');
          
          addCloseButtonListener(previewModal);
        } else {
          const headerButtons = `
            <div>
              <a href="${previewUrl}&download=true" class="btn btn-sm btn-outline-primary me-2" download>
                <i class="fas fa-download"></i> Download
              </a>
              <button type="button" class="btn-close" aria-label="Close"></button>
            </div>
          `;
          
          const content = {
            headerButtons,
            body: `<iframe id="previewFrame" class="preview-iframe" title="File Preview" width="100%" height="100%"></iframe>`
          };
          
          previewModal.innerHTML = createModalContent(fileType, modalContentClass, content);
          
          // Make sure the modal is in the DOM
          ensureModalInDOM(previewModal, 'previewModal');
          
          addCloseButtonListener(previewModal);
          
          const previewFrame = document.getElementById('previewFrame');
          if (!previewFrame) {
            // Preview frame not found after creating modal
            hideLoadingModal();
            return;
          }
          
          previewFrame.onload = function() {
            hideLoadingModal();
            previewModal.classList.add('show');
          };
          
          previewFrame.onerror = function() {
            hideLoadingModal();
            
            // Get a reference to the current preview modal (it might have been removed)
            const currentPreviewModal = document.getElementById('previewModal') || previewModal;
            
            const content = createMessageContent(
              PREVIEW_MODAL.ICONS.ERROR,
              'Preview Error',
              'There was an error loading the file preview. The file may be corrupted or in an unsupported format.',
              `<a href="${previewUrl}&download=true" class="btn btn-primary" download>
                <i class="fas fa-download me-2"></i>Download File
              </a>`
            );
            
            // Make sure the modal is in the DOM
            ensureModalInDOM(currentPreviewModal, 'previewModal');
            
            currentPreviewModal.innerHTML = createModalContent(fileType, modalContentClass, content);
            currentPreviewModal.classList.add('show');
            
            addCloseButtonListener(currentPreviewModal);
          };
          
          // Add a small delay before setting the src to ensure the iframe is fully in the DOM
          setTimeout(() => {
            previewFrame.src = previewUrl;
          }, 50);
          
          // Set a timeout to handle cases where the preview takes too long to load
          const previewTimeoutId = setTimeout(() => {
            // Check if loading modal still exists (indicating preview hasn't loaded yet)
            if (document.getElementById('loadingModal')) {
              hideLoadingModal();
              
              // Check if the preview modal exists and isn't showing yet
              const currentPreviewModal = document.getElementById('previewModal') || previewModal;
              if (currentPreviewModal && !currentPreviewModal.classList.contains('show')) {
                // Make sure the modal is in the DOM
                ensureModalInDOM(currentPreviewModal, 'previewModal');
                const content = createMessageContent(
                  PREVIEW_MODAL.ICONS.TIMEOUT,
                  'Preview Timeout',
                  'The file preview is taking too long to load. You can try again or download the file.',
                  `<div class="d-flex gap-3">
                    <button class="btn btn-outline-secondary" onclick="window.ApplicationModule && previewFile('${fileType}')">
                      <i class="fas fa-redo me-2"></i>Try Again
                    </button>
                    <a href="${previewUrl}&download=true" class="btn btn-primary" download>
                      <i class="fas fa-download me-2"></i>Download File
                    </a>
                  </div>`
                );
                
                currentPreviewModal.innerHTML = createModalContent(fileType, modalContentClass, content);
                currentPreviewModal.classList.add('show');
                
                addCloseButtonListener(currentPreviewModal);
              }
            }
          }, PREVIEW_MODAL.TIMEOUT_MS);
        }
      })
      .catch(error => {
        hideLoadingModal();
        
        // Get a reference to the current preview modal (it might have been removed)
        const currentPreviewModal = document.getElementById('previewModal') || previewModal;
        
        const content = createMessageContent(
          PREVIEW_MODAL.ICONS.WARNING,
          'Connection Error',
          'There was an error connecting to the server. Please check your internet connection and try again.',
          `<button class="btn btn-primary" onclick="window.ApplicationModule && previewFile('${fileType}')">
            <i class="fas fa-redo me-2"></i>Try Again
          </button>`
        );
        
        // Make sure the modal is in the DOM
        ensureModalInDOM(currentPreviewModal, 'previewModal');
        
        currentPreviewModal.innerHTML = createModalContent(fileType, modalContentClass, content);
        currentPreviewModal.classList.add('show');
        
        addCloseButtonListener(currentPreviewModal);
      });
  }

  function initializeFileUploads() {
    // Add event listeners to each dropzone
    DOM.getAll('.dropzone').forEach((dropzone) => {
      const card = dropzone.closest('.card');
      const fileType = card.querySelector('.fw-semibold').textContent.trim();
      const previewBtn = card.querySelector('button:nth-child(1)');
      const selectBtn = card.querySelector('button:nth-child(2)');
      const uploadBtn = card.querySelector('button:nth-child(3)');
      
      // Initially disable buttons
      setButtonState(uploadBtn, BUTTON_STATES.DISABLED.UPLOAD);
      setButtonState(previewBtn, BUTTON_STATES.DISABLED.PREVIEW);
      
      // Create hidden file input
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = FILE_TYPES.ACCEPT_TYPES;
      fileInput.style.display = 'none';
      fileInput.dataset.fileType = fileType;
      card.appendChild(fileInput);
      
      // Set up event listeners
      setupDropzoneEvents(dropzone, fileInput, fileType, uploadBtn);
      setupButtonEvents(selectBtn, uploadBtn, previewBtn, fileInput, fileType, card);
    });
  }

  function setupDropzoneEvents(dropzone, fileInput, fileType, uploadBtn) {
    // Drag and drop events
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
    
    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });
    
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      
      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        handleFileSelected(fileInput, dropzone, fileType, uploadBtn);
      }
    });
    
    // Click on dropzone to select file
    dropzone.addEventListener('click', () => {
      // Reset the file input value before clicking to ensure change event fires
      // even if the same file is selected again
      fileInput.value = '';
      fileInput.click();
    });
  }

  function setupButtonEvents(selectBtn, uploadBtn, previewBtn, fileInput, fileType, card) {
    const dropzone = card.querySelector('.dropzone');
    
    // Select file button
    selectBtn.addEventListener('click', () => {
      // Reset the file input value before clicking to ensure change event fires
      // even if the same file is selected again
      fileInput.value = '';
      fileInput.click();
    });
    
    // File selected event
    fileInput.addEventListener('change', () => {
      handleFileSelected(fileInput, dropzone, fileType, uploadBtn);
    });
    
    // Upload button
    uploadBtn.addEventListener('click', () => {
      if (fileInput.files.length > 0) {
        uploadFile(fileInput.files[0], fileType, card);
      } else {
        alert('Please select a file first');
      }
    });
    
    // Preview button
    previewBtn.addEventListener('click', () => {
      if (!previewBtn.disabled) {
        previewFile(fileType);
      }
    });
  }

  function handleFileSelected(fileInput, dropzone, fileType, uploadBtn) {
    const card = dropzone.closest('.card');
    const previewBtn = card.querySelector('button:nth-child(1)');
    
    // Default state - disable buttons
    const disableButtons = () => {
      setButtonState(uploadBtn, BUTTON_STATES.DISABLED.UPLOAD);
      setButtonState(previewBtn, BUTTON_STATES.DISABLED.PREVIEW);
    };
    
    if (fileInput.files.length === 0) {
      disableButtons();
      return;
    }
    
    const file = fileInput.files[0];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    // Validate file type
    if (!FILE_TYPES.VALID_EXTENSIONS.includes(fileExtension)) {
      alert('Invalid file type. Please upload PDF documents only.');
      fileInput.value = '';
      disableButtons();
      return;
    }
    
    // Update dropzone to show selected file
    dropzone.innerHTML = `
      <i class="fas fa-file-alt mb-1"></i>
      <div>${file.name}</div>
      <div class="small text-muted">${(file.size / 1024).toFixed(1)} KB</div>
    `;
    
    // Reset dropzone styles to default selected state
    dropzone.classList.add('selected');
    
    // Enable upload button when valid file is selected
    setButtonState(uploadBtn, BUTTON_STATES.ENABLED.UPLOAD);
    
    // Keep preview button disabled until file is actually uploaded
    setButtonState(previewBtn, BUTTON_STATES.DISABLED.PREVIEW);
  }

  function uploadFile(file, fileType, card) {
    // Prepare form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', fileType);
    
    // Get UI elements
    const statusBadge = card.querySelector('.status-badge');
    const uploadBtn = card.querySelector('button:nth-child(3)');
    const fileInput = card.querySelector('input[type="file"]');
    
    // Show loading state
    statusBadge.className = 'badge bg-secondary status-badge';
    statusBadge.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    
    // Update dropzone to show loading state
    const dropzone = card.querySelector('.dropzone');
    if (dropzone) {
      dropzone.innerHTML = `
        <i class="fas fa-spinner fa-spin mb-1"></i>
        <div>Uploading...</div>
        <div class="small text-muted">${file.name}</div>
      `;
      
      // Set dropzone to loading style
      dropzone.classList.remove('selected');
      dropzone.classList.add('loading');
    }
    
    // Disable the upload button during upload
    setButtonState(uploadBtn, BUTTON_STATES.DISABLED.UPLOAD);
    
    // Handle upload errors
    const handleError = (message) => {
      statusBadge.className = 'badge bg-danger status-badge';
      statusBadge.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error';
      alert('Upload failed: ' + message);
      
      // Re-enable the upload button if upload fails
      setButtonState(uploadBtn, BUTTON_STATES.ENABLED.UPLOAD);
    };
    
    // Send the file to the server
    fetch('/upload-application-file', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Reset the file input value to allow selecting the same file again
        if (fileInput) {
          fileInput.value = '';
        }
        
        // Reload application files to update UI with the new file
        loadApplicationFiles();
        
        // Keep the upload button disabled after successful upload
        setButtonState(uploadBtn, BUTTON_STATES.DISABLED.UPLOAD);
      } else {
        handleError(data.message);
      }
    })
    .catch(error => {
      handleError('Network error');
    });
  }

  function loadApplicationFiles() {
    // Reset all cards to "No File" state first
    resetAllCards();
    
    // Then load existing files
    fetch('/get-application-files')
      .then(response => response.json())
      .then(data => {
        if (data.success && data.files) {
          // Update each file card with the file data
          data.files.forEach(file => {
            updateFileCard(file.name, file.id, file.status, file.submission_date);
          });
          
          // Update progress line and status counts
          updateProgressAndStatusCounts();
        }
      })
      .catch(error => {
      });
  }

// Helper function to reset all document cards to their initial state
  function resetAllCards() {
    DOM.getAll('.document-card').forEach(card => {
      // Reset status badge
      const statusBadge = card.querySelector('.status-badge');
      statusBadge.className = 'badge bg-secondary status-badge';
      statusBadge.innerHTML = '<i class="fas fa-question-circle"></i> No File';
      statusBadge.removeAttribute('data-file-id');
      statusBadge.removeAttribute('data-status');
      
      // Reset buttons
      const uploadBtn = card.querySelector('button:nth-child(3)');
      const previewBtn = card.querySelector('button:nth-child(1)');
      
      if (uploadBtn) setButtonState(uploadBtn, BUTTON_STATES.DISABLED.UPLOAD);
      if (previewBtn) setButtonState(previewBtn, BUTTON_STATES.DISABLED.PREVIEW);
      
      // Reset file input to allow selecting the same file again
      const fileInput = card.querySelector('input[type="file"]');
      if (fileInput) {
        fileInput.value = '';
      }
      
      // Reset dropzone
      const dropzone = card.querySelector('.dropzone');
      if (dropzone) {
        // Reset dropzone content
        dropzone.innerHTML = `
          <i class="fas fa-arrow-up mb-1"></i>
          Drag & drop or click to upload
        `;
        
        // Remove all status classes to reset to default style
        dropzone.classList.remove('selected', 'loading', 'status-verified', 'status-pending', 'status-needs-revision', 'status-rejected');
      }
    });
  }

  function deleteAllFiles() {
    if (!confirm('Are you sure you want to delete all application files? This action cannot be undone.')) {
      return;
    }
    
    // Show loading modal
    showLoadingModal('Deleting all files...');
    
    // Call the delete endpoint
    fetch('/delete-all-application-files')
      .then(response => response.json())
      .then(data => {
        // Remove loading modal
        hideLoadingModal();
        
        if (data.success) {
          // Refresh the file list and update progress
          loadApplicationFiles();
        } else {
          // Show error
          alert('Error: ' + data.message);
        }
      })
      .catch(error => {
        // Remove loading modal and show error
        hideLoadingModal();
        alert('Error deleting files: Network error');
      });
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
      }, PREVIEW_MODAL.ANIMATION_DELAY_MS);
    }
  }

  function updateFileCard(fileType, fileId, status, submissionDate) {
    // Find the card for this file type
    const targetCard = Array.from(DOM.getAll('.document-card')).find(card => {
      const cardTitle = card.querySelector('.fw-semibold').textContent.trim();
      return cardTitle === fileType;
    });
    
    if (!targetCard) return;
    
    // Get UI elements
    const statusBadge = targetCard.querySelector('.status-badge');
    const uploadBtn = targetCard.querySelector('button:nth-child(3)');
    const previewBtn = targetCard.querySelector('button:nth-child(1)');
    const dropzone = targetCard.querySelector('.dropzone');
    const fileInput = targetCard.querySelector('input[type="file"]');
    
    // Reset the file input to allow selecting the same file again
    if (fileInput) {
      fileInput.value = '';
    }
    
    // Update the status badge data attributes
    statusBadge.dataset.fileId = fileId;
    statusBadge.dataset.status = status; // Store status for counting
    statusBadge.dataset.submissionDate = submissionDate; // Store submission date
    
    // Set button states
    if (uploadBtn) setButtonState(uploadBtn, BUTTON_STATES.DISABLED.UPLOAD);
    if (previewBtn) setButtonState(previewBtn, BUTTON_STATES.ENABLED.PREVIEW);
    
    // Apply status badge configuration
    const config = STATUS_CONFIGS[status] || STATUS_CONFIGS['Pending'];
    statusBadge.className = config.className;
    statusBadge.innerHTML = config.html;
    
    // Update the dropzone to show that a file is uploaded
    if (dropzone) {
      // Update dropzone content
      dropzone.innerHTML = `
        <i class="fas fa-file-alt mb-1"></i>
        <div>File Uploaded</div>
        ${submissionDate ? `<div class="small text-muted">Submitted: ${submissionDate}</div>` : ''}
        <div class="small text-muted">Click to replace</div>
      `;
      
      // Remove all status classes first
      dropzone.classList.remove('selected', 'loading', 'status-verified', 'status-pending', 'status-needs-revision', 'status-rejected');
      
      // Add appropriate status class based on file status
      switch (status) {
        case 'Verified':
          dropzone.classList.add('status-verified');
          break;
        case 'Pending':
          dropzone.classList.add('status-pending');
          break;
        case 'Needs Revision':
          dropzone.classList.add('status-needs-revision');
          break;
        case 'Rejected':
          dropzone.classList.add('status-rejected');
          break;
        default:
          // Use default style for any other status
          dropzone.classList.add('selected');
      }
    }
    
    // Update progress and status counts
    updateProgressAndStatusCounts();
  }

  // Function to update progress line and status counts
  function updateProgressAndStatusCounts() {
    let totalFiles = 0;
    
    // Reset counts
    Object.keys(STATUS_TYPES).forEach(key => {
      STATUS_TYPES[key].count = 0;
    });
    
    // Count files by status
    DOM.getAll('.status-badge').forEach(badge => {
      // Only count badges that have a file ID (meaning a file is uploaded)
      if (!badge.dataset.fileId) return;
      
      totalFiles++;
      const status = badge.dataset.status || 'Pending';
      
      // Increment the appropriate counter
      if (STATUS_TYPES[status]) {
        STATUS_TYPES[status].count++;
      } else {
        STATUS_TYPES['Pending'].count++;
      }
    });
    
    // Generate status count HTML
    const statusCountsHTML = Object.entries(STATUS_TYPES).map(([status, config]) => {
      return `
        <div class="d-flex align-items-center gap-1">
          <i class="fas fa-${config.icon} text-${config.color}"></i>
          <span>${status}: ${config.count}</span>
        </div>
      `;
    }).join('');
    
    // Update status counts in the UI
    document.querySelector('.d-flex.justify-content-between.small.text-secondary').innerHTML = statusCountsHTML;
    
    // Calculate and update progress
    updateProgressBar(STATUS_TYPES['Verified'].count, totalFiles);
  }

  // Helper function to update progress bar
  function updateProgressBar(verifiedCount, totalFiles) {
    // Calculate progress percentage
    const progressPercentage = totalFiles > 0 ? Math.round((verifiedCount / totalFiles) * 100) : 0;
    
    // Get progress bar element
    const progressBar = document.querySelector('.progress-bar');
    
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
}

